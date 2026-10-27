from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Alert, AlertAction, Device, Patient, PredictionRecord, SystemEvent, VitalObservation


async def get_or_create_patient(session: AsyncSession, patient_id: str, patient_data: dict[str, Any]) -> Patient:
    patient = await session.get(Patient, patient_id)
    if patient is None:
        patient = Patient(id=patient_id, **patient_data)
        session.add(patient)
        await session.commit()
    return patient


async def get_or_create_device(session: AsyncSession, device_id: str, patient_id: str, device_data: dict[str, Any]) -> Device:
    device = await session.get(Device, device_id)
    if device is None:
        device = Device(id=device_id, patient_id=patient_id, **device_data)
        session.add(device)
        await session.commit()
    return device


async def save_observation(session: AsyncSession, payload: dict[str, Any]) -> VitalObservation:
    existing = await session.execute(
        select(VitalObservation).where(
            VitalObservation.patient_id == payload["patient_id"],
            VitalObservation.device_id == payload["device_id"],
            VitalObservation.timestamp_utc == payload["timestamp_utc"],
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ValueError("duplicate_observation")

    observation = VitalObservation(**payload)
    session.add(observation)
    await session.commit()
    await session.refresh(observation)
    return observation


async def list_timeline(session: AsyncSession, patient_id: str) -> list[dict[str, Any]]:
    vitals = (
        await session.execute(
            select(VitalObservation)
            .where(VitalObservation.patient_id == patient_id)
            .order_by(VitalObservation.timestamp_utc.desc())
        )
    ).scalars().all()
    alerts = (
        await session.execute(
            select(Alert)
            .where(Alert.patient_id == patient_id)
            .order_by(Alert.created_at.desc())
        )
    ).scalars().all()
    events = (
        await session.execute(
            select(SystemEvent)
            .where(SystemEvent.patient_id == patient_id)
            .order_by(SystemEvent.created_at.desc())
        )
    ).scalars().all()

    items: list[dict[str, Any]] = []
    for item in vitals:
        items.append({"type": "vital", "timestamp": item.timestamp_utc.isoformat(), "payload": item.raw_payload})
    for item in alerts:
        items.append({"type": "alert", "timestamp": item.created_at.isoformat(), "payload": {"severity": item.severity, "rationale": item.rationale}})
    for item in events:
        items.append({"type": "system", "timestamp": item.created_at.isoformat(), "payload": {"event_type": item.event_type, "message": item.message}})
    return sorted(items, key=lambda x: x["timestamp"], reverse=True)


async def list_alerts(
    session: AsyncSession,
    patient_id: str | None = None,
    severity: str | None = None,
    source: str | None = None,
    active_only: bool | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[Alert], int]:
    stmt = select(Alert)
    if patient_id:
        stmt = stmt.where(Alert.patient_id == patient_id)
    if severity:
        stmt = stmt.where(Alert.severity == severity)
    if source:
        stmt = stmt.where(Alert.source == source)
    if active_only is not None:
        if active_only:
            stmt = stmt.where(Alert.resolved.is_(False))
        else:
            stmt = stmt.where(Alert.resolved.is_(True))
    if start_date:
        stmt = stmt.where(Alert.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Alert.created_at <= end_date)

    count_result = await session.execute(stmt)
    total = len(count_result.scalars().all())

    stmt = stmt.order_by(Alert.created_at.desc()).offset(offset).limit(limit)
    result = await session.execute(stmt)
    alerts = result.scalars().all()
    return alerts, total


async def save_alert_action(session: AsyncSession, alert_id: int, action: str, actor: str, note: str | None = None, metadata: dict[str, Any] | None = None) -> AlertAction:
    alert = await session.get(Alert, alert_id)
    if alert is None:
        raise ValueError("alert_not_found")

    if action == "acknowledge":
        alert.acknowledged = True
        alert.acknowledgement_note = note
    elif action == "resolve":
        alert.resolved = True
        alert.acknowledged = True
        alert.acknowledgement_note = note

    audit = AlertAction(alert_id=alert.id, action=action, actor=actor, note=note, action_metadata=metadata or {})
    session.add(audit)
    await session.commit()
    await session.refresh(audit)
    return audit


async def save_prediction(session: AsyncSession, payload: dict[str, Any]) -> PredictionRecord:
    prediction = PredictionRecord(**payload)
    session.add(prediction)
    await session.commit()
    await session.refresh(prediction)
    return prediction


async def create_system_event(session: AsyncSession, patient_id: str | None, event_type: str, message: str, metadata: dict[str, Any] | None = None) -> None:
    event = SystemEvent(patient_id=patient_id, event_type=event_type, message=message, event_metadata=metadata or {})
    session.add(event)
    await session.commit()
