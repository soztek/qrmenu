"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/social/guard";
import { generateContent, buildCaption } from "@/lib/social/ai";
import { publishPhoto, InstagramError } from "@/lib/social/instagram";
import { decryptToken } from "@/lib/social/crypto";
import { menuUrl } from "@/lib/url";
import type {
  SocialPostType,
  SocialPostStatus,
} from "@/generated/prisma/enums";
import type { PostFormat } from "@/lib/social/types";

/** Client'a dönen sade gönderi tipi (Decimal/Date yok). */
export interface PostDTO {
  id: string;
  type: SocialPostType;
  status: SocialPostStatus;
  format: string;
  title: string | null;
  body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[];
  imageUrl: string | null;
  sourceImageUrl: string | null;
  imageConcept: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  permalink: string | null;
  errorMessage: string | null;
  menuItemId: string | null;
  createdAt: string;
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface PostRow {
  id: string;
  type: SocialPostType;
  status: SocialPostStatus;
  format: string;
  title: string | null;
  body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[];
  imageUrl: string | null;
  sourceImageUrl: string | null;
  imageConcept: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  permalink: string | null;
  errorMessage: string | null;
  menuItemId: string | null;
  createdAt: Date;
}

function toDTO(p: PostRow): PostDTO {
  return {
    id: p.id,
    type: p.type,
    status: p.status,
    format: p.format,
    title: p.title,
    body: p.body,
    cta: p.cta,
    caption: p.caption,
    hashtags: p.hashtags,
    imageUrl: p.imageUrl,
    sourceImageUrl: p.sourceImageUrl,
    imageConcept: p.imageConcept,
    scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : null,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    permalink: p.permalink,
    errorMessage: p.errorMessage,
    menuItemId: p.menuItemId,
    createdAt: p.createdAt.toISOString(),
  };
}

const POST_SELECT = {
  id: true,
  type: true,
  status: true,
  format: true,
  title: true,
  body: true,
  cta: true,
  caption: true,
  hashtags: true,
  imageUrl: true,
  sourceImageUrl: true,
  imageConcept: true,
  scheduledAt: true,
  publishedAt: true,
  permalink: true,
  errorMessage: true,
  menuItemId: true,
  createdAt: true,
} as const;

export interface GenerateDraftInput {
  type: SocialPostType;
  userPrompt?: string;
  menuItemId?: string | null;
  format?: PostFormat;
}

/** AI ile taslak içerik üretir ve DRAFT olarak kaydeder. */
export async function generateDraft(
  input: GenerateDraftInput,
): Promise<ActionResult<PostDTO>> {
  const { business } = await requireBusiness();

  let menuItem: {
    id: string;
    name: string;
    description: string | null;
    price: unknown;
    photoUrl: string | null;
    category: { name: string } | null;
  } | null = null;

  if (input.menuItemId) {
    menuItem = await prisma.menuItem.findFirst({
      where: { id: input.menuItemId, businessId: business.id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        photoUrl: true,
        category: { select: { name: true } },
      },
    });
    if (!menuItem) return { ok: false, error: "Ürün bulunamadı." };
  }

  try {
    const result = await generateContent({
      type: input.type,
      userPrompt: input.userPrompt,
      brandTone: null,
      business: {
        name: business.name,
        description: business.description,
        address: business.address,
        phone: business.phone,
        website: null,
        menuUrl: menuUrl(business.slug),
      },
      menuItem: menuItem
        ? {
            name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price != null ? String(menuItem.price) : null,
            categoryName: menuItem.category?.name ?? null,
          }
        : null,
    });

    const created = await prisma.socialPost.create({
      data: {
        businessId: business.id,
        type: input.type,
        status: "draft",
        format: input.format ?? "portrait",
        menuItemId: menuItem?.id ?? null,
        title: result.title || null,
        body: result.body || null,
        cta: result.cta || null,
        caption: result.caption || null,
        hashtags: result.hashtags,
        imageConcept: result.imageConcept || null,
        sourceImageUrl: menuItem?.photoUrl ?? null,
        imageUrl: menuItem?.photoUrl ?? null,
        aiModel: result.model,
      },
      select: POST_SELECT,
    });

    revalidatePath("/dashboard/sosyal");
    return { ok: true, data: toDTO(created) };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "İçerik üretilemedi, tekrar deneyin.";
    return { ok: false, error: msg };
  }
}

/** Var olan bir taslağın içeriğini yeniden üretir. */
export async function regenerateDraft(
  postId: string,
  userPrompt?: string,
): Promise<ActionResult<PostDTO>> {
  const { business } = await requireBusiness();
  const post = await prisma.socialPost.findFirst({
    where: { id: postId, businessId: business.id },
    select: { id: true, type: true, menuItemId: true, format: true },
  });
  if (!post) return { ok: false, error: "Gönderi bulunamadı." };

  let menuItem = null as null | {
    name: string;
    description: string | null;
    price: unknown;
    photoUrl: string | null;
    category: { name: string } | null;
  };
  if (post.menuItemId) {
    menuItem = await prisma.menuItem.findFirst({
      where: { id: post.menuItemId, businessId: business.id },
      select: {
        name: true,
        description: true,
        price: true,
        photoUrl: true,
        category: { select: { name: true } },
      },
    });
  }

  try {
    const result = await generateContent({
      type: post.type,
      userPrompt,
      business: {
        name: business.name,
        description: business.description,
        address: business.address,
        phone: business.phone,
        website: null,
        menuUrl: menuUrl(business.slug),
      },
      menuItem: menuItem
        ? {
            name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price != null ? String(menuItem.price) : null,
            categoryName: menuItem.category?.name ?? null,
          }
        : null,
    });

    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        title: result.title || null,
        body: result.body || null,
        cta: result.cta || null,
        caption: result.caption || null,
        hashtags: result.hashtags,
        imageConcept: result.imageConcept || null,
        aiModel: result.model,
      },
      select: POST_SELECT,
    });

    revalidatePath("/dashboard/sosyal");
    return { ok: true, data: toDTO(updated) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Yeniden üretilemedi.";
    return { ok: false, error: msg };
  }
}

