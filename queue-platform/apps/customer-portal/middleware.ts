import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

async function resolveStoreId(origin: string, kind: "portal" | "survey", token: string): Promise<string | null> {
  const res = await fetch(
    `${origin}/api/resolve-public-token?kind=${kind}&token=${encodeURIComponent(token)}`,
    { headers: { "x-from-middleware": "1" } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { storeId?: string };
  return data.storeId ?? null;
}

/**
 * /p/:token → 店舗ページ相当（/restaurant/:storeId）
 * /p/:token/reserve 等
 * /q/:token → アンケート（/survey/:storeId）
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.nextUrl.origin;

  if (pathname.startsWith("/q/")) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 2 || segments[0] !== "q") return NextResponse.next();
    const token = segments[1];
    if (!token || token.length < 32) return NextResponse.next();
    const storeId = await resolveStoreId(origin, "survey", token);
    if (!storeId) {
      return NextResponse.redirect(new URL("/?error=invalid_survey_link", request.url));
    }
    const url = request.nextUrl.clone();
    url.pathname = `/survey/${encodeURIComponent(storeId)}`;
    const q = new URLSearchParams(request.nextUrl.searchParams);
    q.set("__qt", token);
    url.search = q.toString();
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/p/")) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 2 || segments[0] !== "p") return NextResponse.next();
    const token = segments[1];
    if (!token || token.length < 32) return NextResponse.next();
    const storeId = await resolveStoreId(origin, "portal", token);
    if (!storeId) {
      return NextResponse.redirect(new URL("/?error=invalid_portal_link", request.url));
    }
    const rest = segments.slice(2);
    const sub = rest.length ? `/${rest.join("/")}` : "";
    const url = request.nextUrl.clone();
    url.pathname = `/restaurant/${encodeURIComponent(storeId)}${sub}`;
    const q = new URLSearchParams(request.nextUrl.searchParams);
    q.set("__ppt", token);
    url.search = q.toString();
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/p/:path*", "/q/:path*"],
};
