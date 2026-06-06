import type { StandardEnvelope } from "@/lib/api/public-api";

export type TopUpUiResult = {
  variant: "granted" | "manual_review" | "rejected" | "duplicate" | "generic";
  title: string;
  description: string;
};

function collectText(envelope: StandardEnvelope<unknown>): string {
  const parts: string[] = [];
  if (envelope.message) parts.push(envelope.message);
  const d = envelope.data;
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    for (const k of ["status", "result", "reason", "detail", "message"]) {
      const v = o[k];
      if (typeof v === "string") parts.push(v);
      if (typeof v === "number") parts.push(String(v));
    }
  }
  return parts.join(" ").toLowerCase();
}

/**
 * Maps API envelope to UI copy for simulate top-up.
 * Adjust keyword matching if backend uses specific numeric codes.
 */
export function interpretTopUpResponse(
  envelope: StandardEnvelope<unknown>,
): TopUpUiResult {
  const code = envelope.code;
  const text = collectText(envelope);
  const msg = envelope.message ?? "";

  if (code === 0) {
    return {
      variant: "granted",
      title: "Reward granted",
      description:
        msg || "Your simulated top-up met the threshold. Reward has been granted.",
    };
  }

  if (text.includes("duplicate") || text.includes("already")) {
    return {
      variant: "duplicate",
      title: "Duplicate reward",
      description:
        msg || "This reward was already claimed or duplicated for this user.",
    };
  }

  if (
    text.includes("manual") ||
    text.includes("review") ||
    text.includes("pending")
  ) {
    return {
      variant: "manual_review",
      title: "Manual review",
      description:
        msg ||
        "Your transaction is pending manual review before a reward can be issued.",
    };
  }

  if (text.includes("reject") || text.includes("denied") || text.includes("ineligible")) {
    return {
      variant: "rejected",
      title: "Rejected",
      description: msg || "This top-up did not qualify for a reward.",
    };
  }

  return {
    variant: "generic",
    title: "Top-up result",
    description: msg || (code != null ? `Code: ${code}` : "Unexpected response."),
  };
}
