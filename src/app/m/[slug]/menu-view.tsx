"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useActionState, useEffect, useRef } from "react";
import { formatTL } from "@/lib/url";
import { submitReview, type ReviewState } from "@/lib/actions/reviews";
import { themeStyle } from "@/lib/themes";

export interface MenuItemT {
  id: string;
  name: string;
  description: string | null;
  price: string;
  photoUrl: string | null;
}
export interface MenuCategoryT {
  id: string;
  name: string;
  imageUrl: string | null;
  items: MenuItemT[];
}
export interface MenuReviewT {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
}
export interface MenuBusinessT {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  address: string | null;
  mapsUrl: string | null;
  instagram: string | null;
  wifiName: string | null;
  wifiPassword: string | null;
  workingHours: string | null;
}

function Stars({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`text-orange ${className}`}>
      {"★".repeat(n)}
      <span className="text-faint/40">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function MenuView({
  business,
  categories,
  reviews,
  theme,
}: {
  business: MenuBusinessT;
  categories: MenuCategoryT[];
  reviews: MenuReviewT[];
  theme: string;
}) {
  const [active, setActive] = useState<string | null>(null); // null = kategori grid
  const [query, setQuery] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return [];
    return categories.flatMap((c) =>
      c.items
        .filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description ?? "").toLowerCase().includes(q),
        )
        .map((i) => ({ ...i, categoryName: c.name })),
    );
  }, [q, categories]);

  const activeCategory = categories.find((c) => c.id === active) ?? null;

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const hasInfo =
    business.phone ||
    business.address ||
    business.mapsUrl ||
    business.instagram ||
    business.wifiName ||
    business.workingHours;

  return (
    <div
      style={themeStyle(theme)}
      className="mx-auto min-h-screen max-w-lg bg-bg pb-16 text-fg"
    >
      {/* ── Hero ── */}
      <header className="relative">
        <div
          className="h-40 w-full bg-surface-2 bg-cover bg-center"
          style={
            business.coverUrl
              ? { backgroundImage: `url(${business.coverUrl})` }
              : {
                  background:
                    "linear-gradient(135deg, var(--color-green-soft), var(--color-orange-soft))",
                }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
        <div className="relative -mt-12 px-5">
          <div className="flex items-end gap-3">
            {business.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={business.name}
                width={72}
                height={72}
                className="h-18 w-18 rounded-2xl border-2 border-bg object-cover"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-bg bg-green text-2xl font-bold text-on-primary">
                {business.name.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
            {business.name}
          </h1>
          {business.description && (
            <p className="mt-1 text-sm text-muted">{business.description}</p>
          )}
          {reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <Stars n={Math.round(avg)} />
              <span className="text-muted">
                {avg.toFixed(1)} · {reviews.length} yorum
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Bilgi paneli ── */}
      {hasInfo && (
        <div className="px-5 pt-4">
          <button
            onClick={() => setInfoOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
          >
            <span className="text-muted">
              {[
                business.wifiName && "WiFi",
                business.phone && "Telefon",
                business.address && "Adres",
                business.instagram && "Instagram",
                business.workingHours && "Saatler",
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="text-green">{infoOpen ? "Gizle" : "Göster"}</span>
          </button>
          {infoOpen && (
            <div className="mt-2 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
              {business.workingHours && (
                <InfoRow icon="🕒" label="Çalışma saatleri" value={business.workingHours} />
              )}
              {business.phone && (
                <InfoRow
                  icon="📞"
                  label="Telefon"
                  value={business.phone}
                  href={`tel:${business.phone.replace(/\s/g, "")}`}
                />
              )}
              {business.address && (
                <InfoRow
                  icon="📍"
                  label="Adres"
                  value={business.address}
                  href={business.mapsUrl ?? undefined}
                />
              )}
              {business.instagram && (
                <InfoRow
                  icon="📷"
                  label="Instagram"
                  value={`@${business.instagram}`}
                  href={`https://instagram.com/${business.instagram}`}
                />
              )}
              {business.wifiName && (
                <InfoRow
                  icon="📶"
                  label="WiFi"
                  value={`${business.wifiName}${business.wifiPassword ? ` · ${business.wifiPassword}` : ""}`}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Arama ── */}
      <div className="sticky top-0 z-10 bg-bg/90 px-5 py-3 backdrop-blur">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Menüde ara…"
          className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm outline-none placeholder:text-faint focus:border-green"
        />
        {!q && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <Chip active={active === null} onClick={() => setActive(null)}>
              Tümü
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.id}
                active={active === c.id}
                onClick={() => setActive(c.id)}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* ── İçerik ── */}
      <div className="px-5">
        {q ? (
          <ProductList
            items={searchResults}
            empty="Aramanla eşleşen ürün yok."
          />
        ) : active === null ? (
          categories.length === 0 ? (
            <p className="py-16 text-center text-muted">Menü yakında burada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className="overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:border-green/50"
                >
                  <div
                    className="h-24 w-full bg-surface-2 bg-cover bg-center"
                    style={
                      c.imageUrl
                        ? { backgroundImage: `url(${c.imageUrl})` }
                        : undefined
                    }
                  >
                    {!c.imageUrl && (
                      <div className="grid h-full place-items-center text-3xl">🍽️</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-faint">{c.items.length} ürün</div>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="pt-1">
            <button
              onClick={() => setActive(null)}
              className="mb-3 text-sm text-green"
            >
              ← Tüm kategoriler
            </button>
            <h2 className="mb-3 text-lg font-bold">{activeCategory?.name}</h2>
            <ProductList
              items={activeCategory?.items ?? []}
              empty="Bu kategoride ürün yok."
            />
          </div>
        )}
      </div>

      {/* ── Yorumlar ── */}
      <section className="mt-10 border-t border-border px-5 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Yorumlar</h2>
          <button
            onClick={() => setReviewOpen((v) => !v)}
            className="rounded-lg bg-green px-3 py-1.5 text-sm font-semibold text-on-primary"
          >
            Yorum yap
          </button>
        </div>

        {reviewOpen && (
          <div className="mt-4">
            <ReviewForm slug={business.slug} onDone={() => setReviewOpen(false)} />
          </div>
        )}

        <div className="mt-4 space-y-3">
          {reviews.length === 0 ? (
            <p className="text-sm text-faint">
              Henüz yorum yok. İlk yorumu sen yap!
            </p>
          ) : (
            reviews.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.authorName}</span>
                  <Stars n={r.rating} className="text-sm" />
                </div>
                <p className="mt-1.5 text-sm text-muted">{r.comment}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <footer className="mt-10 px-5 text-center text-xs text-faint">
        <a href="/" className="hover:text-fg">
          Söztek QR Menü ile hazırlandı
        </a>
      </footer>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-2.5">
      <span>{icon}</span>
      <div>
        <div className="text-xs text-faint">{label}</div>
        <div className={href ? "text-green" : "text-fg"}>{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition ${
        active ? "bg-green font-medium text-on-primary" : "bg-surface-2 text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function ProductList({
  items,
  empty,
}: {
  items: (MenuItemT & { categoryName?: string })[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-faint">{empty}</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex gap-3 rounded-2xl border border-border bg-surface p-3"
        >
          {item.photoUrl ? (
            <Image
              src={item.photoUrl}
              alt={item.name}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl">
              🍽️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{item.name}</h3>
              <span className="shrink-0 font-bold text-orange">
                {formatTL(item.price)}
              </span>
            </div>
            {item.categoryName && (
              <div className="text-[11px] text-faint">{item.categoryName}</div>
            )}
            {item.description && (
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function ReviewForm({ slug, onDone }: { slug: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    submitReview,
    {},
  );
  const [rating, setRating] = useState(5);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-green/40 bg-green-soft p-4 text-sm">
        <p className="text-green">Yorumun alındı! İşletme onayladıktan sonra yayınlanacak. Teşekkürler 🙏</p>
        <button onClick={onDone} className="mt-2 text-muted underline">
          Kapat
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none placeholder:text-faint focus:border-green";

  return (
    <form ref={formRef} action={action} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? "text-orange" : "text-faint/40"}`}
            aria-label={`${n} yıldız`}
          >
            ★
          </button>
        ))}
      </div>
      <input name="authorName" placeholder="Adın" className={inputCls} required />
      <textarea
        name="comment"
        placeholder="Deneyimini paylaş…"
        rows={3}
        className={inputCls}
        required
      />
      {state.error && <p className="text-sm text-orange">{state.error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-green-dark disabled:opacity-60"
        >
          {pending ? "Gönderiliyor…" : "Gönder"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-faint">
          İptal
        </button>
      </div>
    </form>
  );
}
