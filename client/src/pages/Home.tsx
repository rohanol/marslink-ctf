/**
 * MarsLink CTF visual direction: Orbital Field Manual — a calm, asymmetric aerospace
 * console using paper instruments, margin annotations, and Signal Vermilion (#F04D32)
 * only for active mission decisions.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CircleDashed,
  Clock3,
  Command,
  Cpu,
  Gauge,
  Play,
  Radio,
  RefreshCw,
  Satellite,
  ShieldAlert,
  ShieldCheck,
  Signal,
  Siren,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { requestModelDecision, type ModelDecision } from "@/lib/modelAdapter";

type ScenarioId = "nominal" | "replay" | "spoof" | "flood" | "delay";
type PacketStatus = "verified" | "flagged" | "queued" | "blocked";

type Scenario = {
  id: ScenarioId;
  label: string;
  code: string;
  severity: number;
  description: string;
  tactic: string;
  accent: "calm" | "warning" | "critical";
};

type Packet = {
  id: string;
  source: string;
  payload: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: PacketStatus;
  latency: string;
  integrity: string;
};

const scenarios: Scenario[] = [
  { id: "nominal", label: "Nominal relay", code: "S-00", severity: 0, description: "All signed packets are within the expected relay window.", tactic: "Monitor authenticated delivery", accent: "calm" },
  { id: "replay", label: "Replay injection", code: "S-01", severity: 3, description: "An old maneuver packet returns with a valid historical signature.", tactic: "Sequence validation + nonce check", accent: "critical" },
  { id: "spoof", label: "Identity spoof", code: "S-02", severity: 2, description: "An untrusted sender attempts to promote a distress packet.", tactic: "Sender attestation", accent: "warning" },
  { id: "flood", label: "Queue flood", code: "S-03", severity: 3, description: "Bulk science traffic competes with protected crew telemetry.", tactic: "Priority isolation", accent: "critical" },
  { id: "delay", label: "Delay spike", code: "S-04", severity: 1, description: "Solar geometry raises one-way transmission latency.", tactic: "Autonomous acknowledgement", accent: "warning" },
];

const basePackets: Packet[] = [
  { id: "PKT-1042", source: "EARTH / MCC", payload: "NAVIGATION VECTOR", priority: "P0", status: "verified", latency: "11m 28s", integrity: "VALID" },
  { id: "PKT-1047", source: "ARES RELAY", payload: "THERMAL STATE", priority: "P1", status: "verified", latency: "08m 04s", integrity: "VALID" },
  { id: "PKT-1051", source: "HAB-01", payload: "CREW BIOMETRICS", priority: "P0", status: "verified", latency: "02m 15s", integrity: "VALID" },
  { id: "PKT-1056", source: "SCIENCE ARRAY", payload: "SPECTRAL BATCH", priority: "P3", status: "queued", latency: "15m 36s", integrity: "VALID" },
];

const scenarioPackets: Record<ScenarioId, Packet[]> = {
  nominal: basePackets,
  replay: [{ id: "PKT-1042-R", source: "EARTH / MCC", payload: "REPLAYED VECTOR", priority: "P0", status: "blocked", latency: "11m 28s", integrity: "DUPLICATE" }, ...basePackets],
  spoof: [{ id: "PKT-1059", source: "MCC-UNVERIFIED", payload: "DISTRESS OVERRIDE", priority: "P0", status: "flagged", latency: "09m 42s", integrity: "SENDER FAIL" }, ...basePackets],
  flood: [{ id: "PKT-1060", source: "SCIENCE ARRAY", payload: "BULK STREAM × 320", priority: "P3", status: "flagged", latency: "19m 51s", integrity: "RATE LIMIT" }, ...basePackets],
  delay: [{ id: "PKT-1058", source: "EARTH / MCC", payload: "ROUTINE ADVISORY", priority: "P2", status: "queued", latency: "21m 09s", integrity: "VALID" }, ...basePackets],
};

const initialDecision: ModelDecision = {
  source: "simulator",
  recommendation: "Maintain signed delivery checks and hold the protected command queue at nominal allocation.",
  confidence: 97,
  evidence: ["All active packets match their sender identity", "Relay latency is inside the nominal envelope", "No safety policy conflicts detected"],
  action: "CONTINUE_MONITORING",
};

const nav = [
  { label: "Mission", icon: Gauge, active: true },
  { label: "Link Defense", icon: ShieldCheck },
  { label: "CTF Arena", icon: Siren },
  { label: "Decision Model", icon: Bot },
];

function fmtTime(totalSeconds: number) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function StatusPill({ status }: { status: PacketStatus }) {
  const detail = {
    verified: { label: "VERIFIED", className: "status-verified" },
    flagged: { label: "FLAGGED", className: "status-flagged" },
    queued: { label: "QUEUED", className: "status-queued" },
    blocked: { label: "BLOCKED", className: "status-blocked" },
  }[status];

  return <span className={`status-pill ${detail.className}`}>{detail.label}</span>;
}

export default function Home() {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>("nominal");
  const [isRunning, setIsRunning] = useState(true);
  const [defenseActive, setDefenseActive] = useState(true);
  const [elapsed, setElapsed] = useState(643);
  const [modelDecision, setModelDecision] = useState<ModelDecision>(initialDecision);
  const [isQuerying, setIsQuerying] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [logCount, setLogCount] = useState(14);

  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const packets = scenarioPackets[activeScenarioId];
  const integrity = useMemo(() => Math.max(65.2, 99.8 - scenario.severity * (defenseActive ? 5.8 : 10.7)), [scenario, defenseActive]);
  const queueDepth = useMemo(() => 12 + scenario.severity * (defenseActive ? 8 : 19), [scenario, defenseActive]);
  const latency = activeScenarioId === "delay" ? "21m 09s" : activeScenarioId === "flood" ? "19m 51s" : "11m 28s";
  const acceptedPackets = packets.filter((packet) => packet.status === "verified").length;

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    setModelError(null);
  }, [activeScenarioId, defenseActive]);

  async function consultModel() {
    setIsQuerying(true);
    setModelError(null);
    try {
      const decision = await requestModelDecision({ scenario: activeScenarioId, integrity, queueDepth, defenseActive });
      setModelDecision(decision);
      setLogCount((count) => count + 1);
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Decision interface unavailable");
    } finally {
      setIsQuerying(false);
    }
  }

  function activateScenario(id: ScenarioId) {
    setActiveScenarioId(id);
    setIsRunning(true);
    setLogCount((count) => count + 1);
  }

  function resetDrill() {
    setActiveScenarioId("nominal");
    setDefenseActive(true);
    setElapsed(643);
    setModelDecision(initialDecision);
    setModelError(null);
    setLogCount(14);
  }

  return (
    <div className="app-shell">
      <aside className="mission-rail" aria-label="Primary navigation">
        <div className="brand-lockup">
          <img className="brand-mark" src="/manus-storage/marslink-logo-symbol_6a3c3809.png" alt="MarsLink relay mark" />
          <div>
            <strong className="brand-wordmark" aria-label="MarsLink"><span>M</span>ΛRS<i>•</i>LINK</strong>
            <span>CTF / SW06</span>
          </div>
        </div>

        <nav className="rail-nav">
          {nav.map(({ label, icon: Icon, active }) => (
            <button className={`rail-link ${active ? "is-active" : ""}`} key={label} type="button" aria-current={active ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {active && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>

        <div className="rail-bottom">
          <div className="phase-note">
            <span className="tiny-label">MISSION PHASE</span>
            <strong>CRUISE · SOL 183</strong>
            <span>Earth ↔ Mars active window</span>
          </div>
          <div className="operator-row">
            <div className="operator-avatar">OP</div>
            <div><strong>Operator 01</strong><span>Blue team / active</span></div>
            <CircleDashed size={16} className="operator-orbit" />
          </div>
        </div>
      </aside>

      <main className="mission-main">
        <header className="mission-header">
          <div className="breadcrumb"><span>MISSIONS</span><ArrowRight size={13} /><strong>EARTH–MARS RELAY DRILL</strong></div>
          <div className="header-actions">
            <span className={`live-state ${isRunning ? "is-live" : ""}`}><i /> {isRunning ? "SIMULATION LIVE" : "PAUSED"}</span>
            <button className="icon-button" type="button" onClick={resetDrill} aria-label="Reset simulation"><RefreshCw size={16} /></button>
            <button className="operator-button" type="button"><span className="operator-dot" /> BLUE TEAM</button>
          </div>
        </header>

        <section className="briefing-band">
          <div className="briefing-copy">
            <p className="eyebrow"><span /> NSIC SW06 · DELAY-TOLERANT SECURITY</p>
            <h1>Protect the message before it becomes a maneuver.</h1>
            <p className="briefing-text">A mission communications drill for testing integrity, priority, and autonomous recovery across an Earth–Mars relay corridor.</p>
          </div>
          <div className="briefing-art" role="img" aria-label="Secure communication relay linking Earth and Mars">
            <div className="art-stamp">M-183<br /><span>RELAY WINDOW</span></div>
          </div>
        </section>

        <section className="mission-stats" aria-label="Mission summary">
          <article className="stat-card">
            <div className="stat-icon"><Signal size={17} /></div>
            <div><span className="tiny-label">LINK INTEGRITY</span><strong>{integrity.toFixed(1)}<em>%</em></strong><small className={integrity > 90 ? "trend-positive" : "trend-negative"}>{integrity > 90 ? "Nominal trust envelope" : "Degraded under incident"}</small></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon amber"><Clock3 size={17} /></div>
            <div><span className="tiny-label">ONE-WAY DELAY</span><strong>{latency}</strong><small>Ephemeris-adjusted estimate</small></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon"><Radio size={17} /></div>
            <div><span className="tiny-label">PROTECTED QUEUE</span><strong>{queueDepth}<em> / 64</em></strong><small>{acceptedPackets} verified packets in view</small></div>
          </article>
          <article className="stat-card mission-clock">
            <div><span className="tiny-label">DRILL CLOCK</span><strong>{fmtTime(elapsed)}</strong><small>Simulated mission elapsed time</small></div>
            <button className="play-control" type="button" onClick={() => setIsRunning((value) => !value)} aria-label={isRunning ? "Pause simulation" : "Resume simulation"}>{isRunning ? <span className="pause-bars" /> : <Play size={15} fill="currentColor" />}</button>
          </article>
        </section>

        <div className="content-layout">
          <section className="primary-stack">
            <article className={`panel corridor-panel incident-${scenario.accent}`}>
              <div className="panel-heading corridor-heading">
                <div><span className="panel-index">01</span><div><h2>Communication corridor</h2><p>Authenticated delivery pathway · active window</p></div></div>
                <div className="corridor-state"><span className={`severity-dot ${scenario.accent}`} /> {scenario.id === "nominal" ? "CLEAR ROUTE" : "INCIDENT PRESENT"}</div>
              </div>

              <div className="corridor-canvas">
                <div className="orbital-label earth-label"><strong>EARTH</strong><span>Mission Control</span></div>
                <div className="orbital-label relay-label"><strong>ARES-4</strong><span>Trusted relay</span></div>
                <div className="orbital-label mars-label"><strong>MARS</strong><span>Habitat 01</span></div>
                <svg className="signal-map" viewBox="0 0 900 260" fill="none" aria-hidden="true">
                  <path className="signal-guide" d="M99 164C268 56 560 47 812 137" />
                  <path className={`signal-path ${isRunning ? "is-moving" : ""} ${scenario.id !== "nominal" ? "is-disturbed" : ""}`} d="M99 164C268 56 560 47 812 137" pathLength="100" />
                  <circle className="earth-orbit" cx="99" cy="164" r="38" /><circle className="earth-core" cx="99" cy="164" r="27" />
                  <circle className="mars-orbit" cx="812" cy="137" r="42" /><circle className="mars-core" cx="812" cy="137" r="30" />
                  <path className="relay-body" d="M452 83l25 18-11 29h-30l-11-29 27-18Z" /><path className="relay-wing" d="M416 102h20m29 0h20M443 88l-22-13m40 13 22-13" />
                  {scenario.id !== "nominal" && <g className="attack-marker"><circle cx="592" cy="61" r="17" /><path d="M592 52v11m0 7h.01" /></g>}
                </svg>
                <div className="route-metric metric-one"><span>LATENCY</span><strong>{latency}</strong></div>
                <div className="route-metric metric-two"><span>TRUST</span><strong>{integrity.toFixed(1)}%</strong></div>
                {scenario.id !== "nominal" && <div className="incident-callout"><AlertTriangle size={15} /><span>{scenario.label.toUpperCase()}</span></div>}
                <div className="folio-note"><span>BURNLINE / 01</span><strong>Signed transfer route</strong></div>
              </div>

              <div className="corridor-footer">
                <div className="signature-state"><ShieldCheck size={16} /><span>Sender attestation {defenseActive ? "enforced" : "suspended"}</span></div>
                <button className="underlined-action" type="button" onClick={() => setDefenseActive((value) => !value)}>{defenseActive ? "Suspend defense policy" : "Reinstate defense policy"}<ArrowRight size={14} /></button>
              </div>
            </article>

            <article className="panel packet-panel">
              <div className="panel-heading">
                <div><span className="panel-index">02</span><div><h2>Packet ledger</h2><p>Integrity checks across the active routing window</p></div></div>
                <button type="button" className="subtle-button"><Terminal size={15} /> EXPORT TRACE</button>
              </div>
              <div className="packet-table-wrap">
                <table className="packet-table">
                  <thead><tr><th>PACKET</th><th>ORIGIN</th><th>PAYLOAD</th><th>PRIORITY</th><th>LATENCY</th><th>INTEGRITY</th></tr></thead>
                  <tbody>{packets.map((packet) => <tr key={packet.id}><td><strong>{packet.id}</strong></td><td>{packet.source}</td><td>{packet.payload}</td><td><span className={`priority priority-${packet.priority.toLowerCase()}`}>{packet.priority}</span></td><td>{packet.latency}</td><td><StatusPill status={packet.status} /></td></tr>)}</tbody>
                </table>
              </div>
            </article>
          </section>

          <aside className="secondary-stack">
            <article className="panel incident-panel">
              <div className="panel-heading compact-heading"><div><span className="panel-index">03</span><div><h2>CTF arena</h2><p>Inject a controlled incident</p></div></div><Siren size={19} /></div>
              <div className="scenario-list">
                {scenarios.map((item) => (
                  <button className={`scenario-button ${item.id === scenario.id ? "is-selected" : ""}`} key={item.id} type="button" onClick={() => activateScenario(item.id)}>
                    <span className={`scenario-number ${item.accent}`}>{item.code}</span><span className="scenario-content"><strong>{item.label}</strong><small>{item.tactic}</small></span>{item.id === scenario.id ? <Check size={16} /> : <ChevronRight size={16} />}
                  </button>
                ))}
              </div>
              <div className={`scenario-brief dossier-brief ${scenario.accent}`}><span className="tiny-label">ACTIVE BRIEF</span><p>{scenario.description}</p><div><ShieldAlert size={14} /><span>{defenseActive ? "Defense policy active" : "Defense policy suspended"}</span></div></div>
            </article>

            <article className="panel advisor-panel">
              <div className="advisor-image" aria-hidden="true"><span>DECISION<br />INTERFACE</span></div>
              <div className="advisor-body">
                <div className="advisor-heading"><div><span className="panel-index">04</span><h2>Decision interface</h2></div><span className={`model-source ${modelDecision.source}`}>{modelDecision.source === "model" ? "LIVE MODEL" : "SIMULATOR"}</span></div>
                <p className="recommendation">{modelDecision.recommendation}</p>
                <div className="confidence-row"><div><span>CONFIDENCE</span><strong>{modelDecision.confidence}%</strong></div><div className="confidence-bar"><i style={{ width: `${modelDecision.confidence}%` }} /></div></div>
                <div className="evidence-list">{modelDecision.evidence.map((evidence) => <div key={evidence}><Sparkles size={13} /><span>{evidence}</span></div>)}</div>
                {modelError && <p className="model-error"><AlertTriangle size={14} />{modelError}</p>}
                <button className="model-button" type="button" onClick={consultModel} disabled={isQuerying}>{isQuerying ? <RefreshCw size={15} className="spin" /> : <Bot size={15} />}{isQuerying ? "QUERYING DECISION..." : "QUERY DECISION INTERFACE"}</button>
                <p className="model-note"><Cpu size={13} />Model endpoint is optional; this drill remains usable offline.</p>
              </div>
            </article>
          </aside>
        </div>

        <section className="evidence-strip paper-evidence">
          <div className="evidence-title"><span className="panel-index">05</span><div><h2>Audit evidence</h2><p>{logCount} immutable events recorded</p></div></div>
          <div className="audit-events">
            <div><span>14:32:08</span><strong>Policy engine verified protected queue allocation</strong></div>
            <div className={scenario.id === "nominal" ? "muted-event" : "alert-event"}><span>14:33:16</span><strong>{scenario.id === "nominal" ? "No incident injection selected" : `${scenario.label} injected into relay corridor`}</strong></div>
            <div><span>14:33:24</span><strong>{defenseActive ? "Defense policy produced a tamper-evident decision" : "Operator suspended automated defense policy"}</strong></div>
          </div>
          <button className="evidence-link" type="button"><BarChart3 size={15} /> VIEW CHAIN<ArrowRight size={14} /></button>
        </section>
      </main>
    </div>
  );
}
