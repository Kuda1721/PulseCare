from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class DataQualityStatus(str, Enum):
    excellent = "excellent"
    good = "good"
    degraded = "degraded"
    poor = "poor"


class AlertSource(str, Enum):
    rule = "rule"
    ml = "ml"
    combined = "combined"


class AlertSeverity(str, Enum):
    info = "info"
    warning = "warning"
    high = "high"
    critical = "critical"


class VitalObservation(BaseModel):
    patient_id: str = Field(..., min_length=3)
    device_id: str = Field(..., min_length=3)
    timestamp_utc: datetime
    heart_rate: float | None = Field(None, ge=0, le=300)
    spo2: float | None = Field(None, ge=0, le=100)
    systolic_bp: float | None = Field(None, ge=20, le=260)
    diastolic_bp: float | None = Field(None, ge=20, le=180)
    temperature_c: float | None = Field(None, ge=25, le=45)
    respiratory_rate: float | None = Field(None, ge=4, le=80)
    source: str = "wearable"
    units: str = "standard"
    data_quality_flags: list[str] = Field(default_factory=list)

    @field_validator("timestamp_utc")
    @classmethod
    def ensure_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("timestamp_utc must include timezone information in UTC")
        return value.astimezone(timezone.utc)


class WaveformSegment(BaseModel):
    patient_id: str
    modality: Literal["ecg", "ppg", "respiration"]
    sample_rate_hz: float = Field(..., gt=0)
    start_time_utc: datetime
    end_time_utc: datetime
    signal_location: str = "chest"
    checksum: str
    quality_score: float = Field(..., ge=0, le=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Prediction(BaseModel):
    id: str
    model_version: str
    patient_id: str
    timestamp_utc: datetime
    prediction_type: str
    risk_score: float = Field(..., ge=0, le=1)
    uncertainty: float = Field(..., ge=0, le=1)
    explanation: list[str] = Field(default_factory=list)
    data_quality: DataQualityStatus = DataQualityStatus.good
    decision_state: Literal["research", "shadow", "clinician-review", "approved"] = "shadow"
    not_for_autonomous_clinical_use: bool = True


class AlertRecord(BaseModel):
    id: str
    patient_id: str
    source: AlertSource
    severity: AlertSeverity
    rationale: str
    acknowledged: bool = False
    resolved: bool = False
    assignment: str | None = None
    created_at_utc: datetime
    updated_at_utc: datetime


class QualitySummary(BaseModel):
    status: DataQualityStatus
    missingness_ratio: float = Field(ge=0, le=1)
    signal_quality_score: float = Field(ge=0, le=1)
    stale_minutes: int = 0
    warnings: list[str] = Field(default_factory=list)


UTC = timezone.utc
