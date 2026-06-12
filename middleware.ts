import { NextRequest, NextResponse } from "next/server";
import { verifyToken, REBUILD_COOKIE } from "@/lib/rebuild-auth";

// Gates the MMC Rebuild section. Pages redirect to the password screen;
// API routes get a 401. Login page and auth endpoint stay open.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/rebuild/login" || pathname === "/api/rebuild/auth") {
    return NextResponse.next();
  }
  const ok = await verifyToken(req.cookies.get(REBUILD_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Locked. Enter the password at /rebuild/login." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/rebuild/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/rebuild/:path*", "/api/rebuild/:path*"],
};
