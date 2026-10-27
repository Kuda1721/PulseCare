from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

REQUIRED_SIGNALS = ("heart_rate", "spo2", "systolic_bp", "diastolic_bp", "respiratory_rate", "temperature_c")
QUALITY_BLOCKERS = {"poor", "stale", "disconnected", "invalid", "unresolved"}


def _timestamp(row: dict[str, Any]) -> datetime:
    value = row["timestamp_utc"]
    parsed = datetime.fromisoformat(value) if isinstance(value, str) else value
    if parsed.tzinfo is None:
        raise ValueError("timestamp_utc must be timezone-aware")
    return parsed.astimezone(timezone.utc)


def _abnormal_codes(row: dict[str, Any]) -> list[str]:
    checks = {
        "hr_low": row.get("heart_rate") is not None and row["heart_rate"] < 50,
        "hr_high": row.get("heart_rate") is not None and row["heart_rate"] > 110,
        "spo2_low": row.get("spo2") is not None and row["spo2"] < 92,
        "sbp_low": row.get("systolic_bp") is not None and row["systolic_bp"] < 90,
        "sbp_high": row.get("systolic_bp") is not None and row["systolic_bp"] > 180,
        "rr_low": row.get("respiratory_rate") is not None and row["respiratory_rate"] < 8,
        "rr_high": row.get("respiratory_rate") is not None and row["respiratory_rate"] > 24,
        "temp_low": row.get("temperature_c") is not None and row["temperature_c"] < 35.5,
        "temp_high": row.get("temperature_c") is not None and row["temperature_c"] >= 38.0,
    }
    return [code for code, is_abnormal in checks.items() if is_abnormal]


def generate_label(rows: list[dict[str, Any]], index: int, horizon_minutes: int = 30) -> dict[str, Any]:
    ordered = sorted(rows, key=_timestamp)
    anchor = ordered[index]
    anchor_time = _timestamp(anchor)
    future = [row for row in ordered[index + 1 :] if _timestamp(row) <= anchor_time + timedelta(minutes=horizon_minutes)]
    if not future or _timestamp(future[-1]) < anchor_time + timedelta(minutes=horizon_minutes):
        return {"label": None, "status": "insufficient_data", "rule_code": None, "supporting_timestamps": []}

    for signal in REQUIRED_SIGNALS:
        if anchor.get(signal) is None:
            return {"label": None, "status": "insufficient_data", "rule_code": None, "supporting_timestamps": []}
    flags = set(anchor.get("data_quality_flags", []))
    if flags & QUALITY_BLOCKERS:
        return {"label": None, "status": "insufficient_data", "rule_code": None, "supporting_timestamps": []}

    for signal_code in sorted({code for row in future for code in _abnormal_codes(row)}):
        supporting = [row for row in future if signal_code in _abnormal_codes(row)]
        if len(supporting) >= 2 and (_timestamp(supporting[-1]) - _timestamp(supporting[0])).total_seconds() >= 300:
            return {
                "label": 1,
                "status": "labelled",
                "rule_code": signal_code,
                "supporting_timestamps": [_timestamp(row).isoformat() for row in supporting],
            }
    return {"label": 0, "status": "labelled", "rule_code": None, "supporting_timestamps": []}
