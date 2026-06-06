type GlobalWithProcess = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

function readNodeEnv(): string | undefined {
  if (typeof globalThis === "undefined") return undefined;
  return (globalThis as GlobalWithProcess).process?.env?.NODE_ENV;
}

/** `next dev` / preview; false for `next start` in production. */
export function isNonProductionRuntime(): boolean {
  return readNodeEnv() !== "production";
}
