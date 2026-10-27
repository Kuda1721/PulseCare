from __future__ import annotations

from dataclasses import dataclass

from app.schemas import DataQualityStatus, QualitySummary, VitalObservation


@dataclass
class QualityCheck:
    status: DataQualityStatus
    missingness_ratio: float
    signal_quality_score: float
    stale_minutes: int
    warnings: list[str]


def calculate_quality(observation: VitalObservation) -> QualityCheck:
    metrics = [
        observation.heart_rate is not None,
        observation.spo2 is not None,
        observation.systolic_bp is not None,
        observation.diastolic_bp is not None,
        observation.temperature_c is not None,
    ]
    missing_ratio = 1.0 - (sum(metrics) / len(metrics))

    if observation.data_quality_flags:
        warnings = list(observation.data_quality_flags)
    else:
        warnings = []

    if observation.heart_rate is not None and observation.heart_rate > 180:
        warnings.append("impossible_heart_rate")
    if observation.spo2 is not None and observation.spo2 < 70:
        warnings.append("low_spo2_critical")
    if observation.systolic_bp is not None and observation.systolic_bp > 220:
        warnings.append("impossible_systolic_bp")
    if observation.diastolic_bp is not None and observation.diastolic_bp > 150:
        warnings.append("impossible_diastolic_bp")
    if observation.temperature_c is not None and (observation.temperature_c < 32 or observation.temperature_c > 42):
        warnings.append("temperature_out_of_range")

    signal_quality = max(0.0, 1.0 - missing_ratio - (0.15 if warnings else 0.0))
    signal_quality = min(signal_quality, 1.0)

    if missing_ratio > 0.4 or signal_quality < 0.35:
        status = DataQualityStatus.poor
    elif missing_ratio > 0.2 or signal_quality < 0.65:
        status = DataQualityStatus.degraded
    elif signal_quality < 0.85:
        status = DataQualityStatus.good
    else:
        status = DataQualityStatus.excellent

    return QualityCheck(
        status=status,
        missingness_ratio=round(missing_ratio, 3),
        signal_quality_score=round(signal_quality, 3),
        stale_minutes=0,
        warnings=warnings,
    )


def quality_summary_from_observation(observation: VitalObservation) -> QualitySummary:
    result = calculate_quality(observation)
    return QualitySummary(
        status=result.status,
        missingness_ratio=result.missingness_ratio,
        signal_quality_score=result.signal_quality_score,
        stale_minutes=result.stale_minutes,
        warnings=result.warnings,
    )
