"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { uniqueBusinessSlug } from "@/lib/slug";
import { TRIAL_DAYS } from "@/lib/plans";
import { isAdminEmail } from "@/lib/admin";
import {
  sendEmail,
  welcomeEmail,
  newSignupNoticeEmail,
  passwordResetEmail,
} from "@/lib/email";
import { SITE_URL } from "@/lib/seo";

export type AuthState = { error?: string; ok?: boolean };

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

const changeSchema = z.object({
  current: z.string().min(1, "Mevcut şifreyi girin"),
  next: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
});

/** Girişli kullanıcının şifresini değiştirir. */
export async function changePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  if (!user) return { error: "Yetkisiz" };

  const parsed = changeSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgiler" };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(parsed.data.current, dbUser.passwordHash))) {
    return { error: "Mevcut şifre hatalı" };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });
  return { ok: true };
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "Adınızı girin"),
  businessName: z.string().trim().min(2, "İşletme adını girin"),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  plan: z.enum(["starter", "pro", "premium"]).optional(),
});

/** Yeni işletme kaydı: kullanıcı + işletme + 7 günlük deneme, ardından oturum. */
export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    password: formData.get("password"),
    plan: formData.get("plan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgiler" };
  }
  const { name, businessName, email, password, plan } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin." };
  }

  const passwordHash = await hashPassword(password);
  const admin = isAdminEmail(email);

  let userId: string;
  if (admin) {
    // Platform admini — işletme oluşturulmaz.
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: "admin" },
    });
    userId = user.id;
  } else {
    const slug = await uniqueBusinessSlug(businessName);
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        business: {
          create: {
            name: businessName,
            slug,
            plan: plan ?? "starter",
            subscriptionStatus: "trialing",
            trialEndsAt,
          },
        },
      },
    });
    userId = user.id;

    // Hoş geldin maili (işletmeye) + yeni kayıt bildirimi (yöneticiye).
    // Başarısız gönderim kaydı engellemez.
    try {
      const welcome = welcomeEmail({ businessName, trialEndsAt });
      await sendEmail({ to: email, subject: welcome.subject, html: welcome.html });

      const admin = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
      if (admin && admin !== email) {
        const notice = newSignupNoticeEmail({
          businessName,
          ownerName: name,
          ownerEmail: email,
          plan: plan ?? "starter",
          trialEndsAt,
        });
        await sendEmail({ to: admin, subject: notice.subject, html: notice.html });
      }
    } catch (e) {
      console.error("Kayıt e-postaları gönderilemedi:", e);
    }
  }

  await createSession(userId);
  redirect(admin ? "/admin" : "/dashboard");
}

/** E-posta/şifre ile giriş. */
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "E-posta veya şifre hatalı" };
  }

  await createSession(user.id);
  redirect(isAdminEmail(user.email) || user.role === "admin" ? "/admin" : "/dashboard");
}

/** Çıkış yap. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

/* ── Şifre sıfırlama ──────────────────────────────────────────── */

/**
 * "Şifremi unuttum": kayıtlı e-postaya sıfırlama linki gönderir.
 * Güvenlik için e-postanın kayıtlı olup olmadığını ele vermez (her zaman ok döner).
 */
export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Geçerli bir e-posta girin" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Önceki kullanılmamış tokenları temizle, yenisini oluştur.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    const raw = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: sha256(raw),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 saat
      },
    });
    const resetUrl = `${SITE_URL}/sifre-sifirla?token=${raw}`;
    try {
      const { subject, html } = passwordResetEmail({ name: user.name, resetUrl });
      await sendEmail({ to: user.email, subject, html });
    } catch (e) {
      console.error("Şifre sıfırlama maili gönderilemedi:", e);
    }
  }
  // Her durumda aynı sonuç (e-posta varlığını sızdırma).
  return { ok: true };
}

/** Token + yeni şifre ile şifreyi değiştirir. */
export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Yeni şifre en az 6 karakter olmalı" };
  }
  if (!token) {
    return { error: "Geçersiz bağlantı" };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return {
      error:
        "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama talebi oluşturun.",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Güvenlik: mevcut oturumları kapat.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true };
}
