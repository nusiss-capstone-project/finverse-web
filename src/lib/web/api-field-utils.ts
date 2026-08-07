/** Shared defensive field pickers for loosely-typed API payloads. */

export function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

export function pickStr(
  o: Record<string, unknown> | null,
  keys: string[],
): string {
  if (!o) return "";
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

export function pickNum(
  o: Record<string, unknown> | null,
  keys: string[],
): number {
  if (!o) return 0;
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

export function pickNullableNum(
  o: Record<string, unknown> | null,
  keys: string[],
): number | null {
  if (!o) return null;
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function pickBool(
  o: Record<string, unknown> | null,
  keys: string[],
): boolean {
  if (!o) return false;
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "boolean") return v;
    if (typeof v === "number" && Number.isFinite(v)) return v !== 0;
    if (typeof v === "string" && v.trim()) {
      const normalized = v.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") return true;
      if (normalized === "false" || normalized === "0") return false;
    }
  }
  return false;
}
