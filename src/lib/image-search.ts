import "server-only";

export interface StockImage {
  thumb: string; // küçük önizleme
  full: string; // indirilecek tam görsel
  source: string;
}

/**
 * Ürün adına göre ücretsiz/telifsiz görsel arar.
 * - PEXELS_API_KEY varsa Pexels (kaliteli, atıfsız, ücretsiz).
 * - Yoksa Openverse (anahtarsız), yalnız kamu malı / CC0 (atıf gerekmez).
 */
export async function searchStockImages(query: string): Promise<StockImage[]> {
  const q = query.trim();
  if (!q) return [];

  const pexelsKey = process.env.PEXELS_API_KEY;
  try {
    if (pexelsKey) return await searchPexels(q, pexelsKey);
    return await searchOpenverse(q);
  } catch {
    return [];
  }
}

async function searchPexels(q: string, key: string): Promise<StockImage[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    q + " food",
  )}&per_page=9&orientation=square`;
  const res = await fetch(url, {
    headers: { Authorization: key },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    photos?: { src?: { medium?: string; large?: string } }[];
  };
  return (data.photos ?? [])
    .map((p) => ({
      thumb: p.src?.medium ?? "",
      full: p.src?.large ?? p.src?.medium ?? "",
      source: "pexels",
    }))
    .filter((i) => i.full);
}

async function searchOpenverse(q: string): Promise<StockImage[]> {
  // Yalnız kamu malı / CC0 → atıf gerekmez, ticari kullanım serbest.
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
    q,
  )}&license=cc0,pdm&page_size=12&mature=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SoztekQRMenu/1.0" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results?: { thumbnail?: string; url?: string }[];
  };
  return (data.results ?? [])
    .map((r) => ({
      thumb: r.thumbnail ?? r.url ?? "",
      full: r.url ?? r.thumbnail ?? "",
      source: "openverse",
    }))
    .filter((i) => i.full)
    .slice(0, 9);
}
