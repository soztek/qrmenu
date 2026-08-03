import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/social/guard";
import { isInstagramConfigured } from "@/lib/social/config";
import { DisconnectButton } from "./disconnect-button";

export const metadata = { title: "Instagram bağlantısı" };

const ERROR_TEXT: Record<string, string> = {
  denied: "Bağlantı izni verilmedi. Tekrar deneyebilirsiniz.",
  state: "Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin.",
  connect:
    "Bağlantı tamamlanamadı. Instagram hesabınızın Business/Creator olduğundan ve bir Facebook Sayfasına bağlı olduğundan emin olun.",
  notconfigured:
    "Instagram yayın altyapısı henüz yönetici tarafından yapılandırılmadı.",
};

export default async function InstagramConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; detail?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const account = await prisma.socialAccount.findFirst({
    where: { businessId: business.id, platform: "instagram" },
    select: {
      username: true,
      displayName: true,
      profilePictureUrl: true,
      status: true,
      tokenExpiresAt: true,
      createdAt: true,
    },
  });

  const configured = isInstagramConfigured();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/sosyal" className="text-sm text-muted transition hover:text-fg">
        ← Sosyal Medya
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-fg">Instagram bağlantısı</h1>
      <p className="mt-1 text-sm text-muted">
        Onayladığınız içerikleri doğrudan Instagram'da paylaşmak için hesabınızı bağlayın.
      </p>

      {sp.connected && (
        <div className="mt-4 rounded-lg border border-green/40 bg-green-soft/40 p-3 text-sm text-fg">
          ✓ Instagram hesabınız başarıyla bağlandı.
        </div>
      )}
      {sp.error && (
        <div className="mt-4 rounded-lg border border-orange/50 bg-orange-soft/40 p-3 text-sm text-fg">
          {ERROR_TEXT[sp.error] ?? "Bir sorun oluştu, tekrar deneyin."}
          {sp.detail ? <span className="mt-1 block text-xs text-faint">{sp.detail}</span> : null}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        {account ? (
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-green to-orange text-sm font-bold text-black">
              {account.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={account.profilePictureUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (account.username ?? "IG").slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-fg">
                {account.username ? `@${account.username}` : "Instagram hesabı"}
              </div>
              <div className="text-xs text-green">Bağlı · aktif</div>
            </div>
            <DisconnectButton />
          </div>
        ) : configured ? (
          <div className="text-center">
            <p className="text-sm text-muted">
              Instagram <strong>Business / Creator</strong> hesabınızı bağlayın.
            </p>
            <a
              href="/api/social/instagram/start"
              className="mt-4 inline-block rounded-xl bg-gradient-to-b from-[#25D366] to-[#1eaf57] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Instagram Hesabını Bağla
            </a>
          </div>
        ) : (
          <div className="text-center text-sm text-muted">
            Yayın altyapısı (Meta uygulaması) henüz yapılandırılmadı. İçerik üretip
            taslak olarak saklayabilirsiniz; hazır olduğunda buradan bağlayabileceksiniz.
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface/60 p-4 text-sm text-muted">
        <div className="font-medium text-fg">Bağlamadan önce</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Instagram hesabınız <strong>Business</strong> veya <strong>Creator</strong> olmalı.</li>
          <li>Hesap bir <strong>Facebook Sayfasına</strong> bağlı olmalı.</li>
          <li>Bağlantı sırasında istenen izinleri onaylayın.</li>
        </ul>
        <p className="mt-3 text-xs text-faint">
          Erişim bilgileriniz şifrelenerek güvenli şekilde saklanır ve asla tarayıcıya gönderilmez.
        </p>
      </div>
    </div>
  );
}
