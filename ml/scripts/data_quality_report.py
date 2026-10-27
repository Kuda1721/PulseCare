from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from ml.data.adapters import TermsNotAcceptedError, get_dataset_entry, load_manifest, inspect_dataset


def build_report(data_root: Path, manifest_path: Path, accept_terms: bool) -> dict[str, object]:
    manifest = load_manifest(manifest_path)
    datasets: list[dict[str, object]] = []
    for entry in manifest["datasets"]:
        if not accept_terms:
            datasets.append({
                "dataset_id": entry["id"],
                "availability": entry["access_state"],
                "signals": entry["expected_signals"],
                "sample_rates_hz": entry["sample_rates_hz"],
                "labels": entry["labels"],
                "patient_count": None,
                "missingness": None,
                "class_balance": None,
                "limitations": entry["known_limitations"],
                "access_note": "Not inspected: explicit terms acceptance is required.",
            })
            continue
        try:
            datasets.append(inspect_dataset(entry["id"], data_root, accept_terms=True, manifest_path=manifest_path))
        except TermsNotAcceptedError as exc:
            datasets.append({"dataset_id": entry["id"], "availability": "blocked", "access_note": str(exc)})
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "manifest_version": manifest["manifest_version"],
        "protocol_version": manifest["protocol_version"],
        "patient_level_split_required": True,
        "datasets": datasets,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a governed dataset readiness report.")
    parser.add_argument("--data-root", type=Path, default=Path("data/raw"))
    parser.add_argument("--manifest", type=Path, default=Path("ml/data/dataset-manifest.json"))
    parser.add_argument("--output", type=Path, default=Path("reports/data-quality/dataset-readiness.json"))
    parser.add_argument("--accept-terms", action="store_true", help="Only use after required dataset approvals are recorded in the manifest.")
    args = parser.parse_args()
    report = build_report(args.data_root, args.manifest, args.accept_terms)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
