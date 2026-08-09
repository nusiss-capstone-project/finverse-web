import { isLanguageCode } from "@/lib/web/profile-enums";
import { fetchUserProfile } from "@/lib/web/user-app-api";

const STORAGE_KEY = "finverse.user-profile.language";
export const DEFAULT_PROFILE_LANG = "en";

let memoryLang: string | null = null;
let inflight: Promise<string> | null = null;

function readStorageLang(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
    return value && isLanguageCode(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStorageLang(lang: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore quota / private mode failures.
  }
}

/** Persist profile language for reuse (e.g. after profile load/update). */
export function setCachedProfileLang(language: string | null | undefined) {
  const trimmed = language?.trim() ?? "";
  const lang =
    trimmed && isLanguageCode(trimmed) ? trimmed : DEFAULT_PROFILE_LANG;
  memoryLang = lang;
  writeStorageLang(lang);
}

/**
 * Resolve UI/API language from local cache, fetching user-profile once if needed.
 * Defaults to `en` when unset or unavailable.
 */
export async function resolveProfileLang(): Promise<string> {
  if (memoryLang) return memoryLang;

  const stored = readStorageLang();
  if (stored) {
    memoryLang = stored;
    return stored;
  }

  if (!inflight) {
    inflight = (async () => {
      try {
        const profile = await fetchUserProfile();
        const language = profile.language?.trim() ?? "";
        const lang =
          language && isLanguageCode(language)
            ? language
            : DEFAULT_PROFILE_LANG;
        setCachedProfileLang(lang);
        return lang;
      } catch {
        setCachedProfileLang(DEFAULT_PROFILE_LANG);
        return DEFAULT_PROFILE_LANG;
      } finally {
        inflight = null;
      }
    })();
  }

  return inflight;
}
