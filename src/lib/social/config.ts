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

/** AI içerik üretimi (Anthropic/Claude) yapılandırıldı mı? */
export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function anthropicConfig() {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    // Metin modeli — env ile değiştirilebilir (varsayılan: hızlı/ucuz Haiku).
    model: process.env.ANTHROPIC_TEXT_MODEL || "claude-haiku-4-5-20251001",
  };
}

/**
 * Zamanlanmış gönderileri yayına alan cron endpoint'ini koruyan gizli anahtar.
 * Vercel Cron çağrısı `Authorization: Bearer <CRON_SECRET>` ile doğrulanır.
 */
export function cronSecret(): string {
  return process.env.CRON_SECRET ?? "";
}
