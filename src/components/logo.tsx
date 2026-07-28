import Image from "next/image";
import Link from "next/link";

/**
 * Söztek QR Menü logosu (public/logo.png). Marka her yerde buradan gelir.
 * `href={null}` verilirse link olmadan sadece görsel döner.
 */
export function Logo({
  href = "/",
  className = "h-9",
}: {
  href?: string | null;
  className?: string;
}) {
  const img = (
    <Image
      src="/logo.png"
      alt="Söztek QR Menü"
      width={627}
      height={316}
      priority
      className={`${className} w-auto rounded-lg`}
    />
  );
  if (href === null) return img;
  return (
    <Link href={href} className="inline-flex items-center">
      {img}
    </Link>
  );
}
