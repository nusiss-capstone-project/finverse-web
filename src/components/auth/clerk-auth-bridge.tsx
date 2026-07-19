"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { OpenAPI } from "@/lib/api/core/OpenAPI";
import { getCampaignCenterApiV1Base } from "@/lib/api/openapi-base-url";
import { getPublicApiBaseUrl } from "@/lib/api/public-api";
import {
  isTrustedApiUrl,
  resetClerkTokenGetter,
  setClerkTokenGetter,
} from "@/lib/auth/clerk-token";

export function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      resetClerkTokenGetter();
      OpenAPI.TOKEN = undefined;
      setReady(false);
      return;
    }

    OpenAPI.BASE = getCampaignCenterApiV1Base();
    const apiBaseConfigured = getPublicApiBaseUrl() !== "";

    if (!isSignedIn) {
      setClerkTokenGetter(null);
      OpenAPI.TOKEN = undefined;
      setReady(true);
      return;
    }

    const getter = async () => (await getToken()) ?? "";
    const openApiTokenGetter = async () => {
      if (!isTrustedApiUrl(OpenAPI.BASE)) return "";
      return getter();
    };
    setClerkTokenGetter(getter);
    OpenAPI.TOKEN = apiBaseConfigured ? openApiTokenGetter : undefined;
    setReady(true);
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    return () => {
      setClerkTokenGetter(null);
      OpenAPI.TOKEN = undefined;
    };
  }, []);

  if (!isLoaded || !ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#030712] text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
