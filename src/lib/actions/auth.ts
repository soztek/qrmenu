"use server";

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

export type AuthState = { error?: string };

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
