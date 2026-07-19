/** Public API origin (no trailing slash), e.g. `https://host` */
export function getPublicApiBaseUrl(): string {
  // 1) Browser: prefer value injected in root layout (server reads Vercel env at request time — works for
  //    Preview branches and env changes without a new client bundle build).
  // 2) Fallback: literal `process.env.NEXT_PUBLIC_*` so Next can still inline at build time when set there.
  if (typeof window !== "undefined") {
    const injected = window.__CAMPAIGN_CENTER_API_ORIGIN__;
    if (injected != null && injected !== "") {
      return injected.replace(/\/$/, "");
    }
  }
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}

/**
 * Identity service origin (no trailing slash).
 * Falls back to the campaign API origin when `NEXT_PUBLIC_IDENTITY_API_BASE_URL` is unset.
 */
export function getIdentityApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const injected = window.__IDENTITY_API_ORIGIN__;
    if (injected != null && injected !== "") {
      return injected.replace(/\/$/, "");
    }
  }
  const configured = (process.env.NEXT_PUBLIC_IDENTITY_API_BASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  return configured || getPublicApiBaseUrl();
}

/** Path must start with `/`, e.g. `/campaign-center-api/v1/web/campaigns` */
export function buildPublicApiUrl(path: string): string {
  const base = getPublicApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Path must start with `/`, e.g. `/identity-ms/v1/web/user-profile` */
export function buildIdentityApiUrl(path: string): string {
  const base = getIdentityApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export type StandardEnvelope<T = unknown> = {
  code?: number;
  message?: string;
  data?: T;
};
