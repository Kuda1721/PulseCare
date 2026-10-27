from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class TermsNotAcceptedError(PermissionError):
    """Raised before a governed dataset is downloaded or read."""


def load_manifest(manifest_path: Path | None = None) -> dict[str, Any]:
    path = manifest_path or Path(__file__).with_name("dataset-manifest.json")
    return json.loads(path.read_text(encoding="utf-8"))


def get_dataset_entry(dataset_id: str, manifest: dict[str, Any]) -> dict[str, Any]:
    for entry in manifest["datasets"]:
        if entry["id"] == dataset_id:
            return entry
    raise KeyError(f"Unknown dataset: {dataset_id}")


def require_terms_acceptance(entry: dict[str, Any], accept_terms: bool) -> None:
    if not accept_terms:
        raise TermsNotAcceptedError(
            f"Terms for {entry['id']} have not been explicitly accepted; pass --accept-terms after governance review."
        )
    if entry["access_state"] != "terms_accepted":
        raise TermsNotAcceptedError(
            f"{entry['id']} is {entry['access_state']}; update the manifest only after required approvals are recorded."
        )


def inspect_dataset(
    dataset_id: str,
    data_root: Path,
    *,
    accept_terms: bool,
    manifest_path: Path | None = None,
) -> dict[str, Any]:
    manifest = load_manifest(manifest_path)
    entry = get_dataset_entry(dataset_id, manifest)
    require_terms_acceptance(entry, accept_terms)

    metadata_path = data_root / dataset_id / "metadata.json"
    if not metadata_path.exists():
        return {
            "dataset_id": dataset_id,
            "availability": "approved_but_not_present_locally",
            "signals": entry["expected_signals"],
            "sample_rates_hz": entry["sample_rates_hz"],
            "labels": entry["labels"],
            "patient_count": None,
            "missingness": None,
            "class_balance": None,
            "limitations": entry["known_limitations"],
        }

    local_metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    return {
        "dataset_id": dataset_id,
        "availability": "available",
        "signals": local_metadata.get("signals", entry["expected_signals"]),
        "sample_rates_hz": local_metadata.get("sample_rates_hz", entry["sample_rates_hz"]),
        "labels": local_metadata.get("labels", entry["labels"]),
        "patient_count": local_metadata.get("patient_count"),
        "missingness": local_metadata.get("missingness"),
        "class_balance": local_metadata.get("class_balance"),
        "limitations": entry["known_limitations"] + local_metadata.get("limitations", []),
    }
