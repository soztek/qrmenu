/**
 * Instagram gönderi önizlemesi — paylaşımın nasıl görüneceğini gösterir.
 * Sunumsal bileşen (client stüdyo içinde kullanılır). Gerçek IG kartı hissi.
 */
export interface PreviewData {
  businessName: string;
  username?: string | null;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  imageConcept?: string | null;
  caption?: string | null;
  format: "portrait" | "square";
}

export function InstagramPreview({ data }: { data: PreviewData }) {
  const handle = (data.username || data.businessName || "isletme")
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/\s+/g, "_");

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Başlık */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-green to-orange text-xs font-bold text-black">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            handle.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-fg">{handle}</div>
        </div>
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-muted" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </div>

      {/* Görsel */}
      <div
        className={`relative w-full bg-surface-2 ${
          data.format === "portrait" ? "aspect-[4/5]" : "aspect-square"
        }`}
      >
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center">
            <span className="text-2xl">🖼️</span>
            <p className="text-xs text-muted">
              {data.imageConcept
                ? `Görsel konsepti: ${data.imageConcept}`
                : "Ürün fotoğrafı eklenince burada görünür."}
            </p>
          </div>
        )}
      </div>

      {/* Aksiyon ikonları (dekoratif) */}
      <div className="flex items-center gap-4 px-3 pt-2.5 text-fg">
        <HeartIcon />
        <CommentIcon />
        <ShareIcon />
      </div>

      {/* Açıklama */}
      <div className="px-3 pb-3 pt-2">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">
          <span className="font-semibold">{handle}</span>{" "}
          {data.caption || "Açıklama burada görünecek…"}
        </p>
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 21s-7.5-4.6-9.7-9C.9 9 2.2 5.5 5.5 5.1 7.6 4.8 9.3 6 12 8.7c2.7-2.7 4.4-3.9 6.5-3.6 3.3.4 4.6 3.9 3.2 6.9C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M21 11.5a8.5 8.5 0 01-11.9 7.8L3 21l1.7-6.1A8.5 8.5 0 1121 11.5z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
