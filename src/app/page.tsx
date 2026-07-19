"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Client redirect avoids soft-nav RSC races with server `redirect()` on `/`. */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/wallet");
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#030712] text-sm text-slate-400">
      Loading…
    </div>
  );
}
