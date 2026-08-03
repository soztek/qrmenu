import "server-only";

/**
 * Sosyal Medya Asistanı — ortam yapılandırması.
 * Gizli anahtarlar (Meta secret, OpenAI key, token şifreleme anahtarı) yalnızca
 * sunucuda okunur; hiçbiri frontend'e gönderilmez.
 */

/** Meta (Instagram/Facebook) OAuth ayarları. */
export function metaConfig() {
  return {
    appId: process.env.META_APP_ID ?? "",
    appSecret: process.env.META_APP_SECRET ?? "",
    redirectUri: process.env.META_REDIRECT_URI ?? "",
    // Graph API sürümü — tek yerden güncellenir.
    graphVersion: process.env.META_GRAPH_VERSION || "v21.0",
  };
}

/** Instagram bağlama/paylaşım için gerekli anahtarlar tanımlı mı? */
export function isInstagramConfigured(): boolean {
  const c = metaConfig();
  return Boolean(c.appId && c.appSecret && c.redirectUri);
}

/** AI içerik üretimi (OpenAI) yapılandırıldı mı? */
export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openaiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    // Metin modeli — env ile değiştirilebilir.
    model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
  };
}

/**
 * Zamanlanmış gönderileri yayına alan cron endpoint'ini koruyan gizli anahtar.
 * Vercel Cron çağrısı `Authorization: Bearer <CRON_SECRET>` ile doğrulanır.
 */
export function cronSecret(): string {
  return process.env.CRON_SECRET ?? "";
}
