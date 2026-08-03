import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Access token'ları veritabanında şifreli saklamak için AES-256-GCM.
 * Anahtar SOCIAL_TOKEN_SECRET (yoksa AUTH_SECRET) üzerinden türetilir.
 * Çözülen token asla frontend'e gönderilmez — yalnızca sunucu servisleri kullanır.
 *
 * Biçim: iv(12B).authTag(16B).ciphertext  → base64
 */

function key(): Buffer {
  const secret = process.env.SOCIAL_TOKEN_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Token şifreleme anahtarı yok (SOCIAL_TOKEN_SECRET veya AUTH_SECRET tanımlayın).",
    );
  }
  // 32 baytlık anahtara sabitle.
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
