# PulseCare Patient Monitoring System

PulseCare is a clinician-facing decision-support platform for live patient monitoring. The project keeps the established React + Vite UI while introducing a safety-first architecture for backend ingestion, validation, deterministic rules, and a replayable demo mode.

## Status

This repository now includes:

- a frontend store that separates demo replay from production API mode
- a backend FastAPI skeleton with Pydantic contracts and data-quality validation
- a deterministic clinical alert layer and explicit safety disclaimers
- a monorepo directory layout for frontend, backend, ML, infra, docs, and tests
- an implementation plan and dataset/model-card documentation

## Architecture summary

- Frontend: React + TypeScript + Vite (current app remains in the repository root)
- Backend: Python FastAPI + Pydantic + SQLAlchemy
- Time-series database: PostgreSQL + TimescaleDB
- Real-time events: Redis + Celery / worker layer
- ML tooling: PyTorch, scikit-learn, pandas, NumPy, MLflow, DVC-compatible workflow
- Local orchestration: Docker Compose

## Demo mode and production mode

- Demo mode is intentionally isolated from production API behavior
- It is intended for demonstrations and presentations only
- Production mode fetches API data and preserves the clinical decision-support guardrails

## Demo doctor accounts

The demo login at `/login` includes patient scoping by assigned doctor:

- Dr. Briola Bhanzi: `briola.bhanzi@pulsecare.demo` / `PulseCare123!`
- Dr. Marcus Reid: `marcus.reid@pulsecare.demo` / `PulseCare123!`
- Dr. Lisa Park: `lisa.park@pulsecare.demo` / `PulseCare123!`

These credentials are demonstration-only and must be replaced by the production identity provider before deployment. Active critical alerts for the signed-in doctor's patients trigger a repeated browser alarm after the login interaction unlocks audio; the alarm is an attention aid, not a substitute for clinician assessment.

## Setup

1. Ensure Docker Desktop or Docker Engine is available.
2. Copy or create a local environment file for backend configuration, if required.
3. Start the services:

   docker compose -f infra/docker-compose.yml up --build

4. Start the frontend locally if needed:

   npm install
   npm run dev

## Data access prerequisites

Some dataset and clinical-research workflows require institutional access and data-use approval. The project must not ingest identifiable patient data without approved governance, consent, de-identification, and access control.

## Limitations

This system is a clinical decision-support tool, not an autonomous diagnosis or treatment system. Predictions are presented as risk signals for clinician review, not as medical decisions.

Hard safety alerts remain deterministic, clinician-approved rules and are never overridden by ML.

## Training workflow

1. Prepare and curate patient-level splits by patient, not random windows.
2. Version dataset manifests and feature definitions.
3. Train baseline models first and evaluate against acceptance criteria.
4. Add deep learning only after the baseline is validated and the task is justified.

## Evaluation

The project tracks the required metrics for each released model:

- AUROC, AUPRC
- sensitivity/recall
- specificity
- precision/PPV
- NPV
- F1
- confusion matrix
- calibration/Brier score
- false-alert rate per patient-day
- time-to-alert
- subgroup reliability

## Validation record

Validated on 2026-09-11 from the repository root:

- Frontend: `corepack pnpm build` -> passed; Vite built successfully. Existing Vite config and chunk-size warnings remain non-blocking.
- Backend: `python -m pytest -q` from `backend/` with `PYTHONPATH` set to `backend` -> **8 passed**. The test fixture resets the SQLite schema per test to prevent persisted duplicate data from contaminating runs.

The Windows backend command was:

`$env:PYTHONPATH = (Get-Location).Path; & 'C:\Users\DELL\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest -q`

## Phase 1C data readiness

- Clinical task and release gates: [docs/clinical-protocol.md](docs/clinical-protocol.md)
- Governance requirements: [docs/data-governance.md](docs/data-governance.md)
- Dataset access manifest: [ml/data/dataset-manifest.json](ml/data/dataset-manifest.json)
- Dataset reports are generated under `reports/data-quality/`, which is excluded from source control.
- No production model training is included in Phase 1C.

The reproducible BIDMC research baseline uses the local MATLAB archive and deterministic patient-level splitting:

`$env:PYTHONPATH = (Get-Location).Path; C:\Users\DELL\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe ml/scripts/evaluate_baseline.py --mat bidmc-ppg-and-respiration-dataset-1.0.0/bidmc-ppg-and-respiration-dataset-1.0.0/bidmc_data.mat`

Its output is `reports/data-quality/baseline-evaluation.json`. The target is explicitly `proxy_sustained_abnormal_vital_trend`, derived from BIDMC reference HR, SpO2, and respiratory-rate series. It must not be interpreted as the original 30-minute sustained-abnormal-vital clinical outcome or as a clinical validation result.

## Validation record

Validated on 2026-09-11 from the repository root:

- Frontend: `corepack pnpm build` -> passed; Vite built successfully. Existing Vite config and chunk-size warnings remain non-blocking.
- Backend: `python -m pytest -q` from `backend/` with `PYTHONPATH` set to `backend` -> **8 passed**. The test fixture resets the SQLite schema per test to prevent persisted duplicate data from contaminating runs.

The Windows backend command was:

`$env:PYTHONPATH = (Get-Location).Path; & 'C:\Users\DELL\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest -q`

## Phase 1C data readiness

- Clinical task and release gates: [docs/clinical-protocol.md](docs/clinical-protocol.md)
- Governance requirements: [docs/data-governance.md](docs/data-governance.md)
- Dataset access manifest: [ml/data/dataset-manifest.json](ml/data/dataset-manifest.json)
- Dataset reports are generated under `reports/data-quality/`, which is excluded from source control.
- No production model training is included in Phase 1C.

## Project folders

- backend/
- frontend/ (scaffolding for the app package)
- ml/
- infra/
- docs/
- tests/

## Safety-first deployment stages

- research
- shadow
- clinician-review
- approved

Only approved models may influence non-critical workflow displays. Deterministic critical safety rules are always active.
