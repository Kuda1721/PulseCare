from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    age_band: Mapped[str | None] = mapped_column(String(32), nullable=True)
    sex: Mapped[str | None] = mapped_column(String(16), nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    care_setting: Mapped[str | None] = mapped_column(String(64), nullable=True)
    clinician: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    firmware_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    battery_level: Mapped[float] = mapped_column(Float, default=100.0)
    signal_strength: Mapped[float] = mapped_column(Float, default=100.0)
    sync_status: Mapped[str] = mapped_column(String(32), default="connected")
    sensor_quality: Mapped[str] = mapped_column(String(32), default="good")
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class VitalObservation(Base):
    __tablename__ = "vital_observations"
    __table_args__ = (
        UniqueConstraint(
            "patient_id",
            "device_id",
            "timestamp_utc",
            "heart_rate",
            "spo2",
            "systolic_bp",
            "diastolic_bp",
            "temperature_c",
            name="uq_vital_observation",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(ForeignKey("devices.id"), nullable=False)
    timestamp_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    heart_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    spo2: Mapped[float | None] = mapped_column(Float, nullable=True)
    systolic_bp: Mapped[float | None] = mapped_column(Float, nullable=True)
    diastolic_bp: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    respiratory_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(64), default="wearable")
    units: Mapped[str] = mapped_column(String(32), default="standard")
    data_quality_flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    quality_status: Mapped[str] = mapped_column(String(32), default="good")
    raw_payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class WaveformSegmentRecord(Base):
    __tablename__ = "waveform_segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    modality: Mapped[str] = mapped_column(String(32), nullable=False)
    sample_rate_hz: Mapped[float] = mapped_column(Float, nullable=False)
    start_time_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    signal_location: Mapped[str] = mapped_column(String(128), default="chest")
    checksum: Mapped[str] = mapped_column(String(128), nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, nullable=False)
    segment_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    timestamp_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    prediction_type: Mapped[str] = mapped_column(String(64), nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    uncertainty: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[list[str]] = mapped_column(JSON, default=list)
    data_quality: Mapped[str] = mapped_column(String(32), default="good")
    decision_state: Mapped[str] = mapped_column(String(32), default="shadow")
    not_for_autonomous_clinical_use: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="rule")
    severity: Mapped[str] = mapped_column(String(32), default="warning")
    rule_code: Mapped[str | None] = mapped_column(String(128), nullable=True)
    rule_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    observed_values: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    threshold: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    assignment: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    acknowledgement_note: Mapped[str | None] = mapped_column(Text, nullable=True)


class AlertAction(Base):
    __tablename__ = "alert_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[int] = mapped_column(ForeignKey("alerts.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    actor: Mapped[str] = mapped_column(String(128), default="system")
    action_time_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class ClinicianFeedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prediction_id: Mapped[int | None] = mapped_column(ForeignKey("predictions.id"), nullable=True)
    patient_id: Mapped[str | None] = mapped_column(ForeignKey("patients.id"), nullable=True)
    choice: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    clinician: Mapped[str] = mapped_column(String(128), default="unknown")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class SystemEvent(Base):
    __tablename__ = "system_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str | None] = mapped_column(ForeignKey("patients.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    event_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(128), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    actor: Mapped[str] = mapped_column(String(128), default="system")
    timestamp_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    audit_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
