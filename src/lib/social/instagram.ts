import "server-only";
import { metaConfig, isInstagramConfigured } from "./config";

/**
 * InstagramService — Meta Graph API (resmi yöntem).
 * OAuth ile hesap bağlama + Instagram Business hesabına foto gönderisi yayınlama.
 * Not: Gerçek yayın için Meta App Review (instagram_content_publish) ve IG
 * Business/Creator hesabının bir Facebook Sayfasına bağlı olması gerekir.
 */

export class InstagramError extends Error {}

const SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
];

/** OAuth diyalog URL'i (kullanıcıyı Facebook girişine yönlendirir). */
export function getAuthUrl(state: string): string {
  if (!isInstagramConfigured()) {
    throw new InstagramError("Instagram bağlantısı henüz yapılandırılmamış.");
  }
  const { appId, redirectUri, graphVersion } = metaConfig();
  const p = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: SCOPES.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${graphVersion}/dialog/oauth?${p.toString()}`;
}

export interface ConnectedAccount {
  providerUserId: string; // IG business account id
  username?: string;
  displayName?: string;
  profilePictureUrl?: string;
  pageId?: string;
  accessToken: string; // yayın için kullanılacak (page) token
  expiresAt: Date | null;
}

/** OAuth code → uzun ömürlü token + bağlı IG Business hesabı bilgisi. */
export async function exchangeCodeForAccount(
  code: string,
): Promise<ConnectedAccount> {
  const { appId, appSecret, redirectUri, graphVersion } = metaConfig();
  const base = `https://graph.facebook.com/${graphVersion}`;

  // 1) code → kısa ömürlü kullanıcı token'ı
  const t1 = await getJson(
    `${base}/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
  );

  // 2) kısa ömürlü → uzun ömürlü (≈60 gün)
  const t2 = await getJson(
    `${base}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: String(t1.access_token ?? ""),
      }),
  );
  const longToken = String(t2.access_token ?? "");
  const expiresAt = t2.expires_in
    ? new Date(Date.now() + Number(t2.expires_in) * 1000)
    : null;

  // 3) sayfalar → bağlı IG Business hesabını bul
  const pages = await getJson(
    `${base}/me/accounts?` +
      new URLSearchParams({
        access_token: longToken,
        fields:
          "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}",
      }),
  );
  const list = (pages.data as PageNode[] | undefined) ?? [];
  const page = list.find((p) => p.instagram_business_account);
  if (!page || !page.instagram_business_account) {
    throw new InstagramError(
      "Bağlı bir Instagram Business hesabı bulunamadı. Instagram hesabınızın " +
        "Business/Creator olduğundan ve bir Facebook Sayfasına bağlı olduğundan emin olun.",
    );
  }
  const ig = page.instagram_business_account;
  return {
    providerUserId: ig.id,
    username: ig.username,
    displayName: ig.name,
    profilePictureUrl: ig.profile_picture_url,
    pageId: page.id,
    accessToken: page.access_token || longToken,
    expiresAt,
  };
}

/** Tek görselli Instagram gönderisi yayınlar → { id, permalink }. */
export async function publishPhoto(opts: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<{ id: string; permalink?: string }> {
  const { graphVersion } = metaConfig();
  const base = `https://graph.facebook.com/${graphVersion}`;

  // 1) medya konteyneri oluştur (image_url herkese açık https olmalı)
  const container = await getJson(`${base}/${opts.igUserId}/media`, {
    method: "POST",
    body: new URLSearchParams({
      image_url: opts.imageUrl,
      caption: opts.caption,
      access_token: opts.accessToken,
    }),
  });

  // 2) yayınla
  const pub = await getJson(`${base}/${opts.igUserId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({
      creation_id: String(container.id ?? ""),
      access_token: opts.accessToken,
    }),
  });

  // 3) permalink (opsiyonel)
  let permalink: string | undefined;
  try {
    const info = await getJson(
      `${base}/${pub.id}?` +
        new URLSearchParams({ fields: "permalink", access_token: opts.accessToken }),
    );
    permalink = info.permalink as string | undefined;
  } catch {
    /* permalink alınamadıysa yok say */
  }

  return { id: String(pub.id ?? ""), permalink };
}

interface PageNode {
  id: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
  };
}

async function getJson(
  url: string | URL,
  init?: RequestInit,
): Promise<Record<string, unknown>> {
  const res = await fetch(String(url), init);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const err = data.error as { message?: string } | undefined;
  if (!res.ok || err) {
    throw new InstagramError(err?.message || `Meta API hatası (${res.status})`);
  }
  return data;
}
