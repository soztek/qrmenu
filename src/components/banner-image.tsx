/**
 * İşletme üst banner'ı — yüklenen görsel tam genişlikte, olduğu gibi (kırpma yok,
 * doğal yükseklik). Üstü/altı kesilmez. Geniş (yatay) görsellerde banner görünümü verir.
 */
export function BannerImage({ src }: { src: string }) {
  return (
    <div className="w-full overflow-hidden bg-surface-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="block h-auto w-full" />
    </div>
  );
}
