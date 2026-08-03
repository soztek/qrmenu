import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/social/guard";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Sosyal medya ayarları" };

export default async function SocialSettingsPage() {
  const { business } = await requireBusiness();

  const settings = await prisma.socialSettings.findUnique({
    where: { businessId: business.id },
    select: {
      brandTone: true,
      defaultHashtags: true,
      includeQrLink: true,
      includeLogo: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/sosyal" className="text-sm text-muted transition hover:text-fg">
        ← Sosyal Medya
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-fg">Sosyal medya ayarları</h1>
      <p className="mt-1 mb-5 text-sm text-muted">
        AI içerik üretiminin markanıza uygun olması için tercihlerinizi belirleyin.
      </p>

      <SettingsForm
        initial={{
          brandTone: settings?.brandTone ?? "",
          defaultHashtags: (settings?.defaultHashtags ?? []).join(" "),
          includeQrLink: settings?.includeQrLink ?? true,
          includeLogo: settings?.includeLogo ?? true,
        }}
      />
    </div>
  );
}
