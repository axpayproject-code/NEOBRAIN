# Data collection log

Assembled 4 October 2026 for the Iloilo El Niño pilot.

## Collected and prepared

| File | Content | Provenance | Preparation |
|---|---|---|---|
| `official_context.json` | DOST-PAGASA El Niño advisory summary dated 23 September 2026 | PAGASA press release | Faithful short summary, with issue date and source URL retained |
| `agriculture_baseline.csv` | Iloilo's 2024 palay production: 831,333.77 metric tons | PSA RSSO VI special release, 13 February 2025 | Stored as province-level baseline; not used to infer loss or local exposure |
| `iloilo_psgc_reference.csv` | Iloilo component city and 42 municipalities; PSGC codes and 2024 POPCEN values | PSA PSGC page for Province of Iloilo, page shows Q2 2026 publication and 2024 population counts | Normalized names/identifiers into UTF-8 CSV; official spelling retained |
| `iloilo_city_daily.csv` and `iloilo_city_nasa_power.json` | Daily corrected precipitation and maximum/minimum temperature for one reference point | NASA POWER Daily Point API | 13,059 rows, 1991-01-01 through 2026-10-02; no missing values returned for the selected fields; UTC; raw response retained locally and excluded from Git |
| `climate_dataset_metadata.json` | Query parameters, API version, units, retrieval date, spatial caveat | NASA POWER response header and request log | Machine-readable provenance record |
| `source_register.csv` | Sources, coverage, terms, limits, acquisition status | PAGASA, NASA POWER, PSA | Identifies what is ready vs. requires a registered download or client data |

## Not bundled yet

- PAGASA CliMap daily or monthly municipality series. The portal has historical rainfall/temperature and climate projections; downloading selected files requires registration and email delivery. Use the actual selected location/time series, preserve the download and terms, and record the request date before operational use.
- PAGASA station daily raw data. The raw data request form and terms apply; some station data may have a fee or approval requirement.
- Municipal boundaries and crop/water-system overlays. A PSGC code list is not geometry. Acquire authoritative polygons and confirm crop/water datasets with the pilot client before mapping exposure.
- PAGASA municipal observations to calibrate/compare with NASA POWER. NASA POWER is only a point reference and must not be labeled as station truth.

## Data validation decisions

- No drought risk score is included. Rainfall anomaly thresholds need local/crop validation.
- 1991–2020 monthly rainfall baseline is computed only when at least 15 baseline years are present. It is descriptive and not an official drought category.
- Partial current months are excluded from monthly anomaly comparisons.
- Sentinel/fill values are converted to nulls; duplicate daily dates are rejected.
- All figures must show the source, spatial support, period, retrieval date, and completeness before client use.
- The point series is exploratory local-only material; it is not included in the open-source checkout. Fetch a fresh series and compare with PAGASA observations before interpreting it.
