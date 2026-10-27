from __future__ import annotations

import argparse
import json
from pathlib import Path

from ml.preprocess import extract_interpretable_features, validate_timestamp_order


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate observations and extract transparent baseline features.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data/processed/features.json"))
    args = parser.parse_args()
    rows = json.loads(args.input.read_text(encoding="utf-8"))
    validate_timestamp_order(rows)
    features = [{"patient_id": row["patient_id"], "timestamp_utc": row["timestamp_utc"], **extract_interpretable_features(row)} for row in rows]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(features, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(features)} feature rows to {args.output}")


if __name__ == "__main__":
    main()
