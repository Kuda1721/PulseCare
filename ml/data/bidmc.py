from __future__ import annotations

from datetime import datetime, timedelta, timezone
from math import isfinite
from pathlib import Path
from typing import Any


PROXY_TARGET = "proxy_sustained_abnormal_vital_trend"
PROXY_LIMITATION = (
    "Research proxy derived from BIDMC reference HR, SpO2, and respiratory-rate series; "
    "it is not the original 30-minute sustained-abnormal-vital clinical outcome."
)


def _value_series(value: Any) -> list[float]:
    return [float(item) for item in value.reshape(-1)]


def load_observation_rows(mat_path: Path) -> list[dict[str, Any]]:
    try:
        from scipy.io import loadmat
    except ImportError as exc:
        raise RuntimeError("Install scipy from ml/requirements.txt to read BIDMC MATLAB data") from exc

    records = loadmat(mat_path, squeeze_me=True, struct_as_record=False)["data"]
    rows: list[dict[str, Any]] = []
    for record_index, record in enumerate(records, start=1):
        params = record.ref.params
        series = {
            "heart_rate": params.hr,
            "spo2": params.spo2,
            "respiratory_rate": params.rr,
        }
        lengths = {len(getattr(value, "v").reshape(-1)) for value in series.values()}
        if len(lengths) != 1:
            raise ValueError(f"BIDMC record {record_index:02d} has misaligned reference series")
        patient_id = f"bidmc{record_index:02d}"
        start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        values = {name: _value_series(value.v) for name, value in series.items()}
        for minute in range(next(iter(lengths))):
            if not all(isfinite(values[name][minute]) for name in values):
                continue
            rows.append(
                {
                    "patient_id": patient_id,
                    "timestamp_utc": (start + timedelta(minutes=minute)).isoformat(),
                    **{name: values[name][minute] for name in values},
                    "data_quality_flags": [],
                }
            )
    return rows


def add_proxy_labels(rows: list[dict[str, Any]], horizon_minutes: int = 30) -> list[dict[str, Any]]:
    by_patient: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        by_patient.setdefault(str(row["patient_id"]), []).append(row)
    labelled: list[dict[str, Any]] = []
    for patient_rows in by_patient.values():
        for index, row in enumerate(patient_rows):
            anchor_time = datetime.fromisoformat(str(row["timestamp_utc"]))
            horizon_end = anchor_time + timedelta(minutes=horizon_minutes)
            future = [
                candidate
                for candidate in patient_rows[index + 1 :]
                if datetime.fromisoformat(str(candidate["timestamp_utc"])) <= horizon_end
            ]
            if not future or datetime.fromisoformat(str(future[-1]["timestamp_utc"])) < horizon_end:
                continue
            abnormal = [
                item["heart_rate"] < 50
                or item["heart_rate"] > 110
                or item["spo2"] < 92
                or item["respiratory_rate"] < 8
                or item["respiratory_rate"] > 24
                for item in future
            ]
            output = dict(row)
            output["label"] = int(sum(abnormal) >= 2)
            output["target_name"] = PROXY_TARGET
            labelled.append(output)
    return labelled