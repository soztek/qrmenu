"use client";

/**
 * Kategori seçtirip o kategoriyi yazdırılabilir PDF olarak yeni sekmede açar.
 * Tüm menü PDF'i /yazdir; tek kategori /yazdir?cat=<id>.
 */
export function CategoryPdfSelect({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  if (categories.length === 0) return null;
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const id = e.target.value;
        e.target.value = "";
        if (id) window.open(`/yazdir?cat=${id}`, "_blank", "noopener");
      }}
      title="Bir kategoriyi PDF olarak yazdır"
      className="max-w-[180px] cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm text-fg outline-none transition hover:border-green/50"
    >
      <option value="" disabled>
        Kategori PDF…
      </option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
