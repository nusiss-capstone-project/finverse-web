import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/wallet" ||
    pathname.startsWith("/wallet/") ||
    pathname === "/campaigns" ||
    pathname.startsWith("/campaigns/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/")
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", req.url);
  signInUrl.searchParams.set("redirect_url", req.url);

  await auth.protect({
    unauthenticatedUrl: signInUrl.toString(),
  });

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Keep Clerk context on app routes; skip static assets.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
