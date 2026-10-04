#!/usr/bin/env python3
"""Download NASA POWER daily point data for exploratory climate context."""

from __future__ import annotations

import argparse
from datetime import date, timedelta
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ENDPOINT = "https://power.larc.nasa.gov/api/temporal/daily/point"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--latitude", type=float, required=True)
    parser.add_argument("--longitude", type=float, required=True)
    parser.add_argument("--start", default="19910101")
    parser.add_argument("--end", default=(date.today() - timedelta(days=2)).strftime("%Y%m%d"))
    parser.add_argument("--out", default="data/nasa_power_daily.json")
    args = parser.parse_args()
    params = {
        "parameters": "PRECTOTCORR,T2M_MAX,T2M_MIN",
        "community": "AG",
        "longitude": args.longitude,
        "latitude": args.latitude,
        "start": args.start,
        "end": args.end,
        "format": "JSON",
        "time-standard": "UTC",
    }
    request = Request(f"{ENDPOINT}?{urlencode(params)}", headers={"User-Agent": "ACCENTECX-AI-ElNino-Pilot/0.1"})
    try:
        with urlopen(request, timeout=90) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"NASA POWER returned HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"Could not reach NASA POWER: {exc.reason}") from exc
    if payload.get("header", {}).get("fill_value") is None:
        raise RuntimeError("Unexpected NASA POWER response: fill_value metadata is missing")
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Saved source response to {output} ({len(payload.get('properties', {}).get('parameter', {}))} parameters)")
    print("Check NASA POWER metadata and validate against PAGASA station/CliMap data before operational use.")


if __name__ == "__main__":
    main()
