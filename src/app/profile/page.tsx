"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe,
  Loader2,
  MapPin,
  Pencil,
  Shield,
  User,
  X,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfilePaymentMethodSection } from "@/components/user/profile-payment-method";
import {
  UserShell,
  useLangFromQuery,
  useDemoUserId,
} from "@/components/user/user-shell";
import {
  LANGUAGE_OPTIONS,
  MARKET_OPTIONS,
  isLanguageCode,
  isMarketCode,
  optionLabel,
} from "@/lib/web/profile-enums";
import {
  apiErrorMessage,
  fetchSingpassKycAuthorizeUrl,
  fetchUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/lib/web/user-app-api";

const AVATAR_STORAGE_KEY = "finverse.profile.avatar";
const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(key)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function marketDisplayValue(
  selectedMarket: string,
  profileMarket: string | undefined,
): string {
  if (selectedMarket) return optionLabel(MARKET_OPTIONS, selectedMarket);
  if (profileMarket) return profileMarket;
  return "Select market";
}

export default function ProfilePage() {
  const userId = useDemoUserId();
  const lang = useLangFromQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kycStarting, setKycStarting] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const [language, setLanguage] = useState("");
  const [market, setMarket] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [savingMarket, setSavingMarket] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const marketLocked = Boolean(profile?.market?.trim());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchUserProfile();
      setProfile(next);
      setDisplayName(next.username);
      setLanguage(isLanguageCode(next.language) ? next.language : "");
      setMarket(isMarketCode(next.market) ? next.market : "");
    } catch (e) {
      setProfile(null);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const storedAvatar = readStorage(AVATAR_STORAGE_KEY);
    if (storedAvatar) setAvatarUrl(storedAvatar);
  }, []);

  const startSingpassKyc = useCallback(async () => {
    setKycStarting(true);
    setKycError(null);
    try {
      const authorizeUrl = await fetchSingpassKycAuthorizeUrl();
      window.location.assign(authorizeUrl);
    } catch (e) {
      setKycError(apiErrorMessage(e));
      setKycStarting(false);
    }
  }, []);

  const onLanguageChange = async (value: string) => {
    if (!isLanguageCode(value) || savingLanguage) return;
    const previous = language;
    setLanguage(value);
    setSavingLanguage(true);
    setSettingsError(null);
    try {
      await updateUserProfile({ language: value });
      setProfile((prev) => (prev ? { ...prev, language: value } : prev));
    } catch (e) {
      setLanguage(previous);
      setSettingsError(apiErrorMessage(e));
    } finally {
      setSavingLanguage(false);
    }
  };

  const onMarketChange = async (value: string) => {
    if (!isMarketCode(value) || savingMarket || marketLocked) return;
    const previous = market;
    setMarket(value);
    setSavingMarket(true);
    setSettingsError(null);
    try {
      await updateUserProfile({ market: value });
      setProfile((prev) => (prev ? { ...prev, market: value } : prev));
    } catch (e) {
      setMarket(previous);
      setSettingsError(apiErrorMessage(e));
    } finally {
      setSavingMarket(false);
    }
  };

  const beginEditName = () => {
    setNameDraft(displayName || profile?.username || "");
    setEditingName(true);
    setSettingsError(null);
  };

  const cancelEditName = () => {
    setEditingName(false);
    setNameDraft("");
  };

  const saveName = async () => {
    const next = nameDraft.trim();
    if (!next || savingName) return;
    setSavingName(true);
    setSettingsError(null);
    try {
      await updateUserProfile({ username: next });
      setDisplayName(next);
      setProfile((prev) => (prev ? { ...prev, username: next } : prev));
      setEditingName(false);
    } catch (e) {
      setSettingsError(apiErrorMessage(e));
    } finally {
      setSavingName(false);
    }
  };

  const onAvatarPicked = (file: File | undefined) => {
    setAvatarError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;
      setAvatarUrl(dataUrl);
      writeStorage(AVATAR_STORAGE_KEY, dataUrl);
    };
    reader.onerror = () => setAvatarError("Could not read that image.");
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarUrl(null);
    removeStorage(AVATAR_STORAGE_KEY);
    setAvatarError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <UserShell userId={userId} lang={lang}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Profile
          </h1>
          <p className="mt-2 text-lg text-slate-400">Manage your account.</p>
        </div>

        {error ? (
          <p
            className="rounded-2xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {settingsError ? (
          <p
            className="rounded-2xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {settingsError}
          </p>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-emerald-950/10 sm:p-8">
          {loading ? (
            <p className="text-sm text-slate-500">Loading profile…</p>
          ) : profile ? (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative flex size-28 items-center justify-center overflow-hidden rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20 transition hover:ring-emerald-400/40"
                      aria-label="Change avatar"
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <User className="size-14" aria-hidden />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                        <Camera className="size-6 text-white" aria-hidden />
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) =>
                        onAvatarPicked(e.target.files?.[0] ?? undefined)
                      }
                    />
                    {avatarUrl ? (
                      <button
                        type="button"
                        onClick={clearAvatar}
                        className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full border border-white/15 bg-slate-900 text-slate-300 shadow hover:text-white"
                        aria-label="Remove avatar"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    {editingName ? (
                      <div className="flex max-w-md flex-wrap items-center gap-2">
                        <Input
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveName();
                            if (e.key === "Escape") cancelEditName();
                          }}
                          disabled={savingName}
                          autoFocus
                          className="h-11 rounded-2xl border-white/10 bg-slate-900/80 px-4 text-xl font-semibold text-white md:text-xl"
                          aria-label="Display name"
                        />
                        <Button
                          type="button"
                          size="icon"
                          disabled={savingName}
                          onClick={() => void saveName()}
                          className="size-10 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          aria-label="Save name"
                        >
                          {savingName ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                          ) : (
                            <Check className="size-4" aria-hidden />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={savingName}
                          onClick={cancelEditName}
                          className="size-10 rounded-full text-slate-400 hover:bg-white/5 hover:text-white"
                          aria-label="Cancel"
                        >
                          <X className="size-4" aria-hidden />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-3xl font-semibold tracking-tight text-white">
                          {displayName || profile.username || "—"}
                        </h2>
                        <button
                          type="button"
                          onClick={beginEditName}
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-emerald-400"
                          aria-label="Edit nickname"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                      </div>
                    )}
                    <p className="mt-3 text-xl text-slate-400">
                      {profile.email || "—"}
                    </p>
                    <p
                      className={
                        profile.kycChecked
                          ? "mt-3 inline-flex items-center gap-2 text-base font-medium text-emerald-400"
                          : "mt-3 inline-flex items-center gap-2 text-base font-medium text-amber-300"
                      }
                    >
                      {profile.kycChecked ? (
                        <CheckCircle2 className="size-5" aria-hidden />
                      ) : (
                        <XCircle className="size-5" aria-hidden />
                      )}
                      {profile.kycChecked ? "Verified" : "KYC Pending"}
                    </p>
                    {avatarError ? (
                      <p className="mt-2 text-sm text-red-300" role="alert">
                        {avatarError}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Badge
                  className={
                    profile.kycChecked
                      ? "w-fit rounded-full border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-emerald-300"
                      : "w-fit rounded-full border-amber-500/20 bg-amber-500/10 px-4 py-2 text-amber-300"
                  }
                >
                  {profile.kycChecked ? "KYC Verified" : "KYC Pending"}
                </Badge>
              </div>

              {!profile.kycChecked ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        Complete KYC with Singpass
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Verify your identity to unlock campaign rewards and
                        account features.
                      </p>
                    </div>
                    <Button
                      type="button"
                      disabled={kycStarting}
                      onClick={() => void startSingpassKyc()}
                      className="h-11 shrink-0 rounded-full bg-emerald-500 px-5 text-slate-950 hover:bg-emerald-400"
                    >
                      {kycStarting ? (
                        <>
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden
                          />
                          Redirecting…
                        </>
                      ) : (
                        "Verify with Singpass"
                      )}
                    </Button>
                  </div>
                  {kycError ? (
                    <p className="mt-3 text-sm text-red-300" role="alert">
                      {kycError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No profile data.</p>
          )}
        </section>

        <ProfilePaymentMethodSection />

        <section className="grid gap-4 lg:grid-cols-2">
          <ProfileSelectSetting
            icon={<Globe className="size-7" aria-hidden />}
            title="Language"
            value={language}
            displayValue={
              language
                ? optionLabel(LANGUAGE_OPTIONS, language)
                : "Select language"
            }
            placeholder="Select language"
            disabled={savingLanguage || loading || !profile}
            onValueChange={(value) => void onLanguageChange(value)}
            options={LANGUAGE_OPTIONS}
          />
          <ProfileSelectSetting
            icon={<MapPin className="size-7" aria-hidden />}
            title="Market"
            value={market}
            displayValue={marketDisplayValue(market, profile?.market)}
            placeholder="Select market"
            disabled={
              savingMarket || loading || !profile || marketLocked
            }
            locked={marketLocked}
            onValueChange={(value) => void onMarketChange(value)}
            options={MARKET_OPTIONS}
          />
          <ProfileAction
            icon={<Shield className="size-7" aria-hidden />}
            title="Security Settings"
          />
          <ProfileAction
            icon={<Bell className="size-7" aria-hidden />}
            title="Notifications"
            badge="3"
          />
        </section>
      </div>
    </UserShell>
  );
}

function ProfileSelectSetting({
  icon,
  title,
  value,
  displayValue,
  placeholder,
  disabled,
  locked,
  onValueChange,
  options,
}: Readonly<{
  icon: ReactNode;
  title: string;
  value: string;
  displayValue: string;
  placeholder?: string;
  disabled?: boolean;
  locked?: boolean;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}>) {
  return (
    <div className="flex w-full items-center gap-5 rounded-[2rem] border border-white/10 bg-slate-950/50 p-6">
      <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-slate-900 text-slate-400 ring-1 ring-white/10">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold text-white">{title}</p>
        <p className="mt-1 truncate text-sm text-slate-500">
          {displayValue}
          {locked ? " · Locked" : ""}
        </p>
      </div>
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label={title}
          className="h-10 w-[10.5rem] shrink-0 rounded-2xl border-white/10 bg-slate-900/80 px-3 text-sm text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-900/80 dark:hover:bg-slate-900"
        >
          <SelectValue placeholder={placeholder ?? "Select"} />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-white/10 bg-slate-950 text-slate-100">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ProfileAction({
  icon,
  title,
  badge,
}: {
  icon: ReactNode;
  title: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-5 rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 text-left transition hover:border-white/15 hover:bg-white/[0.03]"
      onClick={(e) => e.preventDefault()}
    >
      <span className="flex size-16 items-center justify-center rounded-3xl bg-slate-900 text-slate-400 ring-1 ring-white/10 group-hover:text-emerald-400">
        {icon}
      </span>
      <p className="min-w-0 flex-1 text-xl font-semibold text-white">{title}</p>
      {badge ? (
        <span className="flex size-8 items-center justify-center rounded-full bg-red-500 text-sm font-semibold text-white">
          {badge}
        </span>
      ) : null}
      <ChevronRight className="size-6 text-slate-500" aria-hidden />
    </button>
  );
}
