"""Local-only JSON API for the React dashboard. Not an internet-facing server."""

from __future__ import annotations

from pathlib import Path
from io import StringIO
from urllib.parse import parse_qs
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server
import json
import math
import pandas as pd

from climate_data import monthly_indicators, normalize_daily_frame, rainfall_window_comparison

ROOT = Path(__file__).parent
DATA = ROOT / "data"
BASELINE_START, BASELINE_END = 1991, 2020
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _records(frame: pd.DataFrame) -> list[dict]:
    clean = frame.astype(object).where(pd.notna(frame), None)
    records = clean.to_dict(orient="records")
    for row in records:
        for key, value in row.items():
            if isinstance(value, (pd.Period, pd.Timestamp)):
                row[key] = str(value)
            elif isinstance(value, float) and not math.isfinite(value):
                row[key] = None
    return records


def dashboard_payload(frame: pd.DataFrame | None, *, window_days: int = 90,
                      advisory: dict | None = None, source: str = "Not loaded",
                      last_updated: str | None = None) -> dict:
    """Build a JSON-ready view model from validated climate rows."""
    if window_days not in {30, 60, 90, 120, 180}:
        raise ValueError("window_days must be one of 30, 60, 90, 120, 180")
    result = {
        "advisory": advisory or {},
        "source": source,
        "last_updated": last_updated,
        "baseline": {"start_year": BASELINE_START, "end_year": BASELINE_END},
        "data_loaded": frame is not None and not frame.empty,
        "coverage": None,
        "latest_full_month": None,
        "recent_window": None,
        "monthly": [],
    }
    if frame is None or frame.empty:
        return result
    daily = normalize_daily_frame(frame)
    valid = daily.dropna(subset=["precip_mm"])
    if valid.empty:
        return result
    result["coverage"] = {
        "rows": int(len(daily)),
        "rainfall_completeness_pct": round(len(valid) / len(daily) * 100, 1),
        "first_date": daily["date"].min().date().isoformat(),
        "last_date": daily["date"].max().date().isoformat(),
    }
    monthly = monthly_indicators(daily, BASELINE_START, BASELINE_END)
    result["monthly"] = _records(monthly.tail(36))
    if not monthly.empty:
        result["latest_full_month"] = result["monthly"][-1]
    window = rainfall_window_comparison(daily, window_days, BASELINE_START, BASELINE_END)
    if window.get("available"):
        result["recent_window"] = {
            key: (value.date().isoformat() if isinstance(value, pd.Timestamp) else value)
            for key, value in window.items()
            if key not in {"available", "baseline_samples"}
        }
    else:
        result["recent_window"] = {"available": False, "reason": window.get("reason", "Not enough data")}
    return result


def get_payload(path: str, query: dict[str, list[str]]) -> tuple[int, dict]:
    if path == "/api/v1/health":
        dataset_path = DATA / "iloilo_city_daily.csv"
        return 200, {"status": "ok", "climate_data_loaded": dataset_path.exists()}
    if path == "/api/v1/sources":
        return 200, {"sources": _records(pd.read_csv(DATA / "source_register.csv")),
                     "agriculture_context": _records(pd.read_csv(DATA / "agriculture_baseline.csv"))}
    if path not in {"/api/v1/overview", "/api/v1/rainfall/monthly"}:
        return 404, {"error": "Not found"}
    try:
        window_days = int(query.get("window_days", ["90"])[0])
        if window_days not in {30, 60, 90, 120, 180}:
            return 400, {"error": "window_days must be 30, 60, 90, 120, or 180"}
        advisory = json.loads((DATA / "official_context.json").read_text(encoding="utf-8"))
        data_path = DATA / "iloilo_city_daily.csv"
        frame = normalize_daily_frame(pd.read_csv(data_path)) if data_path.exists() else None
        source = "NASA POWER · Iloilo City reference point" if frame is not None else "No local climate series"
        metadata_path = DATA / "climate_dataset_metadata.json"
        updated = json.loads(metadata_path.read_text(encoding="utf-8")).get("retrieved_on") if metadata_path.exists() else None
        payload = dashboard_payload(frame, window_days=window_days, advisory=advisory,
                                    source=source, last_updated=updated)
        if path.endswith("/monthly"):
            return 200, {"monthly": payload["monthly"], "baseline": payload["baseline"], "coverage": payload["coverage"]}
        return 200, payload
    except (OSError, ValueError, KeyError, json.JSONDecodeError, pd.errors.ParserError):
        return 500, {"error": "The requested local data could not be loaded. Check its file and provenance."}


