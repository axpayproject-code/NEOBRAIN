"""Validated transformations for the El Niño local impact pilot."""

from __future__ import annotations

from pathlib import Path
import json
import re
import pandas as pd

REQUIRED_COLUMNS = {"date", "precip_mm"}
OPTIONAL_COLUMNS = {"tmax_c", "tmin_c"}

CLIMAP_ALIASES = {
    "date": {"date", "day", "time", "observation_date"},
    "precip_mm": {"precip_mm", "rain_mm", "rainfall_mm", "rainfall_m", "rainfall", "precipitation", "precipitation_mm", "rr", "rain"},
    "tmax_c": {"tmax_c", "tmax_k", "tmax", "max_temp", "maximum_temperature", "temperature_max", "tmax_deg_c"},
    "tmin_c": {"tmin_c", "tmin_k", "tmin", "min_temp", "minimum_temperature", "temperature_min", "tmin_deg_c"},
}


def climap_csv_to_frame(frame: pd.DataFrame, *, location_column: str | None = None,
                        location: str | None = None, rainfall_unit: str = "mm",
                        temperature_unit: str = "c") -> pd.DataFrame:
    """Map a PAGASA CliMap CSV export to canonical daily columns.

    Column aliases are intentionally conservative. Ambiguous files must be
    mapped explicitly by the caller rather than silently interpreted.
    """
    data = frame.copy()
    normalized = {re.sub(r"[^a-z0-9]+", "_", str(column).strip().lower()).strip("_"): column for column in data.columns}
    rename = {}
    for target, aliases in CLIMAP_ALIASES.items():
        alias_keys = {re.sub(r"[^a-z0-9]+", "_", alias).strip("_") for alias in aliases}
        matches = [normalized[a] for a in alias_keys if a in normalized]
        if len(matches) > 1:
            raise ValueError(f"Ambiguous columns for {target}: {', '.join(map(str, matches))}")
        if matches:
            rename[matches[0]] = target
    if location is not None:
        if location_column is None or location_column not in data.columns:
            raise ValueError("A valid location_column is required when filtering a location")
        data = data[data[location_column].astype(str).str.casefold() == location.casefold()].copy()
        if data.empty:
            raise ValueError(f"No rows matched location {location!r}")
    data = data.rename(columns=rename)
    if "date" not in data.columns or "precip_mm" not in data.columns:
        raise ValueError("Could not identify date and rainfall columns; expected date and a rainfall column such as rainfall_mm or RR")
    if rainfall_unit.lower() in {"m", "meter", "meters"}:
        data["precip_mm"] = pd.to_numeric(data["precip_mm"], errors="coerce") * 1000
    elif rainfall_unit.lower() not in {"mm", "millimeter", "millimeters"}:
        raise ValueError("rainfall_unit must be mm or m")
    if temperature_unit.lower() in {"k", "kelvin"}:
        for column in ("tmax_c", "tmin_c"):
            if column in data:
                data[column] = pd.to_numeric(data[column], errors="coerce") - 273.15
    elif temperature_unit.lower() not in {"c", "celsius", "°c"}:
        raise ValueError("temperature_unit must be C or K")
    return normalize_daily_frame(data)


def normalize_daily_frame(frame: pd.DataFrame) -> pd.DataFrame:
    """Normalize a daily climate table and reject malformed/duplicate dates."""
    data = frame.copy()
    data.columns = [str(column).strip().lower() for column in data.columns]
    missing = REQUIRED_COLUMNS - set(data.columns)
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")
    for column in OPTIONAL_COLUMNS:
        if column not in data:
            data[column] = pd.NA
    data = data[["date", "precip_mm", "tmax_c", "tmin_c"]]
    data["date"] = pd.to_datetime(data["date"], errors="coerce").dt.normalize()
    for column in ("precip_mm", "tmax_c", "tmin_c"):
        data[column] = pd.to_numeric(data[column], errors="coerce")
    data = data.dropna(subset=["date"]).sort_values("date")
    if data["date"].duplicated().any():
        duplicates = data.loc[data["date"].duplicated(), "date"].dt.strftime("%Y-%m-%d").tolist()
        raise ValueError(f"Duplicate daily dates found: {', '.join(duplicates[:5])}")
    data.loc[data["precip_mm"] < 0, "precip_mm"] = pd.NA
    data.loc[data["precip_mm"] > 2000, "precip_mm"] = pd.NA
    return data.reset_index(drop=True)


def nasa_power_json_to_frame(path_or_payload: str | Path | dict) -> pd.DataFrame:
    """Convert a NASA POWER daily point JSON response to normalized daily rows."""
    if isinstance(path_or_payload, dict):
        payload = path_or_payload
    else:
        with open(path_or_payload, encoding="utf-8") as handle:
            payload = json.load(handle)
    parameters = payload.get("properties", {}).get("parameter", {})
    if not parameters:
        raise ValueError("NASA POWER response has no properties.parameter data")
    all_dates = sorted({date for values in parameters.values() for date in values})
    out = pd.DataFrame({"date": pd.to_datetime(all_dates, format="%Y%m%d", errors="coerce")})
    name_map = {"PRECTOTCORR": "precip_mm", "T2M_MAX": "tmax_c", "T2M_MIN": "tmin_c"}
    for source_name, target_name in name_map.items():
        values = parameters.get(source_name, {})
        out[target_name] = [values.get(date) for date in all_dates]
        out[target_name] = pd.to_numeric(out[target_name], errors="coerce").replace(-999, pd.NA)
    if out["precip_mm"].isna().all():
        raise ValueError("NASA POWER response is missing PRECTOTCORR rainfall data")
    return normalize_daily_frame(out)


