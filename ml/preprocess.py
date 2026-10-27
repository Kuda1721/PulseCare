from __future__ import annotations

from typing import Any

from ml.data.labels import REQUIRED_SIGNALS


def validate_timestamp_order(rows: list[dict[str, Any]]) -> None:
    from ml.data.labels import _timestamp

    by_patient: dict[str, list[Any]] = {}
    for row in rows:
        by_patient.setdefault(str(row["patient_id"]), []).append(_timestamp(row))
    for patient_id, timestamps in by_patient.items():
        if timestamps != sorted(timestamps) or len(timestamps) != len(set(timestamps)):
            raise ValueError(f"timestamps are not strictly ordered for patient {patient_id}")


def extract_interpretable_features(row: dict[str, Any]) -> dict[str, float]:
    present = [row.get(signal) is not None for signal in REQUIRED_SIGNALS]
    features = {signal: float(row[signal]) if row.get(signal) is not None else 0.0 for signal in REQUIRED_SIGNALS}
    features["missingness_ratio"] = 1.0 - sum(present) / len(REQUIRED_SIGNALS)
    features["signal_quality_score"] = float(row.get("signal_quality_score", 1.0))
    return features
