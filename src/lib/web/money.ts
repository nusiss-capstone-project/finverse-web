import Decimal from "decimal.js";

export function multiplyAmount(qty: string, price: string): string {
  const q = qty.trim();
  const p = price.trim();
  if (!q || !p) return "0";
  try {
    return new Decimal(q).times(p).toFixed(2);
  } catch {
    return "0";
  }
}

export function isPositiveDecimal(s: string): boolean {
  try {
    const d = new Decimal(s.trim());
    return d.gt(0);
  } catch {
    return false;
  }
}

export function isValidDecimalInput(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed || trimmed === ".") return false;
  let seenDot = false;
  for (const ch of trimmed) {
    if (ch === ".") {
      if (seenDot) return false;
      seenDot = true;
      continue;
    }
    if (ch < "0" || ch > "9") return false;
  }
  return true;
}

export function sumDecimalAmounts(amounts: string[]): string {
  try {
    return amounts
      .reduce((acc, raw) => acc.plus(new Decimal(raw.trim() || "0")), new Decimal(0))
      .toFixed(2);
  } catch {
    return "0.00";
  }
}
