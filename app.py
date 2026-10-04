from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

from climate_data import (
    climap_csv_to_frame,
    monthly_indicators,
    nasa_power_json_to_frame,
    normalize_daily_frame,
    rainfall_window_comparison,
)

ROOT = Path(__file__).parent
DATA = ROOT / "data"
BASELINE_START, BASELINE_END = 1991, 2020

st.set_page_config(page_title="El Niño Impact Intelligence | Iloilo", page_icon="☀️", layout="wide")
st.markdown("""
<style>
  .stApp { background: #f4f7f9; }
  .block-container { padding-top: 1.5rem; max-width: 1480px; }
  .hero { background: linear-gradient(115deg,#102c45,#116b70); color:white; padding:1.55rem 1.8rem; border-radius:16px; margin-bottom:1rem; }
  .hero h1 { color:white; margin:0; font-size:2rem; letter-spacing:-.02em; }
  .hero p { color:#dcecee; margin:.45rem 0 0; }
  [data-testid="stMetric"] { background:white; border:1px solid #e1e8ed; padding:.75rem 1rem; border-radius:12px; }
  .fine { color:#5c6d78; font-size:.88rem; }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="hero"><h1>El Niño Impact Intelligence</h1><p>Local climate monitoring and preparedness · Iloilo pilot</p></div>', unsafe_allow_html=True)

advisory = json.loads((DATA / "official_context.json").read_text(encoding="utf-8"))
with st.container(border=True):
    left, right = st.columns([5, 1])
    with left:
        st.markdown(f"**PAGASA advisory · {advisory['issue_date']}**  \n{advisory['outlook']}")
        st.caption(advisory["important_qualification"])
    with right:
        st.link_button("Read advisory", advisory["source_url"], use_container_width=True)

with st.sidebar:
    st.header("Pilot controls")
    uploaded = st.file_uploader("Use another daily climate file", type=["csv", "json"], help="CSV needs date and rainfall columns. JSON must be a NASA POWER daily response.")
    upload_rain_unit = st.selectbox("Uploaded CSV rainfall unit", ["mm", "m"], help="Ignored for NASA POWER JSON. Confirm from the source metadata before loading.")
    upload_temp_unit = st.selectbox("Uploaded CSV temperature unit", ["C", "K"], help="Ignored for NASA POWER JSON. Confirm from the source metadata before loading.")
    window_days = st.select_slider("Recent rainfall window", options=[30, 60, 90, 120, 180], value=90, format_func=lambda x: f"{x} days")
    st.caption("Comparison baseline: 1991–2020. Change the source file to analyze another point or location.")
    st.divider()
    st.caption("Decision support only. This pilot does not issue official forecasts, drought warnings, or crop-loss estimates.")


def load_climate_file(file) -> tuple[pd.DataFrame, str]:
    if file.name.lower().endswith(".json"):
        return nasa_power_json_to_frame(json.load(file)), f"NASA POWER JSON · {file.name}"
    raw = pd.read_csv(file)
    # If this appears to be a multi-location file, ask the user to select one
    # location before interpreting the daily observations.
    location_col = next((c for c in raw.columns if str(c).strip().lower() in {"municipality", "location", "station", "place"}), None)
    if location_col and raw[location_col].nunique(dropna=True) > 1:
        chosen = st.sidebar.selectbox("Location in uploaded CSV", sorted(raw[location_col].dropna().astype(str).unique()))
        normalized = climap_csv_to_frame(raw, location_column=location_col, location=chosen,
                                         rainfall_unit=upload_rain_unit, temperature_unit=upload_temp_unit)
        return normalized, f"CliMap-compatible CSV · {chosen} · {file.name}"
    try:
        normalized = climap_csv_to_frame(raw, rainfall_unit=upload_rain_unit, temperature_unit=upload_temp_unit)
        return normalized, f"CliMap-compatible CSV · {file.name}"
    except ValueError:
        return normalize_daily_frame(raw), f"Normalized daily CSV · {file.name}"


frame: pd.DataFrame | None = None
source_label = ""
source_note = ""
try:
    if uploaded is not None:
        frame, source_label = load_climate_file(uploaded)
        source_note = "Uploaded data has no bundled provenance record. Verify its source, place, units, time standard, and usage permission before relying on it."
    elif (DATA / "iloilo_city_daily.csv").exists():
        frame = normalize_daily_frame(pd.read_csv(DATA / "iloilo_city_daily.csv"))
        source_label = "NASA POWER · Iloilo City reference point"
        metadata = json.loads((DATA / "climate_dataset_metadata.json").read_text(encoding="utf-8"))
        request = metadata["request"]
        source_note = f"{metadata['provider']} · retrieved {metadata['retrieved_on']} · coordinates {request['latitude']}, {request['longitude']} · UTC. {metadata['spatial_support']}"
    else:
        source_note = "No climate series is bundled in a fresh checkout. Follow the README data workflow or upload an authorized daily CSV."
except Exception as exc:
    st.error(f"Climate data could not be loaded: {exc}")

overview_tab, rainfall_tab, readiness_tab, sources_tab = st.tabs(["Overview", "Rainfall analysis", "Preparedness", "Data & sources"])

if frame is not None:
    daily_valid = frame.dropna(subset=["precip_mm"]).copy()
    completeness = daily_valid.shape[0] / max(len(frame), 1)
    latest_date = frame["date"].max()
    months = monthly_indicators(frame, BASELINE_START, BASELINE_END)
    window = rainfall_window_comparison(frame, window_days, BASELINE_START, BASELINE_END)

    with overview_tab:
        st.subheader("Current climate signal")
        st.caption(f"Loaded source: {source_label} · latest record {latest_date.date()}")
        if source_note:
            st.info(source_note)
        latest_complete = months.iloc[-1] if not months.empty else None
        c1, c2, c3, c4 = st.columns(4)
        if latest_complete is not None:
            month_anomaly = latest_complete["anomaly_pct"]
            c1.metric("Last complete month", str(latest_complete["month"]), f"{latest_complete['rain_mm']:.0f} mm")
            c2.metric("Monthly departure", "Unavailable" if pd.isna(month_anomaly) else f"{month_anomaly:+.0f}%", "vs 1991–2020 same-month mean" if pd.notna(month_anomaly) else "insufficient baseline")
        else:
            c1.metric("Last complete month", "Unavailable")
            c2.metric("Monthly departure", "Unavailable")
        if window.get("available"):
            delta = window["anomaly_pct"]
            c3.metric(f"Recent {window_days}-day rainfall", f"{window['current_total_mm']:.0f} mm", f"{delta:+.0f}% vs same-date baseline")
            c4.metric("Historical percentile", f"{window['empirical_percentile']:.0f}th", f"{window['baseline_years']} matched years")
        else:
            c3.metric(f"Recent {window_days}-day rainfall", "Unavailable")
            c4.metric("Historical percentile", "Unavailable")
            st.warning(window.get("reason", "Not enough complete rainfall data for a same-date comparison."))

        if window.get("available"):
            st.markdown(f"**{window_days}-day window:** {window['window_start'].date()} to {window['end_date'].date()}  ·  **Observed:** {window['current_total_mm']:.1f} mm  ·  **1991–2020 mean:** {window['normal_total_mm']:.1f} mm")
            if window["empirical_percentile"] <= 25:
                st.warning("This point-data window is in the lower quarter of the matched historical values. Treat it as a screening signal for follow-up, not a drought category or municipal finding.")
            elif window["empirical_percentile"] >= 75:
                st.success("This point-data window is in the upper quarter of the matched historical values. Local rainfall does not rule out water stress elsewhere.")
            else:
                st.info("This point-data window is within the middle half of matched historical values. Continue monitoring local observations and impacts.")

        st.markdown("#### What this can support today")
        a, b, c = st.columns(3)
        a.markdown("**Agriculture**  \nUse the rainfall signal to prompt checks on planting dates, crop stage, irrigation access, and field reports. The provincial palay total is context, not exposed area.")
        b.markdown("**Water**  \nCompare the climate signal with actual reservoir, source, and service-area status before prioritizing any response.")
        c.markdown("**Local response**  \nTrack owner, due date, status, and evidence for agreed preparedness actions in the tracker.")
        st.caption("Rainfall comparisons are descriptive point-data statistics. They are not official PAGASA categories, forecasts, or causal estimates of El Niño impacts.")

    with rainfall_tab:
        st.subheader("Rainfall versus the same-month climatology")
        if months.empty:
            st.warning("No complete calendar months are available.")
        else:
            plot = months.copy()
            plot["month_label"] = plot["month"].astype(str)
            fig = px.bar(plot, x="month_label", y="rain_mm", color="anomaly_pct", color_continuous_scale="RdYlBu", color_continuous_midpoint=0,
                         hover_data={"normal_mm": ":.1f", "anomaly_mm": ":.1f", "anomaly_pct": ":.1f", "baseline_years": True},
                         labels={"month_label": "Month", "rain_mm": "Rainfall (mm)", "anomaly_pct": "Departure from normal (%)"})
            fig.update_layout(margin=dict(l=10, r=10, t=15, b=10), coloraxis_colorbar_title="% vs normal")
            st.plotly_chart(fig, width="stretch")
            st.caption("Only complete months are shown. The baseline is the mean for the same calendar month across 1991–2020; anomaly is shown only with at least 15 valid baseline years.")
            st.dataframe(months.assign(month=months["month"].astype(str)).tail(36), width="stretch", hide_index=True)

        st.markdown("#### Rolling rainfall")
        daily_plot = daily_valid.copy()
        daily_plot[f"rain_{window_days}d_mm"] = daily_plot["precip_mm"].rolling(window_days, min_periods=window_days).sum()
        fig = px.line(daily_plot.tail(730), x="date", y=f"rain_{window_days}d_mm", labels={"date": "Date", f"rain_{window_days}d_mm": f"Rainfall in preceding {window_days} days (mm)"})
        fig.update_layout(margin=dict(l=10, r=10, t=15, b=10))
        st.plotly_chart(fig, width="stretch")
        if not daily_valid[["tmax_c", "tmin_c"]].dropna().empty:
            st.markdown("#### Daily temperature · latest year")
            temps = frame.dropna(subset=["tmax_c", "tmin_c"]).tail(366)
            temp_long = temps.melt(id_vars="date", value_vars=["tmax_c", "tmin_c"], var_name="measure", value_name="temperature_c")
            fig_temp = px.line(temp_long, x="date", y="temperature_c", color="measure", labels={"date": "Date", "temperature_c": "Temperature (°C)", "measure": "Daily measure"})
            fig_temp.update_layout(margin=dict(l=10, r=10, t=15, b=10))
            st.plotly_chart(fig_temp, width="stretch")

    with readiness_tab:
        st.subheader("Preparedness action tracker")
        st.caption("A lightweight working tracker for a pilot meeting. Changes stay in this browser session; download the CSV to keep a copy. Do not enter household or farm personal data.")
        default_actions = pd.DataFrame([
            {"Workstream": "Agriculture", "Action": "Confirm planting calendar and crop-stage reporting", "Owner": "", "Due date": "", "Status": "Not started", "Evidence / update": ""},
            {"Workstream": "Water", "Action": "Review source, storage, and service-area monitoring data", "Owner": "", "Due date": "", "Status": "Not started", "Evidence / update": ""},
            {"Workstream": "Local response", "Action": "Agree on drought-response roles and update cadence", "Owner": "", "Due date": "", "Status": "Not started", "Evidence / update": ""},
        ])
        if "pilot_actions" not in st.session_state:
            st.session_state["pilot_actions"] = default_actions
        edited = st.data_editor(st.session_state["pilot_actions"], num_rows="dynamic", width="stretch", hide_index=True,
                                column_config={"Status": st.column_config.SelectboxColumn(options=["Not started", "In progress", "Blocked", "Complete"]),
                                               "Due date": st.column_config.TextColumn(help="Use YYYY-MM-DD")})
        st.session_state["pilot_actions"] = edited
        st.download_button("Download action tracker CSV", edited.to_csv(index=False).encode("utf-8"), "iloilo_preparedness_actions.csv", "text/csv")
        st.markdown("#### Data to collect with the pilot partner")
        st.dataframe(pd.DataFrame([
            {"Workstream": "Agriculture", "Needed for local analysis": "Municipal crop area, planting dates, irrigated/rainfed status, crop-stage observations"},
            {"Workstream": "Water", "Needed for local analysis": "Water-source and service-area map, storage/supply measurements, update frequency"},
            {"Workstream": "Climate", "Needed for local analysis": "PAGASA station or CliMap series with location, units, and usage terms recorded"},
        ]), width="stretch", hide_index=True)

with sources_tab:
    st.subheader("Dataset status and provenance")
    if frame is not None:
        st.metric("Rainfall completeness", f"{completeness:.1%}", f"{len(frame):,} daily rows · {frame['date'].min().date()} to {latest_date.date()}")
        st.caption(f"Current climate input: {source_label}. {source_note}")
        st.dataframe(frame.tail(15), width="stretch", hide_index=True)
    st.markdown("#### Agriculture context")
    baseline = pd.read_csv(DATA / "agriculture_baseline.csv")
    st.dataframe(baseline, width="stretch", hide_index=True)
    st.caption("PSA provincial palay production is context only. It does not identify municipal exposure, irrigation, current crop stages, or losses.")
    geography = pd.read_csv(DATA / "iloilo_psgc_reference.csv", dtype={"province_psgc": str, "lgu_psgc": str})
    st.markdown("#### Geographic reference")
    st.caption("PSA PSGC list: 42 municipalities and Passi City. This is a name/code crosswalk, not a boundary map.")
    with st.expander("View Iloilo local governments"):
        st.dataframe(geography, width="stretch", hide_index=True)
    register = pd.read_csv(DATA / "source_register.csv")
    st.markdown("#### Source register")
    st.dataframe(register, width="stretch", hide_index=True)

if frame is None:
    with overview_tab:
        st.info("Load a daily climate series to see rainfall comparisons. This open-source checkout does not include the NASA POWER data files by default.")
        st.code("python scripts/fetch_nasa_power.py --latitude 10.72 --longitude 122.56 --start 19910101 --end 20261002 --out data/iloilo_city_nasa_power.json\npython scripts/prepare_daily_climate.py data/iloilo_city_nasa_power.json --out data/iloilo_city_daily.csv", language="bash")
    with rainfall_tab:
        st.info("Rainfall charts will appear after you load a climate dataset in the sidebar.")
    with readiness_tab:
        st.subheader("Preparedness planning")
        st.info("The climate series is optional for using this tab. Load an authorized daily dataset to compare the local signal with your planning context.")
