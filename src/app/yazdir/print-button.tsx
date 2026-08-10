"use client";

import { useState } from "react";

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

/** Deneme sürümü: menü görünür ama yazdırma/PDF kilitli — tıklayınca uyarı. */
export function LockedPrintButton() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
      >
        🔒 Yazdır / PDF olarak kaydet
      </button>

      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setShow(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center text-neutral-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl">🔒</div>
            <h2 className="mt-3 text-lg font-bold">Yazdırma ücretli pakete özeldir</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Menüyü önizleyebilirsiniz ancak deneme sürümünde yazdıramaz veya PDF
              olarak kaydedemezsiniz. Lütfen üretici ile görüşerek paketinizi yükseltin.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <a
                href="/dashboard/abonelik"
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Paketi yükselt
              </a>
              <button
                onClick={() => setShow(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
