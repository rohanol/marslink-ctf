/**
 * MarsLink CTF visual contract: the app is an Orbital Field Manual, so model output is
 * surfaced as evidenced operational advice rather than a black-box answer.
 */
export type ModelDecisionInput = {
  scenario: string;
  integrity: number;
  queueDepth: number;
  defenseActive: boolean;
};

export type ModelDecision = {
  source: "model" | "simulator";
  recommendation: string;
  confidence: number;
  evidence: string[];
  action: string;
};

const simulatorDecision = (input: ModelDecisionInput): ModelDecision => {
  if (input.scenario === "replay") {
    return {
      source: "simulator",
      recommendation: "Quarantine the duplicate maneuver packet and request a fresh signed sequence.",
      confidence: 94,
      evidence: ["Sequence 1042 was observed twice", "Timestamp drift exceeds the relay window", "Signature chain remains valid only for the first delivery"],
      action: "BLOCK_DUPLICATE",
    };
  }

  if (input.scenario === "spoof") {
    return {
      source: "simulator",
      recommendation: "Downgrade the spoofed distress packet and verify against trusted relay telemetry.",
      confidence: 91,
      evidence: ["Sender key is outside the mission allowlist", "Packet priority conflicts with the mission phase", "Relay confidence is below 0.62"],
      action: "VERIFY_SENDER",
    };
  }

  if (input.scenario === "flood") {
    return {
      source: "simulator",
      recommendation: "Reserve the protected queue for crew safety and throttle noncritical science traffic.",
      confidence: 88,
      evidence: ["Queue depth is above nominal threshold", "Life-support telemetry has a protected route", "Bulk packets share a single source corridor"],
      action: "PROTECT_CRITICAL_QUEUE",
    };
  }

  if (input.scenario === "delay") {
    return {
      source: "simulator",
      recommendation: "Enable autonomous acknowledgement policy and defer noncritical uplink retries.",
      confidence: 86,
      evidence: ["One-way latency is elevated", "No command integrity failures detected", "Autonomous policy is available for the active mission phase"],
      action: "ENABLE_AUTONOMY",
    };
  }

  return {
    source: "simulator",
    recommendation: "Maintain signed delivery checks and hold the protected command queue at nominal allocation.",
    confidence: 97,
    evidence: ["All active packets match their sender identity", "Relay latency is inside the nominal envelope", "No safety policy conflicts detected"],
    action: "CONTINUE_MONITORING",
  };
};

/**
 * Hookup point for the model trained during the hackathon.
 * Set VITE_MARSLINK_MODEL_ENDPOINT to a CORS-enabled HTTPS endpoint that accepts
 * ModelDecisionInput and returns the ModelDecision shape described in docs/MODEL_INTEGRATION.md.
 */
export async function requestModelDecision(input: ModelDecisionInput): Promise<ModelDecision> {
  const endpoint = import.meta.env.VITE_MARSLINK_MODEL_ENDPOINT?.trim();

  if (!endpoint) {
    return simulatorDecision(input);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Model endpoint returned ${response.status}`);
  }

  const output = (await response.json()) as Partial<ModelDecision>;

  if (!output.recommendation || !output.action || !Array.isArray(output.evidence)) {
    throw new Error("Model response does not match the MarsLink decision contract");
  }

  return {
    source: "model",
    recommendation: output.recommendation,
    confidence: Math.max(0, Math.min(100, Number(output.confidence ?? 0))),
    evidence: output.evidence.slice(0, 3),
    action: output.action,
  };
}
