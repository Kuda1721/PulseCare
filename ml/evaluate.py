from __future__ import annotations

from typing import Any

REQUIRED_METRICS = (
    "sensitivity",
    "specificity",
    "precision",
    "recall",
    "auprc",
    "brier_score",
    "false_alerts_per_patient_day",
)


def evaluate_placeholder(y_true: list[int], y_score: list[float], patient_days: float) -> dict[str, Any]:
    """Define the evaluation contract; model fitting is intentionally out of scope for Phase 1C."""
    if len(y_true) != len(y_score) or patient_days <= 0:
        raise ValueError("labels, scores, and patient-days must be aligned and positive")
    return {"status": "not_run", "required_metrics": list(REQUIRED_METRICS), "patient_days": patient_days}
