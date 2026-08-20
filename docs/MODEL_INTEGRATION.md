# MarsLink CTF Model Integration Contract

MarsLink is deliberately complete as a **frontend simulation**. Before a trained model endpoint is supplied, the UI uses a deterministic decision policy that is visibly labeled **Simulator**. This provides a reliable demonstration fallback while preserving one clean replacement point for the hackathon model.

## Fast hookup

Create a `.env` file at the project root and set `VITE_MARSLINK_MODEL_ENDPOINT` to the HTTPS endpoint that hosts the trained model. The endpoint must permit browser CORS requests from the deployed frontend domain. Restart the frontend after changing the environment variable.

```env
VITE_MARSLINK_MODEL_ENDPOINT=https://your-model.example.com/decision
```

The client integration lives in `client/src/lib/modelAdapter.ts`. It sends a `POST` request and renders the returned recommendation, confidence, evidence, and action string in the Decision Interface panel.

## Request payload

```json
{
  "scenario": "replay",
  "integrity": 82.4,
  "queueDepth": 37,
  "defenseActive": true
}
```

## Required response payload

```json
{
  "recommendation": "Quarantine the duplicate maneuver packet and request a fresh signed sequence.",
  "confidence": 94,
  "evidence": [
    "Sequence 1042 was observed twice",
    "Timestamp drift exceeds the relay window",
    "Signature chain remains valid only for the first delivery"
  ],
  "action": "BLOCK_DUPLICATE"
}
```

| Field | Type | Client behavior |
|---|---|---|
| `recommendation` | `string` | Rendered as the human-readable operational decision. |
| `confidence` | `number` | Clamped to 0–100 and shown as a confidence score. |
| `evidence` | `string[]` | The first three pieces of evidence are shown in the evidence stack. |
| `action` | `string` | Rendered as a compact command-style policy label. |

## Deliberate frontend boundary

This static client does not embed secrets or proxy credentials. If your trained model needs a private API key, place a minimal secured backend or serverless proxy between the web app and the model after the hackathon; never place the key in `VITE_*` variables. For the live hackathon demonstration, use a public CORS-enabled endpoint or retain the simulator fallback.
