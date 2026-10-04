import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Month = {
  month: string;
  rain_mm: number;
  normal_mm: number | null;
  anomaly_pct: number | null;
  baseline_years: number;
};

type Overview = {
  advisory: { issue_date?: string; advisory_status?: string; outlook?: string; important_qualification?: string; source_url?: string };
  source: string;
  last_updated: string | null;
  data_loaded: boolean;
  coverage: { rows: number; rainfall_completeness_pct: number; first_date: string; last_date: string } | null;
  latest_full_month: Month | null;
  recent_window: {
    window_start?: string; end_date?: string; window_days?: number; current_total_mm?: number;
    normal_total_mm?: number; anomaly_pct?: number; empirical_percentile?: number;
    baseline_years?: number; reason?: string;
  } | null;
  monthly: Month[];
};

type Action = { title: string; owner: string; due: string; status: string };
type SourceRecord = {
  dataset: string; provider: string; source_url: string; geographic_coverage: string;
  temporal_coverage: string; license_or_terms: string; known_limitations: string; status_as_of_2026_10_04?: string;
};
type UploadedCsv = { filename: string; csv_text: string };
const API = "/api/v1";
const actionSeed: Action[] = [
  { title: "Review planting calendar and crop-stage updates", owner: "", due: "", status: "Planned" },
  { title: "Check irrigation and source monitoring coverage", owner: "", due: "", status: "Planned" },
  { title: "Confirm who issues and receives local updates", owner: "", due: "", status: "Planned" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" });
}

function RainChart({ months }: { months: Month[] }) {
  const data = months.slice(-12);
  if (!data.length) return <div className="chart-empty">No monthly series loaded.</div>;
  const max = Math.max(1, ...data.map((d) => Math.max(d.rain_mm || 0, d.normal_mm || 0)));
  return <div className="chart-scroll"><div className="chart" role="img" aria-label="Monthly observed rainfall and 1991 to 2020 baseline">
    {data.map((d) => {
      const observedHeight = Math.max(2, (d.rain_mm / max) * 170);
      const normalHeight = Math.max(2, ((d.normal_mm || 0) / max) * 170);
      return <div className="chart-month" key={d.month} title={`${d.month}: ${d.rain_mm.toFixed(0)} mm observed; ${d.normal_mm?.toFixed(0) ?? "no"} mm normal`}>
        <div className="bar-pair"><div className="bar normal" style={{ height: normalHeight }} /><div className="bar observed" style={{ height: observedHeight }} /></div>
        <span>{new Date(`${d.month}-01T00:00:00`).toLocaleDateString("en", { month: "short" })}</span>
      </div>;
    })}
  </div></div>;
}

function App() {
  const [windowDays, setWindowDays] = useState(90);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [uploadedCsv, setUploadedCsv] = useState<UploadedCsv | null>(null);
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(true);
  const [sourceError, setSourceError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [actions, setActions] = useState<Action[]>(() => {
    try { return JSON.parse(localStorage.getItem("elnino-actions") || "null") || actionSeed; }
    catch { return actionSeed; }
  });
  const [activeView, setActiveView] = useState("Overview");

  useEffect(() => {
    let active = true;
    setBusy(true);
    const request = uploadedCsv
      ? fetch(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...uploadedCsv, window_days: windowDays }) })
      : fetch(`${API}/overview?window_days=${windowDays}`);
    request
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `API returned ${response.status}`);
        }
        return response.json() as Promise<Overview>;
      })
      .then((data) => { if (active) { setOverview(data); setApiError(""); } })
      .catch((error: Error) => { if (active) setApiError(error.message || "Climate API is not running. Start the Python API to load current indicators."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [windowDays, uploadedCsv]);

  useEffect(() => {
    fetch(`${API}/sources`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Source register could not be loaded.");
        return response.json() as Promise<{ sources: SourceRecord[] }>;
      })
      .then((data) => setSources(data.sources))
      .catch(() => setSourceError("Start the Python API to load the source register."));
  }, []);

  async function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setApiError("Choose a CSV file with daily climate data.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setApiError("The CSV must be smaller than 10 MB.");
      return;
    }
    setApiError("");
    setUploadedCsv({ filename: file.name, csv_text: await file.text() });
  }

  const latest = overview?.latest_full_month;
  const window = overview?.recent_window;
  const percentileLabel = useMemo(() => {
    if (window?.empirical_percentile == null) return "No matched baseline";
    return `${Math.round(window.empirical_percentile)}th percentile`;
  }, [window?.empirical_percentile]);

  function updateAction(index: number, key: keyof Action, value: string) {
    const next = actions.map((item, i) => i === index ? { ...item, [key]: value } : item);
    setActions(next);
    localStorage.setItem("elnino-actions", JSON.stringify(next));
  }

  function addAction() {
    const next = [...actions, { title: "New preparedness action", owner: "", due: "", status: "Planned" }];
    setActions(next);
    localStorage.setItem("elnino-actions", JSON.stringify(next));
  }

  function downloadActions() {
    const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;
    const csv = ["Action,Owner,Due date,Status", ...actions.map((a) => [a.title, a.owner, a.due, a.status].map(quote).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "iloilo-preparedness-actions.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const navItems = ["Overview", "Rainfall", "Preparedness", "Data sources"];
  const navTargets: Record<string, string> = { Overview: "overview", Rainfall: "rainfall", Preparedness: "preparedness", "Data sources": "data-sources" };

  return <div className="layout">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">EI</div><div><strong>Impact Intel</strong><small>Climate readiness</small></div></div>
      <div className="pilot-label">PILOT AREA</div>
      <button className="location"><span className="pin">⌖</span><span><strong>Iloilo</strong><small>Western Visayas</small></span><span className="chevron">⌄</span></button>
      <div className="nav-label">WORKSPACE</div>
      <nav>{navItems.map((item, i) => <button key={item} className={`nav-item ${activeView === item ? "active" : ""}`} onClick={() => { setActiveView(item); document.getElementById(navTargets[item])?.scrollIntoView({ behavior: "smooth" }); }}>
        <span className="nav-icon">{["◫", "⌁", "✓", "▤"][i]}</span>{item}
      </button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-status"><span className="status-dot" /> Data status <strong>{overview?.data_loaded ? "Connected" : "Waiting"}</strong></div><small>Decision support · v0.1</small></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Climate readiness <span>/</span> Iloilo</div><div className="top-actions"><span className="updated">Updated {formatDate(overview?.coverage?.last_date)}</span><input ref={fileInput} className="file-input-hidden" type="file" accept=".csv,text/csv" onChange={handleCsvUpload} aria-label="Choose a daily climate CSV"/><button className="upload-button" onClick={() => fileInput.current?.click()}>{uploadedCsv ? "Change CSV" : "Analyze CSV"}</button>{uploadedCsv && <button className="reset-button" onClick={() => setUploadedCsv(null)}>Use local data</button>}</div></header>

      <section id="overview" className="page-heading"><div><p className="eyebrow">LOCAL IMPACT MONITOR</p><h1>El Niño readiness</h1><p className="subhead">Climate context and preparedness actions for Iloilo</p></div>
        <label className="window-select">Comparison window<select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))}>{[30, 60, 90, 120, 180].map((n) => <option key={n} value={n}>{n} days</option>)}</select></label>
      </section>

      <section className="advisory-card"><div className="advisory-icon">!</div><div className="advisory-copy"><div className="advisory-title"><strong>{overview?.advisory?.advisory_status || "PAGASA advisory context"}</strong><span>ISSUED {overview?.advisory?.issue_date || "—"}</span></div>
        <p>{overview?.advisory?.outlook || "Load the advisory source to view the latest official context."}</p><small>{overview?.advisory?.important_qualification || "Use official forecasts for warnings and current forecasts."}</small></div>
        {overview?.advisory?.source_url && <a className="advisory-link" href={overview.advisory.source_url} target="_blank" rel="noreferrer">Official source ↗</a>}
      </section>

      {apiError && <div className="error-banner" role="status">{apiError}</div>}
      {busy && <div className="loading-banner">Refreshing indicators…</div>}
      {overview && !overview.data_loaded && <div className="info-banner">No climate series is available here. Fetch the exploratory series or analyze a climate CSV with date and rainfall columns. Uploaded CSVs are processed in memory and not saved by this prototype.</div>}
      {uploadedCsv && <div className="upload-notice">Analyzing <strong>{uploadedCsv.filename}</strong> · processed in memory for this session; the API does not save the file.</div>}

      <section className="metric-grid" aria-label="Climate indicators">
        <article className="metric-card"><div className="metric-label">LAST COMPLETE MONTH <span className="mini-icon">◷</span></div><div className="metric-value">{latest ? <>{latest.rain_mm.toFixed(0)} <small>mm</small></> : "—"}</div><div className="metric-foot">{latest?.month || "Monthly total"}</div></article>
        <article className="metric-card"><div className="metric-label">MONTHLY DEPARTURE <span className="mini-icon">↗</span></div><div className={`metric-value ${latest?.anomaly_pct != null && latest.anomaly_pct < 0 ? "negative" : "positive"}`}>{latest?.anomaly_pct != null ? `${latest.anomaly_pct > 0 ? "+" : ""}${latest.anomaly_pct.toFixed(0)}%` : "—"}</div><div className="metric-foot">vs same-month 1991–2020 mean</div></article>
        <article className="metric-card"><div className="metric-label">RECENT {windowDays}-DAY RAIN <span className="mini-icon">⌁</span></div><div className="metric-value">{window?.current_total_mm != null ? <>{window.current_total_mm.toFixed(0)} <small>mm</small></> : "—"}</div><div className="metric-foot">{window?.anomaly_pct != null ? `${window.anomaly_pct > 0 ? "+" : ""}${window.anomaly_pct.toFixed(0)}% vs matched years` : window?.reason || "Same-date baseline"}</div></article>
        <article className="metric-card"><div className="metric-label">HISTORICAL POSITION <span className="mini-icon">◉</span></div><div className="metric-value">{window?.empirical_percentile != null ? <>{Math.round(window.empirical_percentile)}<small>th</small></> : "—"}</div><div className="metric-foot">{percentileLabel} · {window?.baseline_years ?? 0} matched years</div></article>
      </section>

      <section id="rainfall" className="content-grid">
        <article className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">RAINFALL HISTORY</p><h2>Observed vs baseline</h2></div><div className="legend"><span><i className="legend-dot observed-dot" />Observed</span><span><i className="legend-dot normal-dot" />1991–2020 mean</span></div></div>
          <RainChart months={overview?.monthly || []} />
          <div className="chart-caption">Monthly totals for complete months. The comparison uses the same calendar month across the 1991–2020 baseline.</div>
        </article>
        <article className="panel signal-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT WINDOW</p><h2>{windowDays}-day comparison</h2></div><span className="window-badge">DESCRIPTIVE</span></div>
          {window?.current_total_mm != null ? <><div className="signal-dates">{formatDate(window.window_start)} — {formatDate(window.end_date)}</div><div className="compare-line"><div><small>Observed</small><strong>{window.current_total_mm.toFixed(1)} <em>mm</em></strong></div><div className="compare-divider" /><div><small>Baseline mean</small><strong>{window.normal_total_mm?.toFixed(1) ?? "—"} <em>mm</em></strong></div></div><div className="percentile-track"><div className="track-fill" style={{ width: `${Math.max(4, Math.min(100, window.empirical_percentile || 0))}%` }} /><span className="track-marker" style={{ left: `${Math.max(2, Math.min(98, window.empirical_percentile || 0))}%` }} /></div><div className="track-labels"><span>0th</span><strong>{percentileLabel}</strong><span>100th</span></div></> : <div className="chart-empty">{window?.reason || "A complete comparison window will appear when climate data is loaded."}</div>}
          <div className="signal-note">This comparison describes one gridded reference point. It is not an official drought category or a municipality-level risk estimate.</div>
        </article>
      </section>

      <section id="preparedness" className="bottom-grid">
        <article className="panel actions-panel"><div className="panel-heading"><div><p className="eyebrow">COORDINATED RESPONSE</p><h2>Preparedness actions</h2></div><button className="text-button" onClick={addAction}>+ Add action</button></div>
          <div className="action-list">{actions.map((action, i) => <div className="action-row" key={`${i}-${action.title}`}><button type="button" className={`check ${action.status === "Complete" ? "checked" : ""}`} onClick={() => updateAction(i, "status", action.status === "Complete" ? "Planned" : "Complete")} aria-label={`Mark ${action.title} ${action.status === "Complete" ? "planned" : "complete"}`}>{action.status === "Complete" ? "✓" : ""}</button><input className="action-title" value={action.title} onChange={(e) => updateAction(i, "title", e.target.value)} aria-label="Action title"/><input value={action.owner} placeholder="Owner" onChange={(e) => updateAction(i, "owner", e.target.value)} aria-label="Action owner"/><input value={action.due} type="date" onChange={(e) => updateAction(i, "due", e.target.value)} aria-label="Due date"/></div>)}</div>
          <div className="actions-footer"><span>Saved in this browser only</span><button className="download-button" onClick={downloadActions}>↓ Export CSV</button></div>
        </article>
        <article id="data-sources" className="panel context-panel"><div className="panel-heading"><div><p className="eyebrow">PROVENANCE REGISTER</p><h2>Data sources and limits</h2></div><span className="source-count">{sources.length} sources</span></div>
          {sourceError && <p className="source-error">{sourceError}</p>}
          {sources.map((source, index) => <div className="context-item" key={`${source.provider}-${index}`}><span className="context-number">{String(index + 1).padStart(2, "0")}</span><div><a className="source-title" href={source.source_url} target="_blank" rel="noreferrer">{source.dataset} ↗</a><p><strong>{source.provider}</strong> · {source.geographic_coverage} · {source.temporal_coverage}</p><p>{source.known_limitations}</p><small>{source.license_or_terms}</small></div></div>)}
          {overview?.coverage && <div className="current-series">Current series: <strong>{overview.source}</strong> · {overview.coverage.rainfall_completeness_pct}% daily rainfall completeness · {formatDate(overview.coverage.first_date)} to {formatDate(overview.coverage.last_date)}</div>}
        </article>
      </section>
      <footer className="footer-note"><span>EL NIÑO IMPACT INTELLIGENCE · ILOILO PILOT</span><span>Decision support only · PAGASA remains the official source for forecasts and warnings.</span></footer>
    </main>
  </div>;
}

export default App;