/** Kullanıcının elle düzenlediği içeriği kaydeder. */
export async function updatePost(
  postId: string,
  fields: {
    title?: string;
    body?: string;
    cta?: string;
    hashtags?: string[];
  },
): Promise<ActionResult<PostDTO>> {
  const { business } = await requireBusiness();
  const post = await prisma.socialPost.findFirst({
    where: { id: postId, businessId: business.id },
    select: { id: true },
  });
  if (!post) return { ok: false, error: "Gönderi bulunamadı." };

  const hashtags = (fields.hashtags ?? [])
    .map((h) => h.replace(/^#/, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .slice(0, 30);

  const body = (fields.body ?? "").trim();
  const cta = (fields.cta ?? "").trim();

  const updated = await prisma.socialPost.update({
    where: { id: post.id },
    data: {
      title: (fields.title ?? "").trim() || null,
      body: body || null,
      cta: cta || null,
      hashtags,
      caption: buildCaption({ body, cta, hashtags }) || null,
    },
    select: POST_SELECT,
  });

  revalidatePath("/dashboard/sosyal");
  return { ok: true, data: toDTO(updated) };
}

/** Durum geçişi (taslak → onay bekliyor → onaylandı / reddedildi). */
export async function setPostStatus(
  postId: string,
  status: Extract<
    SocialPostStatus,
    "draft" | "pending_approval" | "approved" | "rejected"
  >,
): Promise<ActionResult<PostDTO>> {
  const { business } = await requireBusiness();
  const post = await prisma.socialPost.findFirst({
    where: { id: postId, businessId: business.id },
    select: { id: true },
  });
  if (!post) return { ok: false, error: "Gönderi bulunamadı." };

  const updated = await prisma.socialPost.update({
    where: { id: post.id },
    data: { status, ...(status === "draft" ? { scheduledAt: null } : {}) },
    select: POST_SELECT,
  });
  revalidatePath("/dashboard/sosyal");
  return { ok: true, data: toDTO(updated) };
}

/** İçeriği belirli tarih/saate zamanlar (SCHEDULED). */
export async function schedulePost(
  postId: string,
  scheduledAtISO: string,
): Promise<ActionResult<PostDTO>> {
  const { business } = await requireBusiness();
  const when = new Date(scheduledAtISO);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, error: "Geçersiz tarih." };
  }
  if (when.getTime() < Date.now() - 60_000) {
    return { ok: false, error: "Geçmiş bir zaman seçilemez." };
  }
  const post = await prisma.socialPost.findFirst({
    where: { id: postId, businessId: business.id },
    select: { id: true },
  });
  if (!post) return { ok: false, error: "Gönderi bulunamadı." };

  const updated = await prisma.socialPost.update({
    where: { id: post.id },
    data: { status: "scheduled", scheduledAt: when },
    select: POST_SELECT,
  });
  revalidatePath("/dashboard/sosyal");
  return { ok: true, data: toDTO(updated) };
}

