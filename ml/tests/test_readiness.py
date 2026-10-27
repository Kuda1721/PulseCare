from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from ml.data.adapters import TermsNotAcceptedError, inspect_dataset, load_manifest
from ml.data.bidmc import PROXY_TARGET, add_proxy_labels
from ml.data.labels import generate_label
from ml.data.splits import assert_no_patient_leakage, patient_level_split
from ml.preprocess import validate_timestamp_order


def row(patient_id: str, minutes: int, *, heart_rate: float = 80, flags: list[str] | None = None) -> dict[str, object]:
    timestamp = datetime(2026, 9, 11, 12, 0, tzinfo=timezone.utc) + timedelta(minutes=minutes)
    return {
        "patient_id": patient_id,
        "timestamp_utc": timestamp.isoformat(),
        "heart_rate": heart_rate,
        "spo2": 97,
        "systolic_bp": 120,
        "diastolic_bp": 78,
        "respiratory_rate": 16,
        "temperature_c": 36.8,
        "data_quality_flags": flags or [],
    }


def test_patient_level_split_has_no_leakage() -> None:
    rows = [row("p1", 0), row("p1", 10), row("p2", 0), row("p3", 0), row("p4", 0), row("p5", 0)]
    splits = patient_level_split(rows, seed=1, train_fraction=0.6, validation_fraction=0.2)
    assert_no_patient_leakage(splits)
    assert {item["patient_id"] for item in splits["train"] + splits["validation"] + splits["test"]} == {"p1", "p2", "p3", "p4", "p5"}


def test_patient_leakage_is_rejected() -> None:
    with pytest.raises(AssertionError):
        assert_no_patient_leakage({"train": [row("p1", 0)], "test": [row("p1", 10)]})


def test_timestamp_order_is_strict() -> None:
    validate_timestamp_order([row("p1", 0), row("p1", 10)])
    with pytest.raises(ValueError):
        validate_timestamp_order([row("p1", 10), row("p1", 0)])


def test_label_requires_two_abnormal_observations_and_full_horizon() -> None:
    rows = [row("p1", 0), row("p1", 10, heart_rate=130), row("p1", 20, heart_rate=132), row("p1", 30)]
    label = generate_label(rows, 0)
    assert label["label"] == 1
    assert label["rule_code"] == "hr_high"

    incomplete = generate_label(rows[:-1], 0)
    assert incomplete["label"] is None
    assert incomplete["status"] == "insufficient_data"


def test_label_quality_flags_are_not_silently_imputed() -> None:
    rows = [row("p1", 0, flags=["poor"]), row("p1", 10, heart_rate=130), row("p1", 20, heart_rate=132), row("p1", 30)]
    label = generate_label(rows, 0)
    assert label["label"] is None
    assert label["status"] == "insufficient_data"


def test_dataset_adapter_requires_explicit_approval(tmp_path) -> None:
    manifest = load_manifest()
    with pytest.raises(TermsNotAcceptedError):
        inspect_dataset("mit-bih-arrhythmia", tmp_path, accept_terms=False)
    assert manifest["datasets"]


def test_bidmc_proxy_target_is_explicit_and_requires_sustained_future_signal() -> None:
    rows = [row("p1", minute, heart_rate=130 if minute in (10, 20) else 80) for minute in range(31)]
    labelled = add_proxy_labels(rows)
    assert labelled[0]["target_name"] == PROXY_TARGET
    assert labelled[0]["label"] == 1
    assert all(item["patient_id"] == "p1" for item in labelled)
