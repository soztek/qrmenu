/**
 * Ödeme yöntemi rozetleri (Visa · Mastercard · iyzico ile Öde).
 * iyzico üye iş yeri kriterleri gereği footer'da gösterilir.
 * Not: En doğru sonuç için iyzico'nun resmi logo görselleriyle değiştirilebilir.
 */
export function PaymentLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Visa */}
      <span className="inline-flex h-7 items-center rounded-md bg-white px-2 shadow-sm">
        <svg viewBox="0 0 48 16" className="h-3.5" role="img" aria-label="Visa">
          <text
            x="0"
            y="13"
            fontFamily="Arial, sans-serif"
            fontSize="15"
            fontStyle="italic"
            fontWeight="700"
            fill="#1A1F71"
          >
            VISA
          </text>
        </svg>
      </span>

      {/* Mastercard */}
      <span className="inline-flex h-7 items-center gap-1 rounded-md bg-white px-2 shadow-sm">
        <svg viewBox="0 0 36 22" className="h-4" role="img" aria-label="Mastercard">
          <circle cx="13" cy="11" r="10" fill="#EB001B" />
          <circle cx="23" cy="11" r="10" fill="#F79E1B" />
          <path
            d="M18 3.2a10 10 0 0 0 0 15.6 10 10 0 0 0 0-15.6z"
            fill="#FF5F00"
          />
        </svg>
      </span>

      {/* iyzico ile Öde */}
      <span className="inline-flex h-7 items-center rounded-md bg-white px-2.5 shadow-sm">
        <span className="text-[13px] font-extrabold tracking-tight text-[#1e64ff]">
          iyzico
        </span>
        <span className="ml-1 text-[11px] font-medium text-neutral-500">
          ile Öde
        </span>
      </span>
    </div>
  );
}