/** Gönderiyi siler. */
export async function deletePost(postId: string): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const res = await prisma.socialPost.deleteMany({
    where: { id: postId, businessId: business.id },
  });
  if (res.count === 0) return { ok: false, error: "Gönderi bulunamadı." };
  revalidatePath("/dashboard/sosyal");
  return { ok: true, data: undefined };
}

/** Şimdi yayınla (Instagram). Bağlı hesap + herkese açık görsel gerekir. */
export async function publishNow(postId: string): Promise<ActionResult<PostDTO>> {
  const { business } = await requireBusiness();

  const post = await prisma.socialPost.findFirst({
    where: { id: postId, businessId: business.id },
    select: {
      id: true,
      caption: true,
      imageUrl: true,
      status: true,
    },
  });
  if (!post) return { ok: false, error: "Gönderi bulunamadı." };
  if (!post.imageUrl || !post.imageUrl.startsWith("http")) {
    return {
      ok: false,
      error:
        "Yayın için herkese açık bir görsel gerekli. Lütfen ürün fotoğrafı ekleyin.",
    };
  }

  const account = await prisma.socialAccount.findFirst({
    where: { businessId: business.id, platform: "instagram", status: "active" },
    select: { id: true, providerUserId: true, accessTokenEnc: true },
  });
  if (!account) {
    return {
      ok: false,
      error: "Önce Instagram hesabınızı bağlayın.",
    };
  }

  await prisma.socialPost.update({
    where: { id: post.id },
    data: { status: "publishing", errorMessage: null },
  });

  try {
    const token = decryptToken(account.accessTokenEnc);
    const res = await publishPhoto({
      igUserId: account.providerUserId,
      accessToken: token,
      imageUrl: post.imageUrl,
      caption: post.caption ?? "",
    });
    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: "published",
        publishedAt: new Date(),
        externalPostId: res.id,
        permalink: res.permalink ?? null,
        accountId: account.id,
        errorMessage: null,
      },
      select: POST_SELECT,
    });
    revalidatePath("/dashboard/sosyal");
    return { ok: true, data: toDTO(updated) };
  } catch (err) {
    const friendly =
      err instanceof InstagramError
        ? err.message
        : "Paylaşım başarısız oldu. Instagram bağlantısı süresi dolmuş olabilir, hesabınızı yeniden bağlamayı deneyin.";
    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: "failed",
        errorMessage: friendly,
        retryCount: { increment: 1 },
      },
      select: POST_SELECT,
    });
    return { ok: true, data: toDTO(updated) };
  }
}

/** Instagram bağlantısını kaldırır. */
export async function disconnectInstagram(): Promise<ActionResult> {
  const { business } = await requireBusiness();
  await prisma.socialAccount.deleteMany({
    where: { businessId: business.id, platform: "instagram" },
  });
  revalidatePath("/dashboard/sosyal");
  return { ok: true, data: undefined };
}

/** Sosyal medya ayarlarını (marka tonu, varsayılan hashtag, logo/QR) kaydeder. */
export async function updateSocialSettings(fields: {
  brandTone?: string;
  defaultHashtags?: string[];
  includeQrLink?: boolean;
  includeLogo?: boolean;
}): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const hashtags = (fields.defaultHashtags ?? [])
    .map((h) => h.replace(/^#/, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .slice(0, 30);
  const data = {
    brandTone: (fields.brandTone ?? "").trim().slice(0, 300) || null,
    defaultHashtags: hashtags,
    includeQrLink: fields.includeQrLink ?? true,
    includeLogo: fields.includeLogo ?? true,
  };
  await prisma.socialSettings.upsert({
    where: { businessId: business.id },
    update: data,
    create: { businessId: business.id, ...data },
  });
  revalidatePath("/dashboard/sosyal/ayarlar");
  return { ok: true, data: undefined };
}
