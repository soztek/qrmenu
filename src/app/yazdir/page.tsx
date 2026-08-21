import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatTL, menuUrl } from "@/lib/url";
import { allergen, meatLabel } from "@/lib/compliance";
import { PrintButton, LockedPrintButton } from "./print-button";

export const metadata: Metadata = { title: "Yazdırılabilir menü" };
export const dynamic = "force-dynamic";

export default async function PrintMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string; cat?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  // Admin ?b=<işletmeId> ile herhangi bir işletmenin menüsünü görebilir.
  // ?cat=<kategoriId> verilirse yalnızca o kategori yazdırılır.
  const { b, cat } = await searchParams;
  let business;
  const viewingOther = Boolean(b) && isAdmin(user);
  if (viewingOther) {
    business = await prisma.business.findUnique({ where: { id: b } });
    if (!business) notFound();
  } else {
    if (!user.business) redirect("/dashboard");
    business = user.business;
  }

  // Deneme sürümü: menü önizlenir ama yazdırma/PDF kilitli (admin hariç).
  const restricted = !isAdmin(user) && business.subscriptionStatus !== "active";

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  const allFilled = categories.filter((c) => c.items.length > 0);
  // ?cat= verilmişse yalnızca o kategori; yoksa tüm menü.
  const filled = cat ? allFilled.filter((c) => c.id === cat) : allFilled;

  // Besin değeri / alerjen girilmiş mi? (dipnot yalnızca girilmişse gösterilir)
  const hasNutrition = filled.some((c) =>
    c.items.some(
      (i) =>
        i.calories != null ||
        i.protein != null ||
        i.fat != null ||
        i.carbs != null ||
        (i.allergens?.length ?? 0) > 0 ||
        Boolean(i.meatType),
    ),
  );

  // Görsel başlık için ürün fotoğrafları.
  const photos = filled
    .flatMap((c) => c.items)
    .map((i) => i.photoUrl)
    .filter((p): p is string => Boolean(p));

  const url = menuUrl(business.slug);
  const qr = await QRCode.toDataURL(url, {
    width: 300,
    margin: 1,
    color: { dark: "#111111", light: "#ffffff" },
  });

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Araç çubuğu — baskıda gizli */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-300 bg-white px-5 py-3">
        <Link
          href={viewingOther ? "/admin/businesses" : "/dashboard/menu"}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          {viewingOther ? "← İşletmelere dön" : "← Menüye dön"}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-neutral-500 sm:block">
            {restricted
              ? "Önizleme — yazdırma ücretli pakete özeldir"
              : "Açılan pencerede “PDF olarak kaydet”i seçebilirsin"}
          </span>
          {restricted ? <LockedPrintButton /> : <PrintButton />}
        </div>
      </div>

      {/* Deneme sürümü: baskıda menü yerine uyarı çıkar (Ctrl+P koruması) */}
      {restricted && (
        <div className="hidden print:flex print:min-h-screen print:flex-col print:items-center print:justify-center print:p-12 print:text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-xl font-bold">Yazdırma ücretli pakete özeldir</h1>
          <p className="mt-2 text-sm">Lütfen üretici ile görüşerek paketinizi yükseltin.</p>
        </div>
      )}

      {/* Yazdırılacak sayfa (deneme: baskıda gizli) */}
      <div
        className={`print-sheet mx-auto my-6 max-w-2xl bg-white px-10 py-12 shadow-sm ${
          restricted ? "print:hidden" : ""
        }`}
      >
        {/* Görsel başlık: kapak varsa kapak, yoksa ürün fotoğraflarından kolaj */}
        {/* Başlık — telefon menüsüyle aynı: kapak olduğu gibi + üstüne binen köşeli logo, sola yaslı */}
        <header className="mb-8">
          {/* Kapak görseli yalnızca tüm menü çıktısında; kategori PDF'inde kaldırıldı (logo kalır). */}
          {!cat &&
            (business.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.coverUrl}
                alt=""
                className="block h-auto w-full rounded-xl bg-neutral-100"
              />
            ) : photos.length >= 2 ? (
              <div className="grid grid-cols-4 gap-1 overflow-hidden rounded-xl">
                {photos.slice(0, 4).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={p} alt="" className="h-24 w-full object-cover" />
                ))}
              </div>
            ) : null)}

          <div
            className={
              !cat && (business.coverUrl || photos.length >= 2)
                ? "relative -mt-10 px-1 text-center"
                : "pt-1 text-center"
            }
          >
            {business.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logoUrl}
                alt=""
                className="mx-auto h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-sm"
              />
            )}
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-900">
              {business.name}
            </h1>
            {business.description && (
              <p className="mt-1 text-sm text-neutral-500">{business.description}</p>
            )}
            {(business.phone || business.address) && (
              <p className="mt-2 text-xs text-neutral-500">
                {[business.phone, business.address].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="mt-5 border-b-2 border-neutral-900" />
        </header>

        {filled.length === 0 ? (
          <p className="py-20 text-center text-neutral-400">Menüde ürün yok.</p>
        ) : (
          <div className="mt-8 space-y-8">
            {filled.map((c) => (
              <section key={c.id}>
                <h2 className="mb-4 break-after-avoid text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900">
                  {c.name}
                </h2>
                <div className="gap-x-8 [column-fill:balance] sm:columns-2 print:columns-2">
                  {c.items.map((item) => (
                    <div
                      key={item.id}
                      className="mb-3 flex break-inside-avoid items-start gap-2.5"
                    >
                      {item.photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.photoUrl}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-md object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[14px] font-bold uppercase text-neutral-900">
                            {item.name}
                          </span>
                          <span className="flex-1 border-b border-dotted border-neutral-400" />
                          <span className="whitespace-nowrap text-[14px] font-extrabold text-neutral-900">
                            {formatTL(item.price.toString())}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-[11px] text-neutral-500">
                            {item.description}
                          </p>
                        )}
                        {(() => {
                          const meta: string[] = [];
                          if (item.calories != null)
                            meta.push(`${item.calories} kcal`);
                          if (item.protein != null)
                            meta.push(`Protein ${item.protein}g`);
                          if (item.fat != null) meta.push(`Yağ ${item.fat}g`);
                          if (item.carbs != null)
                            meta.push(`Karb ${item.carbs}g`);
                          const meat = meatLabel(item.meatType);
                          if (meat) meta.push(meat);
                          if (item.containsAlcohol) meta.push("Alkol içerir");
                          if (item.containsPork) meta.push("Domuz eti içerir");
                          const alg = (item.allergens ?? [])
                            .map((k) => allergen(k)?.label ?? null)
                            .filter((v): v is string => Boolean(v));
                          if (meta.length === 0 && alg.length === 0) return null;
                          return (
                            <p className="mt-0.5 text-[10px] font-semibold leading-snug text-neutral-600">
                              {meta.length > 0 && <span>{meta.join(" · ")}</span>}
                              {alg.length > 0 && (
                                <span className={meta.length > 0 ? "ml-3" : undefined}>
                                  <span className="font-bold">Alerjen:</span>{" "}
                                  {alg.join(", ")}
                                </span>
                              )}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* QR — dijital menüye geçiş */}
        <div className="mt-10 flex break-inside-avoid flex-col items-center border-t border-neutral-200 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Menü QR kodu" width={104} height={104} />
          <p className="mt-2 text-sm font-semibold text-neutral-800">
            📱 Fotoğraflı dijital menü için okutun
          </p>
          <p className="text-xs text-neutral-400">{url}</p>
        </div>

        {hasNutrition && (
          <p className="mt-6 break-inside-avoid border-t border-neutral-200 pt-4 text-center text-[10px] leading-relaxed text-neutral-500">
            Belirtilen kalori ve besin değerleri <b>1 (bir) porsiyon</b> için olup
            yaklaşık değerlerdir; hazırlama ve porsiyona göre değişebilir. Alerjen
            bilgisi üründe bulunabilecek maddeleri belirtir. Ciddi alerjiniz varsa
            lütfen personelimize danışın.
          </p>
        )}

      </div>
    </div>
  );
}
