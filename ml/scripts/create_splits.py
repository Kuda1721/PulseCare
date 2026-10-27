from __future__ import annotations

import argparse
import json
from pathlib import Path

from ml.data.splits import patient_level_split


def main() -> None:
    parser = argparse.ArgumentParser(description="Create deterministic patient-level train/validation/test splits.")
    parser.add_argument("input", type=Path, help="JSON list of observation rows")
    parser.add_argument("--output", type=Path, default=Path("data/processed/patient-splits.json"))
    parser.add_argument("--seed", type=int, default=20260911)
    args = parser.parse_args()
    rows = json.loads(args.input.read_text(encoding="utf-8"))
    splits = patient_level_split(rows, seed=args.seed)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(splits, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote patient-level splits to {args.output}")


if __name__ == "__main__":
    main()
