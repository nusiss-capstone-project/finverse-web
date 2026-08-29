"use client";

import type { RefObject } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  User,
  X,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/lib/web/user-app-api";

type ProfileIdentitySectionProps = Readonly<{
  profile: UserProfile;
  displayName: string;
  avatarUrl: string | null;
  avatarError: string | null;
  editingName: boolean;
  nameDraft: string;
  savingName: boolean;
  kycStarting: boolean;
  kycError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPickAvatarClick: () => void;
  onAvatarFile: (file: File | undefined) => void;
  onClearAvatar: () => void;
  onNameDraftChange: (value: string) => void;
  onBeginEditName: () => void;
  onCancelEditName: () => void;
  onSaveName: () => void;
  onStartKyc: () => void;
}>;

export function ProfileIdentitySection(props: ProfileIdentitySectionProps) {
  const { profile } = props;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <ProfileAvatar
            avatarUrl={props.avatarUrl}
            fileInputRef={props.fileInputRef}
            onPickAvatarClick={props.onPickAvatarClick}
            onAvatarFile={props.onAvatarFile}
            onClearAvatar={props.onClearAvatar}
          />
          <div className="min-w-0 flex-1">
            <ProfileDisplayName
              displayName={props.displayName}
              username={profile.username}
              editingName={props.editingName}
              nameDraft={props.nameDraft}
              savingName={props.savingName}
              onNameDraftChange={props.onNameDraftChange}
              onBeginEditName={props.onBeginEditName}
              onCancelEditName={props.onCancelEditName}
              onSaveName={props.onSaveName}
            />
            <p className="mt-3 text-xl text-slate-400">{profile.email || "—"}</p>
            <ProfileKycStatusLine checked={profile.kycChecked} />
            {props.avatarError ? (
              <p className="mt-2 text-sm text-red-300" role="alert">
                {props.avatarError}
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
        <ProfileKycCta
          kycStarting={props.kycStarting}
          kycError={props.kycError}
          onStartKyc={props.onStartKyc}
        />
      ) : null}
    </div>
  );
}

function ProfileAvatar({
  avatarUrl,
  fileInputRef,
  onPickAvatarClick,
  onAvatarFile,
  onClearAvatar,
}: Readonly<{
  avatarUrl: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPickAvatarClick: () => void;
  onAvatarFile: (file: File | undefined) => void;
  onClearAvatar: () => void;
}>) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onPickAvatarClick}
        className="group relative flex size-28 items-center justify-center overflow-hidden rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20 transition hover:ring-emerald-400/40"
        aria-label="Change avatar"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
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
        onChange={(e) => onAvatarFile(e.target.files?.[0] ?? undefined)}
      />
      {avatarUrl ? (
        <button
          type="button"
          onClick={onClearAvatar}
          className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full border border-white/15 bg-slate-900 text-slate-300 shadow hover:text-white"
          aria-label="Remove avatar"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function ProfileDisplayName({
  displayName,
  username,
  editingName,
  nameDraft,
  savingName,
  onNameDraftChange,
  onBeginEditName,
  onCancelEditName,
  onSaveName,
}: Readonly<{
  displayName: string;
  username: string;
  editingName: boolean;
  nameDraft: string;
  savingName: boolean;
  onNameDraftChange: (value: string) => void;
  onBeginEditName: () => void;
  onCancelEditName: () => void;
  onSaveName: () => void;
}>) {
  if (editingName) {
    return (
      <div className="flex max-w-md flex-wrap items-center gap-2">
        <Input
          value={nameDraft}
          onChange={(e) => onNameDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveName();
            if (e.key === "Escape") onCancelEditName();
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
          onClick={onSaveName}
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
          onClick={onCancelEditName}
          className="size-10 rounded-full text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Cancel"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h2 className="truncate text-3xl font-semibold tracking-tight text-white">
        {displayName || username || "—"}
      </h2>
      <button
        type="button"
        onClick={onBeginEditName}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-emerald-400"
        aria-label="Edit nickname"
      >
        <Pencil className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function ProfileKycStatusLine({ checked }: Readonly<{ checked: boolean }>) {
  return (
    <p
      className={
        checked
          ? "mt-3 inline-flex items-center gap-2 text-base font-medium text-emerald-400"
          : "mt-3 inline-flex items-center gap-2 text-base font-medium text-amber-300"
      }
    >
      {checked ? (
        <CheckCircle2 className="size-5" aria-hidden />
      ) : (
        <XCircle className="size-5" aria-hidden />
      )}
      {checked ? "Verified" : "KYC Pending"}
    </p>
  );
}

function ProfileKycCta({
  kycStarting,
  kycError,
  onStartKyc,
}: Readonly<{
  kycStarting: boolean;
  kycError: string | null;
  onStartKyc: () => void;
}>) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">
            Complete KYC with Singpass
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Verify your identity to unlock campaign rewards and account features.
          </p>
        </div>
        <Button
          type="button"
          disabled={kycStarting}
          onClick={onStartKyc}
          className="h-11 shrink-0 rounded-full bg-emerald-500 px-5 text-slate-950 hover:bg-emerald-400"
        >
          {kycStarting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
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
  );
}
