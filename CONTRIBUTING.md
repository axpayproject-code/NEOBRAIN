# Contributing

Thanks for helping improve El Niño Impact Intelligence. Good first contributions include documentation, data-quality checks, accessibility, reproducible analysis, and carefully sourced local datasets. Follow [`docs/CONTRIBUTOR_WORKFLOW.md`](docs/CONTRIBUTOR_WORKFLOW.md) so work is assigned, reviewed, and merged into one canonical repository.

## Before you start

- Open an issue for substantial changes so maintainers and contributors can agree on the need and approach.
- For a bug report, include the steps to reproduce it, expected and actual behavior, and a minimal synthetic example. Do not attach personal, household, farm, or utility customer data.
- For a data contribution, include the original source, retrieval date, geography, period, units, time standard, transformation steps, and redistribution terms. Keep data licensing separate from the software license. Do not submit PAGASA CliMap files unless the applicable terms allow redistribution.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m unittest discover -s tests -v
python api_server.py
```

In a second terminal, run the browser interface with Node.js 20.19+ or 22.12+:

```bash
cd frontend
npm install
npm run build
```

Windows PowerShell activation: `.venv\\Scripts\\Activate.ps1`. The Streamlit prototype is still available with `streamlit run app.py`.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the API, data flow, and current deployment boundary. The upload endpoint accepts CSV text only for in-memory analysis; it does not store submitted files.

## Pull requests

1. Fork the repository and create a focused branch.
2. Make the smallest change that solves the issue.
3. Add or update meaningful tests for calculation and data handling changes.
4. Run the Python tests above and, for frontend changes, run `npm run build`; describe the results in the pull request.
5. Explain any indicator definition, data-source, unit, or geographic assumption in the code and docs.

Open a pull request against the canonical repository's default branch and link its issue (`Closes #<issue-number>`). Do not push directly to the default branch. A maintainer reviews and merges changes after checks pass.

By submitting a contribution, you agree that it will be made available under the project's MIT License. You retain copyright in your contribution.

## Scientific and data standards

- Keep observed, modeled, forecast, and scenario data clearly distinguished.
- Preserve provenance and do not silently impute, interpolate, or change units.
- Do not label a gridded point as station truth or municipality-wide data.
- Do not turn descriptive anomaly statistics into official warnings or impact estimates.
- Prefer synthetic test fixtures; never put private client data in the repository or tests.
