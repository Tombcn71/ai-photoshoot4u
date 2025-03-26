import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If no token and trying to access protected routes
  if (
    !token &&
    (req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/api/business"))
  ) {
    const redirectUrl = new URL("/auth/signin", req.url);
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing business routes, check if user is a business admin
  // This would need to be implemented with your Supabase logic
  // For now, we'll just let the server-side checks handle this

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/business/:path*"],
};
