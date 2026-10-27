from __future__ import annotations

import hashlib
from collections import defaultdict
from typing import Any


def patient_level_split(
    rows: list[dict[str, Any]],
    *,
    seed: int = 20260911,
    train_fraction: float = 0.70,
    validation_fraction: float = 0.15,
) -> dict[str, list[dict[str, Any]]]:
    if train_fraction <= 0 or validation_fraction <= 0 or train_fraction + validation_fraction >= 1:
        raise ValueError("split fractions must be positive and leave room for test")
    patient_ids = sorted({str(row["patient_id"]) for row in rows})
    assignments: dict[str, str] = {}
    for patient_id in patient_ids:
        digest = hashlib.sha256(f"{seed}:{patient_id}".encode("utf-8")).hexdigest()
        bucket = int(digest[:8], 16) / 0xFFFFFFFF
        assignments[patient_id] = "train" if bucket < train_fraction else "validation" if bucket < train_fraction + validation_fraction else "test"
    split_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        split_rows[assignments[str(row["patient_id"])]] .append(row)
    return {name: split_rows[name] for name in ("train", "validation", "test")}


def assert_no_patient_leakage(splits: dict[str, list[dict[str, Any]]]) -> None:
    seen: dict[str, str] = {}
    for split_name, rows in splits.items():
        for row in rows:
            patient_id = str(row["patient_id"])
            previous = seen.setdefault(patient_id, split_name)
            if previous != split_name:
                raise AssertionError(f"patient {patient_id} appears in {previous} and {split_name}")
