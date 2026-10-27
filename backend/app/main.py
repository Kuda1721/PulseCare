from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database import Base, engine, get_db, init_db
from app.models import Alert, AlertAction, ClinicianFeedback, Device, Patient, PredictionRecord, VitalObservation, WaveformSegmentRecord
from app.repositories import create_system_event, get_or_create_device, get_or_create_patient, list_alerts, list_timeline, save_alert_action, save_observation, save_prediction
from app.schemas import AlertRecord, Prediction, VitalObservation as VitalObservationSchema, WaveformSegment
from app.services.quality import quality_summary_from_observation
from app.services.rules import RULE_VERSION, RULESET_NAME, deduplicate_rule_outcomes, evaluate_rule_engine
from app.services.streaming import socket_registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    await init_db()
    yield


app = FastAPI(
    title="PulseCare Clinical Safety API",
    version="0.1.0",
    description="Clinical decision-support backend with ingestion, rule alerts, data quality checks, and streaming endpoints.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "pulsecare-backend"}


@app.post("/api/v1/vitals")
async def ingest_vitals(observation: VitalObservationSchema, db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    if not observation.patient_id or not observation.device_id:
        raise HTTPException(status_code=400, detail="patient_id and device_id are required")
    if observation.units not in {"standard", "metric"}:
        raise HTTPException(status_code=422, detail="Unsupported unit set for incoming observation")

    for field_name in ["heart_rate", "spo2", "systolic_bp", "diastolic_bp", "temperature_c"]:
        value = getattr(observation, field_name)
        if value is not None and (value <= 0 or value > 300):
            raise HTTPException(status_code=422, detail=f"{field_name} is outside the supported range")

    patient = await get_or_create_patient(db, observation.patient_id, {"name": f"Patient {observation.patient_id}", "age_band": "adult", "sex": "unknown", "diagnosis": "monitoring", "care_setting": "development", "clinician": "dev-clinician"})
    device = await get_or_create_device(db, observation.device_id, observation.patient_id, {"firmware_version": "demo-fw", "battery_level": 100.0, "signal_strength": 100.0, "sync_status": "connected", "sensor_quality": "good"})

    quality = quality_summary_from_observation(observation)
    record_payload = {
        "patient_id": observation.patient_id,
        "device_id": observation.device_id,
        "timestamp_utc": observation.timestamp_utc,
        "heart_rate": observation.heart_rate,
        "spo2": observation.spo2,
        "systolic_bp": observation.systolic_bp,
        "diastolic_bp": observation.diastolic_bp,
        "temperature_c": observation.temperature_c,
        "respiratory_rate": observation.respiratory_rate,
        "source": observation.source,
        "units": observation.units,
        "data_quality_flags": observation.data_quality_flags,
        "quality_status": quality.status.value,
        "raw_payload": observation.model_dump(mode="json"),
    }

    try:
        await save_observation(db, record_payload)
    except ValueError as exc:
        if str(exc) == "duplicate_observation":
            raise HTTPException(status_code=409, detail="Duplicate observation rejected") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    device_rule_data = {"sync_status": device.sync_status, "battery_level": device.battery_level, "signal_strength": device.signal_strength}
    rule_outcomes = evaluate_rule_engine(observation.model_dump(mode="json"), device_rule_data, quality.status.value)
    existing_alerts = (await db.execute(select(Alert).where(Alert.patient_id == observation.patient_id).order_by(Alert.created_at.desc()))).scalars().all()
    deduped = deduplicate_rule_outcomes([{"created_at": alert.created_at, "rule_code": alert.rule_code} for alert in existing_alerts], rule_outcomes)

    alert_records: list[dict[str, object]] = []
    for outcome in deduped:
        alert = Alert(
            patient_id=observation.patient_id,
            source="rule",
            severity=outcome.severity or "warning",
            rule_code=outcome.rule_code,
            rule_version=RULE_VERSION,
            rationale=outcome.rationale,
            observed_values={
                "heart_rate": observation.heart_rate,
                "spo2": observation.spo2,
                "systolic_bp": observation.systolic_bp,
                "diastolic_bp": observation.diastolic_bp,
                "temperature_c": observation.temperature_c,
            },
            threshold={"value": outcome.threshold, "label": RULESET_NAME},
            duration_seconds=outcome.duration_seconds,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        alert_records.append({"id": alert.id, "rule_code": alert.rule_code, "severity": alert.severity, "rationale": alert.rationale, "source": alert.source})

    await create_system_event(db, observation.patient_id, "vital_ingested", "Vital observation stored and validated", {"quality_status": quality.status.value})

    return {
        "status": "accepted",
        "quality": quality.model_dump(),
        "rule_alerts": alert_records,
        "message": "Raw readings stored unchanged; cleaned/derived observations are generated separately.",
        "not_for_autonomous_clinical_use": True,
    }


@app.post("/api/v1/waveforms")
async def ingest_waveform(segment: WaveformSegment, db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    if segment.quality_score < 0.2:
        raise HTTPException(status_code=422, detail="Waveform quality below minimum accepted threshold")
    if not segment.patient_id or not segment.checksum:
        raise HTTPException(status_code=400, detail="patient_id and checksum are required")

    stmt = select(Patient).where(Patient.id == segment.patient_id)
    patient = (await db.execute(stmt)).scalar_one_or_none()
    if patient is None:
        await get_or_create_patient(db, segment.patient_id, {"name": f"Patient {segment.patient_id}", "age_band": "adult", "sex": "unknown", "diagnosis": "monitoring", "care_setting": "development", "clinician": "dev-clinician"})

    waveform = WaveformSegmentRecord(
        patient_id=segment.patient_id,
        modality=segment.modality,
        sample_rate_hz=segment.sample_rate_hz,
        start_time_utc=segment.start_time_utc,
        end_time_utc=segment.end_time_utc,
        signal_location=segment.signal_location,
        checksum=segment.checksum,
        quality_score=segment.quality_score,
        segment_metadata=segment.metadata,
    )
    db.add(waveform)
    await db.commit()
    await db.refresh(waveform)
    return {
        "status": "accepted",
        "quality_score": segment.quality_score,
        "message": "Waveform metadata stored and passed to validation pipeline.",
        "waveform_id": waveform.id,
    }


@app.get("/api/v1/patients/{id}/timeline")
async def patient_timeline(id: str, db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    items = await list_timeline(db, id)
    return {
        "patient_id": id,
        "events": items,
        "pagination": {"page": 1, "page_size": 50, "total": len(items)},
    }


@app.get("/api/v1/patients/{id}/predictions")
async def patient_predictions(id: str, db: AsyncSession = Depends(get_db)) -> list[Prediction]:
    result = await db.execute(select(PredictionRecord).where(PredictionRecord.patient_id == id).order_by(PredictionRecord.timestamp_utc.desc()))
    predictions = result.scalars().all()
    return [Prediction(id=str(p.id), model_version=p.model_version, patient_id=p.patient_id, timestamp_utc=p.timestamp_utc, prediction_type=p.prediction_type, risk_score=p.risk_score, uncertainty=p.uncertainty, explanation=p.explanation, data_quality=p.data_quality, decision_state=p.decision_state, not_for_autonomous_clinical_use=p.not_for_autonomous_clinical_use) for p in predictions]


@app.get("/api/v1/alerts")
async def list_alerts_api(
    patient_id: str | None = Query(default=None, alias="patient"),
    severity: str | None = None,
    source: str | None = None,
    active: bool | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    offset = (page - 1) * page_size
    alerts, total = await list_alerts(db, patient_id=patient_id, severity=severity, source=source, active_only=active, start_date=start, end_date=end, offset=offset, limit=page_size)
    return {
        "items": [
            {
                "id": alert.id,
                "patient_id": alert.patient_id,
                "source": alert.source,
                "severity": alert.severity,
                "rationale": alert.rationale,
                "acknowledged": alert.acknowledged,
                "resolved": alert.resolved,
                "rule_code": alert.rule_code,
                "rule_version": alert.rule_version,
                "created_at": alert.created_at.isoformat(),
                "updated_at": alert.updated_at.isoformat(),
            }
            for alert in alerts
        ],
        "pagination": {"page": page, "page_size": page_size, "total": total},
    }


@app.post("/api/v1/alerts/{id}/acknowledge")
async def acknowledge_alert(id: str, note: str | None = None, actor: str = "clinician", db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    alert_id = int(id)
    await save_alert_action(db, alert_id, "acknowledge", actor, note=note, metadata={"timestamp_utc": datetime.now(timezone.utc).isoformat()})
    return {"status": "acknowledged", "alert_id": id}


@app.post("/api/v1/alerts/{id}/resolve")
async def resolve_alert(id: str, note: str | None = None, actor: str = "clinician", db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    alert_id = int(id)
    await save_alert_action(db, alert_id, "resolve", actor, note=note, metadata={"timestamp_utc": datetime.now(timezone.utc).isoformat()})
    return {"status": "resolved", "alert_id": id}


@app.post("/api/v1/predictions/{id}/feedback")
async def prediction_feedback(id: str, clinician: str = "unknown", choice: str = "insufficient_data", note: str | None = None, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    prediction_id = int(id)
    prediction = await db.get(PredictionRecord, prediction_id)
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    feedback = ClinicianFeedback(
        prediction_id=prediction_id,
        patient_id=prediction.patient_id,
        choice=choice,
        note=note,
        clinician=clinician,
    )
    db.add(feedback)
    await db.commit()
    return {"status": "recorded", "prediction_id": id}


@app.get("/api/v1/models/status")
async def model_status() -> dict[str, object]:
    return {
        "status": "research",
        "available": False,
        "require_clinician_review": True,
        "not_for_autonomous_clinical_use": True,
    }


@app.get("/api/v1/analytics")
async def analytics() -> dict[str, object]:
    return {
        "alert_burden": 0,
        "acknowledgement_time_minutes": 0,
        "device_uptime": 0.0,
        "model_availability": 0.0,
        "false_positive_feedback_rate": 0.0,
        "drift_status": "stable",
    }


@app.websocket("/api/v1/stream/patients/{id}")
async def stream_patient(websocket: WebSocket, id: str):
    await socket_registry.connect(id, websocket)
    try:
        await websocket.send_json({"patient_id": id, "message": "connected", "mode": "demo-replay"})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        socket_registry.disconnect(id, websocket)
