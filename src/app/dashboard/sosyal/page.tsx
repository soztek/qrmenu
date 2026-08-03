import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/social/guard";
import { isAIConfigured, isInstagramConfigured } from "@/lib/social/config";
import type { SocialPostStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Sosyal Medya Asistanı" };

const SECTIONS = [
  { href: "/dashboard/sosyal/olustur", emoji: "✨", title: "İçerik oluştur", desc: "AI ile yeni gönderi üret." },
  { href: "/dashboard/sosyal/gonderiler?status=scheduled", emoji: "📅", title: "İçerik takvimi", desc: "Zamanlanmış gönderiler." },
  { href: "/dashboard/sosyal/gonderiler?status=draft", emoji: "📄", title: "Taslaklar", desc: "Kaydettiğiniz taslaklar." },
  { href: "/dashboard/sosyal/gonderiler?status=pending_approval", emoji: "⏳", title: "Onay bekleyenler", desc: "Onayınızı bekleyen içerik." },
  { href: "/dashboard/sosyal/gonderiler?status=published", emoji: "✅", title: "Yayınlananlar", desc: "Geçmiş paylaşımlar." },
  { href: "/dashboard/sosyal/baglanti", emoji: "🔗", title: "Instagram bağlantısı", desc: "Hesabınızı bağlayın." },
  { href: "/dashboard/sosyal/ayarlar", emoji: "⚙️", title: "Ayarlar", desc: "Marka tonu, hashtag'ler." },
];

export default async function SocialHomePage() {
  const { business } = await requireBusiness();

  const [account, grouped, total] = await Promise.all([
    prisma.socialAccount.findFirst({
      where: { businessId: business.id, platform: "instagram", status: "active" },
      select: { username: true, displayName: true },
    }),
    prisma.socialPost.groupBy({
      by: ["status"],
      where: { businessId: business.id },
      _count: true,
    }),
    prisma.socialPost.count({ where: { businessId: business.id } }),
  ]);

  const count = (s: SocialPostStatus) =>
    grouped.find((g) => g.status === s)?._count ?? 0;

  const stats: { label: string; value: number; href: string }[] = [
    { label: "Toplam", value: total, href: "/dashboard/sosyal/gonderiler" },
    { label: "Taslak", value: count("draft"), href: "/dashboard/sosyal/gonderiler?status=draft" },
    { label: "Zamanlanan", value: count("scheduled"), href: "/dashboard/sosyal/gonderiler?status=scheduled" },
    { label: "Yayınlanan", value: count("published"), href: "/dashboard/sosyal/gonderiler?status=published" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">📱 Sosyal Medya Asistanı</h1>
          <p className="mt-1 text-sm text-muted">
            Menünüzden otomatik Instagram içerikleri üretin, onaylayın ve paylaşın.
          </p>
        </div>
        <Link
          href="/dashboard/sosyal/olustur"
          className="rounded-xl bg-gradient-to-b from-green to-green-dark px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-105"
        >
          ✨ İçerik oluştur
        </Link>
      </div>

      {/* Bağlantı / yapılandırma durumu */}
      <div className="mt-5 rounded-xl border border-border bg-surface p-4">
        {account ? (
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-green-soft text-green">✓</span>
            <div className="text-sm">
              <div className="font-medium text-fg">
                Instagram bağlı{account.username ? `: @${account.username}` : ""}
              </div>
              <div className="text-faint">Onayladığınız içerikler bu hesapta yayınlanır.</div>
            </div>
            <Link href="/dashboard/sosyal/baglanti" className="ml-auto text-sm text-muted transition hover:text-fg">
              Yönet →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-soft text-orange">!</span>
            <div className="text-sm">
              <div className="font-medium text-fg">Instagram henüz bağlı değil</div>
              <div className="text-faint">
                {isInstagramConfigured()
                  ? "İçerik üretip taslak/onay yapabilirsiniz; yayın için hesabınızı bağlayın."
                  : "İçerik üretip önizleyebilirsiniz; yayın altyapısı yönetici tarafından aktifleştirilecek."}
              </div>
            </div>
            <Link
              href="/dashboard/sosyal/baglanti"
              className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm text-fg transition hover:border-green/50"
            >
              Bağlantıyı aç
            </Link>
          </div>
        )}
      </div>

      {!isAIConfigured() && (
        <div className="mt-3 rounded-xl border border-orange/40 bg-orange-soft/30 p-3 text-sm text-fg">
          Not: AI içerik üretimi için yönetici <code>OPENAI_API_KEY</code> eklemeli. Arayüz ve akış hazır.
        </div>
      )}

      {/* İstatistik */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-border bg-surface p-4 transition hover:border-green/40"
          >
            <div className="text-2xl font-bold text-fg">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Bölümler */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-xl border border-border bg-surface p-4 transition hover:border-green/40"
          >
            <div className="text-xl">{s.emoji}</div>
            <div className="mt-2 font-semibold text-fg">{s.title}</div>
            <div className="mt-0.5 text-sm text-muted">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