def analyze_upload(body: bytes) -> tuple[int, dict]:
    """Analyze an uploaded CSV in memory; never writes the file to disk."""
    if len(body) > MAX_UPLOAD_BYTES:
        return 413, {"error": "Upload exceeds the 10 MB limit."}
    try:
        request = json.loads(body)
        filename = request.get("filename", "uploaded.csv")
        csv_text = request.get("csv_text", "")
        window_days = int(request.get("window_days", 90))
        if not isinstance(filename, str) or not filename.lower().endswith(".csv"):
            return 400, {"error": "Choose a CSV file."}
        if not isinstance(csv_text, str) or not csv_text.strip():
            return 400, {"error": "The CSV file is empty."}
        if window_days not in {30, 60, 90, 120, 180}:
            return 400, {"error": "window_days must be 30, 60, 90, 120, or 180"}
        frame = normalize_daily_frame(pd.read_csv(StringIO(csv_text)))
        payload = dashboard_payload(frame, window_days=window_days,
                                    source=f"Uploaded CSV · {Path(filename).name}")
        return 200, payload
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError, KeyError, TypeError, pd.errors.ParserError):
        return 400, {"error": "Could not read this CSV. Check that it has a date column and rainfall values in millimetres."}


def application(environ, start_response):
    path = environ.get("PATH_INFO", "/")
    origin = environ.get("HTTP_ORIGIN", "")
    headers = [("Content-Type", "application/json; charset=utf-8"), ("Cache-Control", "no-store")]
    if origin == "http://localhost:5173":
        headers.append(("Access-Control-Allow-Origin", origin))
        headers.append(("Vary", "Origin"))
    if environ.get("REQUEST_METHOD") == "OPTIONS":
        headers.extend([("Access-Control-Allow-Methods", "GET, OPTIONS"), ("Access-Control-Allow-Headers", "Content-Type")])
        start_response("204 No Content", headers)
        return [b""]
    method = environ.get("REQUEST_METHOD", "GET")
    if method == "POST" and path == "/api/v1/analyze":
        try:
            length = int(environ.get("CONTENT_LENGTH") or "0")
            if length > MAX_UPLOAD_BYTES:
                status, body = 413, {"error": "Upload exceeds the 10 MB limit."}
            else:
                status, body = analyze_upload(environ["wsgi.input"].read(length))
        except (ValueError, KeyError):
            status, body = 400, {"error": "Invalid request body."}
    elif method != "GET":
        status, body = 405, {"error": "Method not allowed"}
        headers.append(("Allow", "GET, POST, OPTIONS"))
    else:
        status, body = get_payload(path, parse_qs(environ.get("QUERY_STRING", "")))
    encoded = json.dumps(body, allow_nan=False).encode("utf-8")
    text_status = {200: "200 OK", 400: "400 Bad Request", 404: "404 Not Found", 405: "405 Method Not Allowed", 413: "413 Payload Too Large", 500: "500 Internal Server Error"}.get(status, "500 Internal Server Error")
    headers.append(("Content-Length", str(len(encoded))))
    start_response(text_status, headers)
    return [encoded]


class QuietHandler(WSGIRequestHandler):
    def log_message(self, format, *args):
        print("API", self.address_string(), format % args)


if __name__ == "__main__":
    print("Local pilot API listening at http://127.0.0.1:8000")
    print("This development server binds to localhost only; do not expose it publicly.")
    with make_server("127.0.0.1", 8000, application, server_class=WSGIServer, handler_class=QuietHandler) as server:
        server.serve_forever()
