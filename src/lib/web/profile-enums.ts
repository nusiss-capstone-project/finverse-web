/** Aligned with identity-ms `data.Language` / `data.Market` enums. */

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "es", label: "Español" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "ar", label: "العربية" },
  { value: "tr", label: "Türkçe" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "th", label: "ไทย" },
] as const;

export const MARKET_OPTIONS = [
  { value: "GLOBAL", label: "Global" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "US", label: "United States" },
  { value: "EEA", label: "EEA" },
  { value: "UK", label: "United Kingdom" },
  { value: "UAE", label: "UAE" },
  { value: "AU", label: "Australia" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "TR", label: "Turkey" },
  { value: "BR", label: "Brazil" },
  { value: "LATAM", label: "Latin America" },
  { value: "SEA", label: "Southeast Asia" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["value"];
export type MarketCode = (typeof MARKET_OPTIONS)[number]["value"];

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGE_OPTIONS.some((o) => o.value === value);
}

export function isMarketCode(value: string): value is MarketCode {
  return MARKET_OPTIONS.some((o) => o.value === value);
}

export function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
