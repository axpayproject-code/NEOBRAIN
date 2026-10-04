# Architecture

## Prototype boundary

The open-source pilot is a single-location decision-support application. The React + TypeScript client renders climate context, compares rainfall with a historical baseline, supports in-memory CSV analysis, and tracks local preparedness actions. Python owns input normalization, validation, indicator calculations, and JSON responses.

```text
Browser (React)
  ├─ GET  /api/v1/overview?window_days=90
  ├─ GET  /api/v1/sources
  └─ POST /api/v1/analyze  { filename, csv_text, window_days }
                │
                ▼
Local Python WSGI API
  ├─ data/iloilo_city_daily.csv (optional local reference)
  ├─ climate_data.py (normalization and indicators)
  └─ data/source_register.csv + official_context.json
```

Run the included API only on localhost. It is a development server without authentication, rate limiting, or production deployment controls. The CSV analysis endpoint has a 10 MB request limit and analyzes submitted CSV text in memory; it does not persist uploads. Do not put restricted or personal data into it.

## Data flow

1. A source is acquired under its own access and redistribution terms.
2. The preparation scripts normalize dates, units, and field names while retaining provenance sidecars.
3. `climate_data.py` validates dates and calculates descriptive monthly and rolling rainfall comparisons.
4. The API returns the data and source limitations. It does not issue a drought warning or forecast.
5. The browser displays the context and lets a user track preparedness steps in that browser's local storage.

Keep gridded estimates, station observations, official forecasts, and local reports distinguishable. Never interpret the Iloilo City point as municipality-wide station truth. The 1991–2020 comparisons are descriptive until reviewed with the intended local partner.

## Main paths

| Path | Responsibility |
|---|---|
| `frontend/src/` | Responsive browser UI, source register view, local action tracker |
| `api_server.py` | Local JSON API and in-memory upload analysis |
| `climate_data.py` | Canonical daily schema and transparent calculations |
| `scripts/` | Reproducible source fetch and data preparation |
| `data/` | Attributed public reference material; private climate observations are ignored by Git |
| `tests/` | Synthetic tests for API and climate calculations |

## Before multi-user or public deployment

Replace the development server with a production server and reviewed hosting configuration. Add authentication, authorization, tenant separation, persistent action storage, audit logs, rate and size limits, backups, monitoring, dependency scanning, and an incident process. Review data permissions and indicator definitions with local partners before using the output operationally.
