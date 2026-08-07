import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { isVeoConfigured } from "@/lib/veo";
import { AdVideoStudio } from "./studio";

export const metadata = { title: "AI Reklam Stüdyosu" };

export default async function AiVideoPage() {
  await requireAdmin();

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      categories: {
        select: {
          id: true,
          name: true,
          items: { select: { id: true, name: true, photoUrl: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-fg">🎬 AI Reklam Stüdyosu</h1>
      <p className="mt-1 text-sm text-muted">
        Veo 3.1 ile işletmeler için dikey (9:16) Instagram / Facebook Reels reklam videosu üretin.
      </p>

      <div className="mt-6">
        <AdVideoStudio businesses={businesses} aiEnabled={isVeoConfigured()} />
      </div>
    </div>
  );
}
