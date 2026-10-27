from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

RULE_VERSION = "pulsecare-rule-v1.0"
RULESET_NAME = "clinician-approved-thresholds"


@dataclass
class RuleOutcome:
    alert: bool
    severity: str | None
    rule_code: str | None
    value: float | None
    threshold: float | None
    duration_seconds: int | None
    rationale: str


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def evaluate_rule_engine(observation: dict[str, Any], device_status: dict[str, Any] | None = None, quality_status: str | None = None, last_observation_age_minutes: float | None = None) -> list[RuleOutcome]:
    outcomes: list[RuleOutcome] = []
    dataset = observation or {}

    if dataset.get("heart_rate") is not None:
        value = float(dataset["heart_rate"])
        if value < 45:
            outcomes.append(RuleOutcome(True, "critical", "hr_low", value, 45.0, 60, "Heart rate fell below the configured low threshold."))
        elif value > 120:
            outcomes.append(RuleOutcome(True, "critical", "hr_high", value, 120.0, 60, "Heart rate exceeded the configured high threshold."))
        elif value < 60 or value > 100:
            outcomes.append(RuleOutcome(True, "warning", "hr_out_of_range", value, 100.0 if value > 100 else 60.0, 60, "Heart rate is outside the configured review range."))

    if dataset.get("spo2") is not None:
        value = float(dataset["spo2"])
        if value < 90:
            outcomes.append(RuleOutcome(True, "critical", "spo2_critical_low", value, 90.0, 60, "SpO₂ is below the clinician-approved critical threshold."))
        elif value < 95:
            outcomes.append(RuleOutcome(True, "warning", "spo2_low", value, 95.0, 60, "SpO₂ is below the configured low threshold."))

    if dataset.get("systolic_bp") is not None:
        value = float(dataset["systolic_bp"])
        if value >= 160:
            outcomes.append(RuleOutcome(True, "critical", "sbp_high", value, 160.0, 60, "Systolic blood pressure is in the critical range."))
        elif value > 140:
            outcomes.append(RuleOutcome(True, "warning", "sbp_elevated", value, 140.0, 60, "Systolic blood pressure is elevated."))

    if dataset.get("diastolic_bp") is not None:
        value = float(dataset["diastolic_bp"])
        if value >= 100:
            outcomes.append(RuleOutcome(True, "critical", "dbp_high", value, 100.0, 60, "Diastolic blood pressure is in the critical range."))
        elif value > 90:
            outcomes.append(RuleOutcome(True, "warning", "dbp_elevated", value, 90.0, 60, "Diastolic blood pressure is elevated."))

    if dataset.get("temperature_c") is not None:
        value = float(dataset["temperature_c"])
        if value < 35.0 or value > 38.5:
            outcomes.append(RuleOutcome(True, "critical", "temp_critical", value, 38.5 if value > 38.5 else 35.0, 60, "Temperature is outside the configured critical threshold."))
        elif value < 36.1 or value > 37.5:
            outcomes.append(RuleOutcome(True, "warning", "temp_elevated", value, 37.5 if value > 37.5 else 36.1, 60, "Temperature is outside the configured review range."))

    if device_status:
        if device_status.get("sync_status") == "disconnected":
            outcomes.append(RuleOutcome(True, "warning", "device_disconnected", None, None, 300, "Device is disconnected or unreachable."))
        if device_status.get("battery_level") is not None and float(device_status["battery_level"]) < 20:
            outcomes.append(RuleOutcome(True, "warning", "low_battery", float(device_status["battery_level"]), 20.0, 300, "Device battery is low."))
        if device_status.get("signal_strength") is not None and float(device_status["signal_strength"]) < 30:
            outcomes.append(RuleOutcome(True, "warning", "poor_signal", float(device_status["signal_strength"]), 30.0, 300, "Device signal quality is poor."))

    if quality_status in {"poor", "degraded"}:
        outcomes.append(RuleOutcome(True, "warning", "poor_quality", None, None, 300, "Observed data quality is degraded and should be clinician reviewed."))

    if last_observation_age_minutes is not None and last_observation_age_minutes > 10:
        outcomes.append(RuleOutcome(True, "warning", "stale_data", last_observation_age_minutes, 10.0, 300, "No valid device data has been received in the configured stale-data window."))

    return outcomes


def deduplicate_rule_outcomes(existing_alerts: list[dict[str, Any]], new_outcomes: list[RuleOutcome], window_seconds: int = 900) -> list[RuleOutcome]:
    active_rules = set()
    now = _utc_now()
    for item in existing_alerts:
        created_at = item.get("created_at")
        if not created_at:
            continue
        delta = now - created_at
        if delta.total_seconds() <= window_seconds:
            active_rules.add(item.get("rule_code"))
    filtered: list[RuleOutcome] = []
    for outcome in new_outcomes:
        if outcome.rule_code in active_rules:
            continue
        filtered.append(outcome)
    return filtered
