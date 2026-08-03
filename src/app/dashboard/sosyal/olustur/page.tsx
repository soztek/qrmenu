import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/social/guard";
import { isAIConfigured } from "@/lib/social/config";
import { CreateStudio } from "./create-studio";

export const metadata = { title: "İçerik oluştur" };

export default async function CreateContentPage() {
  const { business } = await requireBusiness();

  const [items, account] = await Promise.all([
    prisma.menuItem.findMany({
      where: { businessId: business.id },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        category: { select: { name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 300,
    }),
    prisma.socialAccount.findFirst({
      where: { businessId: business.id, platform: "instagram", status: "active" },
      select: { username: true, profilePictureUrl: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/sosyal"
            className="text-sm text-muted transition hover:text-fg"
          >
            ← Sosyal Medya
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-fg">İçerik oluştur</h1>
          <p className="mt-1 text-sm text-muted">
            Menünüzden ve işletme bilgilerinizden yapay zeka ile Instagram içeriği üretin.
          </p>
        </div>
      </div>

      <CreateStudio
        business={{ name: business.name }}
        menuItems={items.map((m) => ({
          id: m.id,
          name: m.name,
          categoryName: m.category?.name ?? null,
          photoUrl: m.photoUrl,
        }))}
        igAccount={
          account
            ? { username: account.username, avatarUrl: account.profilePictureUrl }
            : null
        }
        aiEnabled={isAIConfigured()}
        instagramConnected={Boolean(account)}
      />
    </div>
  );
}
