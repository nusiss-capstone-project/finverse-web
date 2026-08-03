"use client";

import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

export function AuthHeader() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <header className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-sm text-white shadow-2xl backdrop-blur">
        <span className="px-3 py-1.5 text-zinc-500">…</span>
      </header>
    );
  }

  return (
    <header className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-sm text-white shadow-2xl backdrop-blur">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-full bg-emerald-500 px-3 py-1.5 font-medium text-slate-950 transition hover:bg-emerald-400"
            >
              Sign up
            </button>
          </SignUpButton>
        </>
      )}
    </header>
  );
}
