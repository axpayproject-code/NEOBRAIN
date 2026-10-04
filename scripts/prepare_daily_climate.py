#!/usr/bin/env python3
"""Normalize a NASA POWER JSON response into the pilot's daily CSV schema."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from climate_data import nasa_power_json_to_frame  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_json")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    frame = nasa_power_json_to_frame(args.input_json)
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(output, index=False, date_format="%Y-%m-%d")
    print(f"Prepared {len(frame):,} daily rows; {frame['precip_mm'].notna().sum():,} rainfall values available.")


if __name__ == "__main__":
    main()
