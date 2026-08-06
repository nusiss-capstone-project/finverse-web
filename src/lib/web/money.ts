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

/** Sum amounts grouped by currency code (case-insensitive). */
export function sumAmountsByCurrency(
  entries: ReadonlyArray<{ amount: string; currency: string }>,
): Array<{ currency: string; amount: string }> {
  const map = new Map();
  for (const entry of entries) {
    const currency = entry.currency.trim().toUpperCase() || "USD";
    const prev = map.get(currency) ?? new Decimal(0);
    try {
      map.set(currency, prev.plus(new Decimal(entry.amount.trim() || "0")));
    } catch {
      map.set(currency, prev);
    }
  }
  return Array.from(map.entries())
    .map(([currency, amount]) => ({
      currency: String(currency),
      amount: amount.toFixed(2),
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}
