from __future__ import annotations

import argparse
import json
from pathlib import Path

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from ml.data.bidmc import PROXY_LIMITATION, PROXY_TARGET, add_proxy_labels, load_observation_rows
from ml.data.splits import assert_no_patient_leakage, patient_level_split
from ml.preprocess import extract_interpretable_features, validate_timestamp_order


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the research-only BIDMC proxy baseline with patient-level splits.")
    parser.add_argument("--mat", type=Path, required=True, help="Path to BIDMC bidmc_data.mat")
    parser.add_argument("--output", type=Path, default=Path("reports/data-quality/baseline-evaluation.json"))
    parser.add_argument("--seed", type=int, default=20260911)
    args = parser.parse_args()
    rows = load_observation_rows(args.mat)
    validate_timestamp_order(rows)
    labelled = add_proxy_labels(rows)
    splits = patient_level_split(labelled, seed=args.seed)
    assert_no_patient_leakage(splits)
    feature_names = ("heart_rate", "spo2", "respiratory_rate")
    model = make_pipeline(StandardScaler(), LogisticRegression(random_state=args.seed, max_iter=1000))
    train = splits["train"]
    test = splits["test"]
    if len({int(row["label"]) for row in train}) < 2 or len({int(row["label"]) for row in test}) < 2:
        raise RuntimeError("Patient-level split does not contain both proxy classes in train and test")
    train_features = [[extract_interpretable_features(row)[name] for name in feature_names] for row in train]
    test_features = [[extract_interpretable_features(row)[name] for name in feature_names] for row in test]
    y_train = [int(row["label"]) for row in train]
    y_test = [int(row["label"]) for row in test]
    model.fit(train_features, y_train)
    scores = model.predict_proba(test_features)[:, 1]
    predictions = (scores >= 0.5).astype(int)
    result = {
        "status": "research_baseline_complete",
        "dataset": "BIDMC PPG and Respiration Dataset 1.0.0",
        "target": {"name": PROXY_TARGET, "limitation": PROXY_LIMITATION},
        "model": "standardized logistic regression",
        "patient_level_split": {name: {"patients": len({row["patient_id"] for row in values}), "rows": len(values)} for name, values in splits.items()},
        "leakage_check": "passed",
        "metrics": {
            "auroc": roc_auc_score(y_test, scores),
            "auprc": average_precision_score(y_test, scores),
            "brier_score": brier_score_loss(y_test, scores),
            "accuracy_at_0_5": float((predictions == y_test).mean()),
        },
        "features": list(feature_names),
        "note": "This artifact is for reproducibility and research review only; it is not a clinical validation or deployment result.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote evaluation contract to {args.output}")


if __name__ == "__main__":
    main()