def monthly_indicators(frame: pd.DataFrame, baseline_start: int = 1991, baseline_end: int = 2020,
                       minimum_baseline_years: int = 15) -> pd.DataFrame:
    """Return complete-month rainfall totals and descriptive calendar-month anomalies."""
    daily = normalize_daily_frame(frame)
    valid = daily.dropna(subset=["precip_mm"]).copy()
    if valid.empty:
        return pd.DataFrame(columns=["month", "rain_mm", "normal_mm", "anomaly_mm", "anomaly_pct", "baseline_years"])
    valid["month"] = valid["date"].dt.to_period("M")
    last_observed = valid["date"].max()
    monthly = valid.groupby("month", as_index=False).agg(rain_mm=("precip_mm", "sum"), days_observed=("date", "nunique"))
    monthly["month_end"] = monthly["month"].dt.to_timestamp("M")
    monthly["expected_days"] = monthly["month"].dt.days_in_month
    monthly["complete_month"] = (
        (monthly["month_end"].dt.date <= last_observed.date())
        & (monthly["days_observed"] == monthly["expected_days"])
    )
    monthly = monthly[monthly["complete_month"]].copy()
    monthly["calendar_month"] = monthly["month"].dt.month
    monthly["year"] = monthly["month"].dt.year
    baseline = monthly[monthly["year"].between(baseline_start, baseline_end)]
    normals = baseline.groupby("calendar_month").agg(
        normal_mm=("rain_mm", "mean"), baseline_years=("year", "nunique")
    ).reset_index()
    result = monthly.merge(normals, on="calendar_month", how="left")
    result["baseline_years"] = result["baseline_years"].fillna(0).astype(int)
    enough = result["baseline_years"] >= minimum_baseline_years
    result["anomaly_mm"] = (result["rain_mm"] - result["normal_mm"]).where(enough)
    result["anomaly_pct"] = ((result["rain_mm"] / result["normal_mm"] - 1) * 100).where(enough & (result["normal_mm"] > 0))
    return result[["month", "rain_mm", "normal_mm", "anomaly_mm", "anomaly_pct", "baseline_years", "days_observed"]].reset_index(drop=True)


def rainfall_window_comparison(frame: pd.DataFrame, window_days: int = 90,
                               baseline_start: int = 1991, baseline_end: int = 2020,
                               minimum_baseline_years: int = 15) -> dict:
    """Compare the latest complete rolling rainfall window with same-date years.

    Returns a descriptive empirical comparison, not a drought classification.
    A baseline sample is included only when every day in the window is present.
    For leap day, non-leap years use February 28 as the seasonal match.
    """
    if window_days < 1:
        raise ValueError("window_days must be positive")
    daily = normalize_daily_frame(frame).set_index("date")["precip_mm"].sort_index()
    if daily.empty or daily.notna().sum() < window_days:
        return {"available": False, "reason": f"At least {window_days} valid daily rainfall values are needed."}
    full_index = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    daily = daily.reindex(full_index)
    rolling = daily.rolling(window_days, min_periods=window_days).sum()
    current_end = rolling.last_valid_index()
    if current_end is None:
        return {"available": False, "reason": f"No complete {window_days}-day rainfall window is available."}
    current_total = float(rolling.loc[current_end])
    samples = []
    for year in range(baseline_start, baseline_end + 1):
        try:
            target = pd.Timestamp(year=year, month=current_end.month, day=current_end.day)
        except ValueError:  # February 29 has no exact match in non-leap years.
            target = pd.Timestamp(year=year, month=2, day=28)
        if target in rolling.index and pd.notna(rolling.loc[target]):
            samples.append({"year": year, "total_mm": float(rolling.loc[target])})
    values = [item["total_mm"] for item in samples]
    if len(values) < minimum_baseline_years:
        return {
            "available": False,
            "reason": f"Only {len(values)} complete same-date baseline windows; {minimum_baseline_years} are required.",
            "end_date": current_end,
            "current_total_mm": current_total,
            "baseline_years": len(values),
        }
    normal = sum(values) / len(values)
    below_pct = sum(value <= current_total for value in values) / len(values) * 100
    return {
        "available": True,
        "end_date": current_end,
        "window_start": current_end - pd.Timedelta(days=window_days - 1),
        "window_days": window_days,
        "current_total_mm": current_total,
        "normal_total_mm": normal,
        "anomaly_mm": current_total - normal,
        "anomaly_pct": (current_total / normal - 1) * 100 if normal > 0 else None,
        "baseline_years": len(values),
        "empirical_percentile": below_pct,
        "baseline_samples": pd.DataFrame(samples),
    }
