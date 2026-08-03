import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getAuthUrl } from "@/lib/social/instagram";
import { isInstagramConfigured } from "@/lib/social/config";
import { appUrl } from "@/lib/url";

export const runtime = "nodejs";

/** Instagram OAuth başlangıcı — kullanıcıyı Meta giriş diyaloguna yönlendirir. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.business) {
    return NextResponse.redirect(new URL("/giris", appUrl()));
  }
  if (!isInstagramConfigured()) {
    return NextResponse.redirect(
      new URL("/dashboard/sosyal/baglanti?error=notconfigured", appUrl()),
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 dk
  });

  return NextResponse.redirect(getAuthUrl(state));
}
