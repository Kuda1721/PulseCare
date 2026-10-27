from __future__ import annotations

from pathlib import Path
from typing import Any


def start_research_run(config: dict[str, Any], tracking_uri: str = "file:./mlruns") -> None:
    """Start a metadata-only MLflow run; training is deliberately not performed here."""
    try:
        import mlflow
    except ImportError as exc:
        raise RuntimeError("Install ml/requirements.txt before using MLflow tracking") from exc
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(config["experiment_name"])
    with mlflow.start_run(run_name="phase-1c-readiness"):
        mlflow.log_params({"protocol_version": config["protocol_version"], "seed": config["seed"], "status": "research"})
        mlflow.set_tag("training_performed", "false")
        mlflow.log_text("Phase 1C scaffold only; no production model trained.", "README.txt")
