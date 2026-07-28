import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReviewActions } from "./review-actions";

export const metadata: Metadata = { title: "Yorumlar" };
export const dynamic = "force-dynamic";

function Stars({ n }: { n: number }) {
  return (
    <span className="text-orange" aria-label={`${n} yıldız`}>
      {"★".repeat(n)}
      <span className="text-faint">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function trDate(d: Date): string {
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user?.business) return null;

  const reviews = await prisma.review.findMany({
    where: { businessId: user.business.id },
    orderBy: { createdAt: "desc" },
  });
  const pending = reviews.filter((r) => !r.isApproved);
  const approved = reviews.filter((r) => r.isApproved);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Yorumlar</h1>
      <p className="mt-1 text-muted">
        Müşteri yorumları önce sana düşer. Yalnızca <b className="text-fg">onayladığın</b>{" "}
        yorumlar menüde görünür.
      </p>

      {/* Onay bekleyen */}
      <section className="mt-6">
        <h2 className="font-semibold">
          Onay bekleyen{" "}
          {pending.length > 0 && (
            <span className="ml-1 rounded-full bg-orange px-2 py-0.5 text-xs text-black">
              {pending.length}
            </span>
          )}
        </h2>
        <div className="mt-3 space-y-3">
          {pending.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-faint">
              Onay bekleyen yorum yok.
            </p>
          ) : (
            pending.map((r) => (
              <article key={r.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium">{r.authorName}</span>{" "}
                    <Stars n={r.rating} />
                  </div>
                  <span className="text-xs text-faint">{trDate(r.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{r.comment}</p>
                <div className="mt-3">
                  <ReviewActions id={r.id} approved={false} />
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Yayında */}
      <section className="mt-8">
        <h2 className="font-semibold">Yayında ({approved.length})</h2>
        <div className="mt-3 space-y-3">
          {approved.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-faint">
              Henüz yayında yorum yok.
            </p>
          ) : (
            approved.map((r) => (
              <article key={r.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium">{r.authorName}</span>{" "}
                    <Stars n={r.rating} />
                  </div>
                  <span className="text-xs text-faint">{trDate(r.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{r.comment}</p>
                <div className="mt-3">
                  <ReviewActions id={r.id} approved={true} />
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
