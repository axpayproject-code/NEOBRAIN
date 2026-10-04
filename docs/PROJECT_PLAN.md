# Project plan

## 1. Product goal

Build a trusted local decision-support service that helps a local government and its agriculture or water partners prepare earlier for El Niño-related dry spells. The product should connect credible climate observations to a small set of agreed actions, owners, deadlines, and follow-up evidence.

The goal is to reduce avoidable losses and service disruptions. The product cannot prevent El Niño, guarantee a forecast, or promise that no one will be affected.

## 2. Start with one pilot decision

Do not try to model every sector and every municipality at once. Find one Iloilo design partner and choose one operational question. A practical candidate is:

> Which palay areas need earlier follow-up on planting stage, irrigation access, and dry-spell readiness?

Validate that question with the partner before building crop-risk scores. If water supply is the stronger funded need, select a water-source monitoring workflow instead. Keep the pilot narrow enough to evaluate.

## 3. Users and product value

| User | Decision supported | Product value to test |
|---|---|---|
| Municipal agriculture office / extension staff | Which farming areas need a status check or advisory follow-up? | Faster, traceable coordination using climate context plus local crop-stage reports |
| Provincial or city planning / DRRM team | Which preparedness actions are due, blocked, or missing an owner? | One shared view of signals, evidence, owners, and dates |
| Water utility / water-resource team | Which sources or service areas need closer monitoring? | A consistent way to compare climate signals with actual source and service data |

The first pilot should select one user group and one decision. Add additional workflows only after partner feedback and data quality support them.

## 4. Delivery phases and exit checks

### Phase A — Partner and decision definition

- Identify one willing Iloilo partner and an accountable project contact.
- Write the exact decision, user, geography, timing, and action the pilot is intended to support.
- Agree what evidence would change a decision and who is authorized to act.
- Confirm what data may be collected, processed, retained, and shared.

**Exit:** a one-page pilot brief signed off by the partner, with owners and data permissions.

### Phase B — Data readiness and validation

- Acquire authorized PAGASA station or CliMap rainfall data for the chosen area and preserve source terms.
- Compare NASA POWER against the authorized local reference before using it as a substitute or gap-filler.
- Collect the minimum exposure data needed for the chosen decision: for palay, location/area, planting calendar, crop stage, and irrigated/rainfed status.
- Record spatial coverage, period, units, missingness, updates, and transformations for every input.
- Have a climate or agriculture partner review the indicator definitions and thresholds.

**Exit:** a reproducible data set with provenance, written validation results, and approved indicator definitions. Keep descriptive anomaly charts labeled as descriptive until this review is complete.

### Phase C — Operational pilot

- Implement one end-to-end workflow: data update → quality check → signal review → assigned action → status update → outcome review.
- Keep PAGASA as the source for official forecasts and warnings. Show source and issue date beside any advisory.
- Add clear action owners, due dates, escalation rules, and a contact/update cadence agreed by the partner.
- Run the workflow through at least one full decision cycle and capture feedback.

**Exit:** users can complete the workflow reliably, data issues are visible, and the partner accepts the output for that specific use.

### Phase D — Evidence and productization

- Measure whether the product improves decision lead time, coverage of intended users, and completion of agreed actions.
- Track operational outcomes relevant to the use case, such as days of water-service interruption or crop-stage follow-up coverage. Interpret crop yield and loss carefully because many factors affect them.
- Add persistent storage, authentication, roles, audit history, backups, monitoring, support, and deployment controls before serving multiple clients.
- Repeat the pilot with a second partner before presenting the approach as broadly validated.

**Exit:** documented evidence, security review, clear support ownership, and a deployment process that can be repeated without mixing client data.

## 5. Product and repository boundaries

### Open-source core

- Climate-data adapters, normalized schemas, quality checks, transparent indicators, dashboard, synthetic tests, and documentation.
- MIT-licensed code; third-party datasets retain their own attribution and usage terms.
- Issues and pull requests welcome for reusable functionality, accessibility, documentation, and test coverage.

### Local data and client services

- Keep client data, credentials, and restricted PAGASA downloads outside public Git.
- Offer paid work around authorized data acquisition, local calibration, integrations, managed hosting, partner onboarding, training, and ongoing monitoring.
- Keep core data exports and calculations portable so a client is not locked into one host.

### Current prototype architecture and target boundaries

The prototype now uses a React + TypeScript browser interface and a Python JSON API for the local dashboard. Python remains responsible for data collection, validation, and climate calculations. The older Streamlit interface remains available as a fallback while the browser interface is tested with a pilot partner. The included WSGI server is for local development only.

```text
frontend/                       # React + TypeScript user interface
api_server.py                   # local JSON API for the interface
app.py                          # Streamlit prototype/fallback
climate_data.py                 # validated climate calculations
scripts/                         # reproducible collection/preparation CLI
tests/                           # synthetic fixtures; no client data
docs/                            # architecture, data, pilot, and operations
data/                            # permitted reference data only
```

Before a hosted multi-user pilot, replace the local development server with a reviewed deployment stack and add authentication, client separation, persistent action storage, audit history, backups, monitoring, and support ownership. Split Python modules further when a real second source or workflow justifies it.

## 6. How to measure whether it helps

Agree on a baseline with the pilot partner before deployment. Start with process measures:

- Time from receipt of an official or validated signal to review by the responsible team.
- Share of intended areas/users reached by an agreed update.
- Share of preparedness actions with an owner and due date, and share completed on time.
- Data completeness, delay, and correction rate.

Then monitor use-case outcomes selected by the partner. Compare against a prior period or a suitable comparison group when possible; do not attribute every change in yield, water supply, or loss to the tool.

## 7. Immediate next actions

1. Recruit one Iloilo design partner and choose agriculture or water as the first workflow.
2. Agree on the decision and data-sharing boundaries before collecting client data.
3. Obtain permission for the relevant PAGASA series and confirm its redistribution terms.
4. Validate the current rainfall calculations against an authorized local reference.
5. Prototype one action workflow with named roles and measurable process indicators.
