"use client";

import { useState } from "react";

/**
 * İşletmeler tablosunu istemci tarafında, yazdıkça anlık filtreler.
 * En az 3 harf girilince satırlar `data-search` niteliğine göre süzülür.
 */
export function BusinessFilter({ total }: { total: number }) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);

  function apply(value: string) {
    setQ(value);
    const term = value.trim().toLocaleLowerCase("tr");
    const active = term.length >= 3;
    const rows =
      document.querySelectorAll<HTMLTableRowElement>("tr[data-search]");
    let n = 0;
    rows.forEach((tr) => {
      const show = !active || (tr.dataset.search ?? "").includes(term);
      tr.style.display = show ? "" : "none";
      if (show) n++;
    });
    setShown(active ? n : total);

    const empty = document.getElementById("no-results-row");
    if (empty) empty.style.display = active && n === 0 ? "" : "none";
  }

  const active = q.trim().length >= 3;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => apply(e.target.value)}
          placeholder="İşletme adı, /m slug veya e-posta (en az 3 harf)…"
          className="w-full max-w-sm rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none placeholder:text-faint focus:border-green focus:ring-2 focus:ring-green/20"
        />
        {q && (
          <button
            onClick={() => apply("")}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:border-green/50 hover:text-fg"
          >
            Temizle
          </button>
        )}
      </div>
      {active && (
        <p className="mt-1 text-xs text-faint">
          {shown} işletme gösteriliyor
        </p>
      )}
      {q.trim().length > 0 && q.trim().length < 3 && (
        <p className="mt-1 text-xs text-faint">
          Filtrelemek için en az 3 harf girin…
        </p>
      )}
    </div>
  );
}
