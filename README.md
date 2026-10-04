# El Niño Local Impact Intelligence — Iloilo Pilot

An early-stage React + TypeScript dashboard, Python JSON API, and reproducible data-preparation pipeline for local climate and agriculture decision support.

## Open source and contributions

The project code is licensed under the MIT License. Third-party datasets have separate conditions; see [`DATA_SOURCES.md`](DATA_SOURCES.md) before sharing data or a public build. Contributions are welcome through issues and pull requests; read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/CONTRIBUTOR_WORKFLOW.md`](docs/CONTRIBUTOR_WORKFLOW.md) first. GitHub Actions runs the Python unit suite and frontend build on every push and pull request.

See [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) for the pilot goal, phases, success measures, and next actions.
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the app boundary and [`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md) to publish the repository.

## What this pilot does

- Opens with PAGASA's official advisory context and qualification.
- Loads the local Iloilo City NASA POWER point series in the React interface. The Streamlit fallback can also load an uploaded CSV or NASA POWER JSON file.
- Compares complete calendar-month rainfall with the 1991–2020 same-month baseline.
- Compares the latest selectable 30–180-day rainfall window with same-date windows across 1991–2020, including an empirical historical percentile.
- Provides an editable preparedness action tracker with CSV export.
- Analyzes an authorized daily climate CSV in memory, without saving the uploaded file.
- Shows a live provenance register, coverage, and source limits.

The dashboard computes observed values at runtime from the local climate series or a CSV uploaded for in-memory analysis. No NASA POWER rainfall/temperature observations are included in the public Git checkout. Python handles data collection, validation, and analysis; React + TypeScript handles the browser interface. The Streamlit interface remains as a prototype fallback during the transition.

It does not issue weather warnings, forecast local rainfall, estimate crop losses, or replace PAGASA, DA, NIA, or local authorities. The supplied daily NASA POWER series is a gridded Iloilo City reference point, not station truth or a municipality-wide observation. The preparedness tracker is stored in the current browser's local storage and can be downloaded; it is not a multi-user database.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python api_server.py
```

In a second terminal, start the React interface (Node.js 20.19+ or 22.12+):

```bash
cd frontend
npm install
npm run dev
```

Open the local address printed by Vite. The development API binds to `127.0.0.1` and is not configured for public deployment. To use the earlier prototype, run `streamlit run app.py` instead. Windows PowerShell activation: `.venv\Scripts\Activate.ps1`.

## Data workflow

1. **Preferred climate data:** request municipality-level historical rainfall and temperature from PAGASA CliMap. CliMap requires registration and sends download links by email. Keep its original export unchanged, check the listed place and units, then prepare a canonical file and provenance sidecar. In the dashboard uploader, select units stated by the source file; unknown units must be resolved before analysis.

   ```bash
   python scripts/prepare_climap.py path/to/original_climap_export.csv \
     --out data/iloilo_climap_daily.csv \
     --location-column Municipality --location Oton \
     --rainfall-unit mm --temperature-unit C
   ```

   The importer recognizes common date, rainfall, and temperature headers. If the source uses different labels, rename the columns in a working copy or add a reviewed alias; do not guess unknown units. For a single-location file, omit the location arguments. It writes normalized `date,precip_mm,tmax_c,tmin_c` rows plus a `.metadata.json` with the raw file SHA-256 and transformation details. The app uploader can read canonical CSVs and compatible CliMap exports.
2. **Exploratory reference:** fetch a NASA POWER point series with `python scripts/fetch_nasa_power.py --latitude 10.72 --longitude 122.56 --start 19910101 --end 20261002 --out data/iloilo_city_nasa_power.json`. The prior local reference covered 1991-01-01 through 2026-10-02. NASA POWER is gridded model/reanalysis data, not a PAGASA station observation. Validate it against PAGASA data before operational use.
3. Prepare a normalized CSV: `python scripts/prepare_daily_climate.py data/iloilo_city_nasa_power.json --out data/iloilo_city_daily.csv`.
4. Keep each raw file unchanged and record source, retrieval date, spatial coverage, time standard, and transformations in the data register.

## Data and provenance

- `data/source_register.csv`: sources, access, coverage, limitations, and status.
- `data/official_context.json`: short PAGASA advisory summary dated 2026-09-23, linked to the official release.
- `data/agriculture_baseline.csv`: PSA-reported 2024 Iloilo palay production, a province-level aggregate.
- `data/iloilo_psgc_reference.csv`: PSA local-government codes and 2024 population counts.
- `data/climate_dataset_metadata.json`: query details for the local NASA POWER point series.
- `data/iloilo_city_daily.csv` and `data/iloilo_city_nasa_power.json`: local climate files used for the demo, intentionally ignored by Git. Fetch and prepare your own copy using the data workflow. Do not commit them into a public repository until the source-specific sharing requirements have been handled.

The GitHub checkout remains usable without these local climate files: use **Analyze CSV** to analyze an authorized daily CSV, or fetch the NASA POWER point series using the commands below. Uploads are limited to 10 MB and processed in memory by the local API; they are not written to disk. PSA tables are attributed; refer to `DATA_SOURCES.md` for separate data terms. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`ROADMAP.md`](ROADMAP.md) for boundaries and contribution areas.

## Indicators

- Monthly rainfall totals, based on complete calendar months.
- Monthly anomaly in millimetres and percent versus the 1991–2020 average for the same calendar month. Displayed only when at least 15 baseline years are present.
- Daily and rolling 30-day temperature/rainfall series for situational context.
- Data completeness and freshness checks.

The monthly anomaly is descriptive. It is not a drought classification. Do not attach operational thresholds until PAGASA/DA partners and the pilot client validate the definitions for the intended crop, location, season, and decision.

## Production work still required

Before a live client deployment: secure authorized PAGASA CliMap data and usage permission; validate NASA POWER against PAGASA observations; acquire and validate administrative boundary geometry and municipal crop/water overlays; co-design indicators with a pilot client; add authentication, client separation, backups, monitoring, automated refresh, and a reviewed hosting configuration; and document support and incident procedures. Do not expose client-uploaded farm, household, or water-utility data publicly.
