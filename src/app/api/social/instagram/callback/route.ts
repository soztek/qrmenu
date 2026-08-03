import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeCodeForAccount } from "@/lib/social/instagram";
import { encryptToken } from "@/lib/social/crypto";
import { appUrl } from "@/lib/url";

export const runtime = "nodejs";

/** Instagram OAuth dönüşü — token alır, hesabı işletmeye bağlar. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (q: string) =>
    NextResponse.redirect(new URL(`/dashboard/sosyal/baglanti?${q}`, appUrl()));

  const user = await getCurrentUser();
  if (!user?.business) {
    return NextResponse.redirect(new URL("/giris", appUrl()));
  }

  // Kullanıcı izni reddettiyse
  if (url.searchParams.get("error")) {
    return back("error=denied");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const saved = cookieStore.get("ig_oauth_state")?.value;
  cookieStore.delete("ig_oauth_state");

  if (!code || !state || !saved || state !== saved) {
    return back("error=state");
  }

  try {
    const acc = await exchangeCodeForAccount(code);
    const enc = encryptToken(acc.accessToken);

    await prisma.socialAccount.upsert({
      where: {
        businessId_platform: {
          businessId: user.business.id,
          platform: "instagram",
        },
      },
      update: {
        providerUserId: acc.providerUserId,
        username: acc.username ?? null,
        displayName: acc.displayName ?? null,
        profilePictureUrl: acc.profilePictureUrl ?? null,
        pageId: acc.pageId ?? null,
        accessTokenEnc: enc,
        tokenExpiresAt: acc.expiresAt,
        status: "active",
      },
      create: {
        businessId: user.business.id,
        platform: "instagram",
        providerUserId: acc.providerUserId,
        username: acc.username ?? null,
        displayName: acc.displayName ?? null,
        profilePictureUrl: acc.profilePictureUrl ?? null,
        pageId: acc.pageId ?? null,
        accessTokenEnc: enc,
        tokenExpiresAt: acc.expiresAt,
        status: "active",
      },
    });

    return back("connected=1");
  } catch (err) {
    console.error("Instagram bağlantı hatası:", err);
    const msg = err instanceof Error ? err.message : "connect";
    return back(`error=connect&detail=${encodeURIComponent(msg.slice(0, 120))}`);
  }
}
