import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/social/guard";
import { STATUS_META, contentTypeLabel } from "@/lib/social/types";
import type { SocialPostStatus } from "@/generated/prisma/enums";
import { PostRowActions } from "./post-row-actions";

export const metadata = { title: "Gönderiler" };

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "draft", label: "Taslak" },
  { key: "pending_approval", label: "Onay bekleyen" },
  { key: "approved", label: "Onaylı" },
  { key: "scheduled", label: "Zamanlanan" },
  { key: "published", label: "Yayınlanan" },
  { key: "failed", label: "Başarısız" },
];

const VALID = new Set(TABS.map((t) => t.key).filter((k) => k !== "all"));

const TONE_CLASS: Record<string, string> = {
  muted: "bg-surface-2 text-muted",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
  red: "bg-orange-soft text-orange",
};

function fmt(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const status = sp.status && VALID.has(sp.status) ? sp.status : "all";

  const account = await prisma.socialAccount.findFirst({
    where: { businessId: business.id, platform: "instagram", status: "active" },
    select: { id: true },
  });
  const canPublish = Boolean(account);

  const posts = await prisma.socialPost.findMany({
    where: {
      businessId: business.id,
      ...(status !== "all" ? { status: status as SocialPostStatus } : {}),
    },
    select: {
      id: true,
      type: true,
      status: true,
      caption: true,
      title: true,
      imageUrl: true,
      scheduledAt: true,
      publishedAt: true,
      permalink: true,
      errorMessage: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/sosyal" className="text-sm text-muted transition hover:text-fg">
            ← Sosyal Medya
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-fg">Gönderiler</h1>
        </div>
        <Link
          href="/dashboard/sosyal/olustur"
          className="rounded-xl bg-gradient-to-b from-green to-green-dark px-4 py-2 text-sm font-semibold text-black transition hover:brightness-105"
        >
          ✨ Yeni içerik
        </Link>
      </div>

      {/* Filtre sekmeleri */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = status === t.key;
          const href = t.key === "all" ? "/dashboard/sosyal/gonderiler" : `/dashboard/sosyal/gonderiler?status=${t.key}`;
          return (
            <Link
              key={t.key}
              href={href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
                active ? "bg-fg text-bg" : "border border-border text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
          Bu bölümde henüz içerik yok.{" "}
          <Link href="/dashboard/sosyal/olustur" className="text-green hover:underline">
            İçerik oluşturun →
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {posts.map((p) => {
            const meta = STATUS_META[p.status];
            return (
              <div
                key={p.id}
                className="flex gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-lg">🖼️</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASS[meta.tone]}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-faint">{contentTypeLabel(p.type)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-fg">
                    {p.title || p.caption || "—"}
                  </p>
                  <div className="mt-1 text-xs text-faint">
                    {p.status === "scheduled" && p.scheduledAt && `📅 ${fmt(p.scheduledAt)}`}
                    {p.status === "published" && p.publishedAt && `✅ ${fmt(p.publishedAt)}`}
                    {p.status === "failed" && p.errorMessage && (
                      <span className="text-orange">❌ {p.errorMessage}</span>
                    )}
                    {p.permalink && (
                      <a
                        href={p.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-green hover:underline"
                      >
                        Instagram'da aç ↗
                      </a>
                    )}
                  </div>
                </div>

                <PostRowActions
                  postId={p.id}
                  status={p.status}
                  canPublish={canPublish}
                  hasImage={Boolean(p.imageUrl && p.imageUrl.startsWith("http"))}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
