import {
  getIdentityApiBaseUrl,
  getPublicApiBaseUrl,
} from "@/lib/api/public-api";

type ClerkTokenGetter = () => Promise<string | null>;

let clerkTokenGetter: ClerkTokenGetter | null = null;
let clerkAuthInitialized = false;
let waiters: Array<() => void> = [];

function flushAuthWaiters() {
  const pendingWaiters = waiters;
  waiters = [];
  pendingWaiters.forEach((resolve) => resolve());
}

export function setClerkTokenGetter(getter: ClerkTokenGetter | null) {
  clerkTokenGetter = getter;
  clerkAuthInitialized = true;
  flushAuthWaiters();
}

export function resetClerkTokenGetter() {
  clerkTokenGetter = null;
  clerkAuthInitialized = false;
  flushAuthWaiters();
}

async function waitForClerkAuthInitialized(): Promise<void> {
  if (clerkAuthInitialized) return;
  await Promise.race([
    new Promise<void>((resolve) => {
      waiters.push(resolve);
    }),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1500);
    }),
  ]);
}

export async function getClerkAuthToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    await waitForClerkAuthInitialized();
  }
  return clerkTokenGetter ? clerkTokenGetter() : null;
}

export async function withClerkAuthorization(
  requestUrl: string | URL,
  headers: Headers,
): Promise<Headers> {
  if (!isTrustedApiUrl(requestUrl)) {
    headers.delete("Authorization");
    return headers;
  }
  if (!headers.has("Authorization")) {
    const token = await getClerkAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

export async function fetchWithClerkAuthorization(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  await withClerkAuthorization(input instanceof Request ? input.url : input, headers);
  return fetch(input, { ...init, headers });
}

export function isTrustedApiUrl(requestUrl: string | URL): boolean {
  const bases = [getPublicApiBaseUrl(), getIdentityApiBaseUrl()].filter(
    (base, index, all) => Boolean(base) && all.indexOf(base) === index,
  );
  if (bases.length === 0) return false;

  try {
    for (const configuredBase of bases) {
      const trusted = new URL(configuredBase);
      if (
        typeof window !== "undefined" &&
        isLoopbackHost(trusted.hostname) &&
        !isLoopbackHost(window.location.hostname)
      ) {
        continue;
      }

      let candidate: URL;
      if (typeof requestUrl === "string") {
        const baseHref =
          typeof window !== "undefined" ? window.location.href : trusted.href;
        candidate = new URL(requestUrl, baseHref);
      } else {
        candidate = requestUrl;
      }

      if (candidate.origin === trusted.origin) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}
