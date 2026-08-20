# MarsLink CTF — Design Directions

## Three possible directions

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| **Orbital Field Manual** | A mission-control instrument inspired by annotated aerospace field guides, with navigational grids, restrained technical typography, and live operational marks. | 0.07 |
| **Signal Garden** | A bright, contemporary data-visualization environment where messages travel through warm solar gradients and organic routes. | 0.04 |
| **Forensic Relay** | A compact cyber-range experience built from incident evidence, packet traces, and high-contrast alert handling. | 0.08 |

## Chosen approach — Orbital Field Manual

### Design Movement

**Modern aerospace wayfinding meets editorial technical documentation.** The interface is a polished mission console rather than a conventional dark "hacker" dashboard. It takes cues from flight-operation placards, observatory controls, and well-composed printed field manuals.

### Core Principles

1. **Operational clarity before decoration.** Every card is an instrument with a clear owner, status, and decision.
2. **Asymmetric mission composition.** A persistent rail, an editorial briefing header, then a shifting telemetry workspace avoid a generic centered dashboard.
3. **Evidence is visual.** Routes, latency, integrity, and priority are represented as marks, diagrams, and timelines rather than decorative metrics.
4. **Calm under pressure.** The base interface feels quietly composed; amber and red enter only when an attack or safety exception is active.

### Color Philosophy

The base is **midnight nav-blue and ink**, giving the product seriousness without defaulting to neon cyberpunk. Cool paper-white panels create the feel of an annotated technical dossier. A dense **signal vermilion** (#F04D32) is the ownable brand color: it appears only at decision points, in the logo, and on the active Earth–Mars signal path. Moss-teal represents verified integrity, while brass amber represents a pending or degraded transmission.

### Layout Paradigm

The desktop experience follows a **mission folio**: a 236px utility rail on the left, a compact top command strip, and an offset two-column workspace. The largest panel is the communication corridor—a deliberately wide diagram connecting Earth, relay, and Mars. Supporting cards pin themselves to its edges like annotations in a technical manual. On mobile, the rail collapses into a command bar and the corridor becomes a vertical sequence.

### Signature Elements

1. **The Burnline:** a vermilion, dotted Earth–Mars transfer route that visibly changes under attack.
2. **Margin annotations:** compact monospace labels, timestamps, and coordinate-like markers at the edge of core panels.
3. **Paper instruments:** warm white cards with subtle ink hairlines, offset shadows, and numbered incident stamps.

### Interaction Philosophy

Interactions should feel like deliberate mission actions. Scenario and defense buttons change the simulation state immediately, provide a short reason in the incident log, and make status changes legible in multiple locations. The frontend never pretends an action was performed: the model integration surface clearly shows whether the app is in simulator or live-model mode.

### Animation

The Burnline moves at a low, steady cadence while the simulator runs. An injected attack causes a single sharp route disturbance, then the diagnostics settle. Card entries use short opacity/translation transitions no longer than 220ms; alarms pulse only until acknowledged. All nonessential animation switches off under reduced-motion preferences.

### Typography System

**Space Grotesk** is the compact, confident display and interface face. **IBM Plex Mono** is reserved for telemetry, checksums, packet labels, and high-precision evidence. Headlines use Space Grotesk at heavy weights with tight tracking; descriptions use medium weight, generous leading, and sentence case. The product avoids Inter.

### Brand Essence

**MarsLink CTF turns Earth–Mars communication delay into a playable cyber-resilience drill for mission operators.** Personality: **precise, calm, alert**.

### Brand Voice

Headlines are short operational directives; CTAs name the mission action rather than an abstract outcome. Microcopy explains the consequence of a decision in plain technical language.

> “Protect the message before it becomes a maneuver.”

> “Inject a replay attack. Watch the relay decide.”

### Wordmark & Logo

The mark is a bold, text-free **split-orbit glyph**: three offset vermilion arcs form a relay beacon, interrupted by a narrow vertical gap that implies both communication delay and a defensive trust boundary. The wordmark uses a custom, widely tracked Space Grotesk treatment with the "A" crossbar omitted in supporting branding.

### Signature Brand Color

**Signal Vermilion — #F04D32.**

## Style Decisions

- **Paper instruments:** Cool paper-white dossier surfaces recur in the decision, corridor evidence, incident brief, and audit evidence moments, rather than appearing as a one-off card.
- **Burnline rule:** Signal Vermilion `#F04D32` is reserved for the split-orbit mark, active Earth–Mars path, incident stamps, and irreversible mission actions.
- **Wordmark rule:** The MarsLink wordmark uses a tracked, custom `MΛRS•LINK` treatment when space allows; it is never presented as unstyled default text.
