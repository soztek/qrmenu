"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
    >
      🖨 Yazdır / PDF olarak kaydet
    </button>
  );
}
