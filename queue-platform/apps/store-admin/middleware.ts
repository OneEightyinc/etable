import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * /a/:opaqueToken → 内部は ?storeId= + __pt=（店舗IDはURLに出さない）
 * /a/:token/history などサブパスも同様
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/a/")) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2 || segments[0] !== "a") {
    return NextResponse.next();
  }

  const token = segments[1];
  if (!token || token.length < 32) {
    return NextResponse.next();
  }

  const rest = segments.slice(2);
  const destPath = rest.length === 0 ? "/" : `/${rest.join("/")}`;

  const origin = request.nextUrl.origin;
  let storeId: string;
  try {
    const res = await fetch(
      `${origin}/api/resolve-public-token?kind=storeAdmin&token=${encodeURIComponent(token)}`,
      { headers: { "x-from-middleware": "1" } }
    );
    if (!res.ok) {
      return NextResponse.redirect(new URL("/?error=invalid_entry", request.url));
    }
    const data = (await res.json()) as { storeId?: string };
    if (!data.storeId) {
      return NextResponse.redirect(new URL("/?error=invalid_entry", request.url));
    }
    storeId = data.storeId;
  } catch {
    return NextResponse.redirect(new URL("/?error=invalid_entry", request.url));
  }

  const url = request.nextUrl.clone();
  url.pathname = destPath;
  const q = new URLSearchParams(request.nextUrl.searchParams);
  q.set("storeId", storeId);
  q.set("__pt", token);
  url.search = q.toString();
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/a/:path*"],
};
