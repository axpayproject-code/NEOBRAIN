"""Normalize an authorized PAGASA CliMap CSV export without changing the raw file."""

from __future__ import annotations

import argparse
from datetime import date
import hashlib
import json
from pathlib import Path
import sys

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from climate_data import climap_csv_to_frame


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Original CliMap CSV export; kept unchanged")
    parser.add_argument("--out", type=Path, required=True, help="Normalized daily CSV destination")
    parser.add_argument("--location-column", help="Column containing location labels, if the export has multiple places")
    parser.add_argument("--location", help="Exact location value to retain (case-insensitive)")
    parser.add_argument("--rainfall-unit", choices=["mm", "m"], default="mm")
    parser.add_argument("--temperature-unit", choices=["C", "K"], default="C")
    parser.add_argument("--retrieved-on", default=date.today().isoformat())
    args = parser.parse_args()
    if args.location and not args.location_column:
        parser.error("--location requires --location-column")
    if not args.input.is_file():
        parser.error(f"Input file not found: {args.input}")

    raw = pd.read_csv(args.input)
    daily = climap_csv_to_frame(
        raw,
        location_column=args.location_column,
        location=args.location,
        rainfall_unit=args.rainfall_unit,
        temperature_unit=args.temperature_unit,
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    daily.to_csv(args.out, index=False, date_format="%Y-%m-%d")
    metadata = {
        "provider": "DOST-PAGASA CliMap",
        "retrieved_on": args.retrieved_on,
        "source_file": args.input.name,
        "source_file_sha256": sha256_file(args.input),
        "normalized_file": args.out.name,
        "location": args.location,
        "location_column": args.location_column,
        "input_units": {"rainfall": args.rainfall_unit, "temperature": args.temperature_unit},
        "output_units": {"precip_mm": "mm/day", "tmax_c": "degrees C", "tmin_c": "degrees C"},
        "row_count": len(daily),
        "date_start": daily["date"].min().date().isoformat() if len(daily) else None,
        "date_end": daily["date"].max().date().isoformat() if len(daily) else None,
        "rainfall_missing_rows": int(daily["precip_mm"].isna().sum()),
        "transformation": "Column aliases mapped to canonical daily schema; units converted when requested; invalid/sentinel rainfall and duplicate dates handled by climate_data.normalize_daily_frame.",
        "source_url": "https://climgridph.pagasa.dost.gov.ph/climapv2/",
        "validation_status": "Schema and basic value checks applied; user should verify export location, units, and temporal support against the CliMap download details.",
    }
    metadata_path = args.out.with_suffix(".metadata.json")
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(daily):,} daily rows -> {args.out}")
    print(f"Provenance -> {metadata_path}")


if __name__ == "__main__":
    main()
