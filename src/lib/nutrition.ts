// Yerleşik besin değeri tablosu — yaygın Türk mutfağı ürünleri.
// Değerler TİPİK BİR PORSİYON için YAKLAŞIKTIR; tarife/porsiyona göre değişir.
// Amaç: ürün adı girildiğinde kalori + makro için hızlı bir TAHMİN sunmak.
// İşletme değeri her zaman elle düzeltebilir (mevzuat: yanıltıcı olmamalı).

export type Nutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type Entry = Nutrition & { key: string };

/** Türkçe metni sadeleştirir: küçük harf + aksan/işaret temizliği. */
function norm(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replaceAll("ç", "c")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("i̇", "i")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const e = (
  key: string,
  calories: number,
  protein: number,
  fat: number,
  carbs: number,
): Entry => ({ key, calories, protein, fat, carbs });

// Anahtarlar zaten sadeleştirilmiş (aksansız) yazılır.
const TABLE: Entry[] = [
  // ── Çorbalar ──
  e("mercimek corbasi", 150, 8, 4, 22),
  e("ezogelin", 160, 8, 4, 24),
  e("yayla corbasi", 140, 6, 6, 16),
  e("domates corbasi", 130, 4, 5, 18),
  e("tavuk corbasi", 120, 9, 3, 12),
  e("tavuk suyu", 120, 9, 3, 12),
  e("iskembe", 180, 12, 10, 8),
  e("tarhana", 130, 5, 3, 20),
  e("dugun corbasi", 200, 9, 12, 14),
  e("kelle paca", 210, 15, 14, 4),
  e("brokoli corbasi", 120, 5, 6, 12),
  // ── Bakliyat / ev yemekleri ──
  e("kuru fasulye", 340, 18, 10, 45),
  e("etli nohut", 340, 18, 9, 44),
  e("nohut", 320, 15, 7, 44),
  e("barbunya", 320, 16, 8, 45),
  e("karniyarik", 380, 16, 24, 24),
  e("patlican musakka", 350, 14, 22, 22),
  e("musakka", 350, 14, 22, 22),
  e("etli biber dolma", 300, 12, 16, 26),
  e("biber dolma", 280, 8, 12, 28),
  e("etli yaprak sarma", 320, 12, 16, 30),
  e("zeytinyagli sarma", 250, 5, 12, 30),
  e("yaprak sarma", 260, 6, 12, 30),
  e("dolma", 280, 8, 12, 30),
  e("sarma", 260, 6, 12, 30),
  e("turlu", 220, 7, 10, 26),
  e("kabak dolma", 260, 9, 12, 28),
  // ── Et / kebap ──
  e("izgara kofte", 290, 24, 20, 4),
  e("tekirdag kofte", 300, 24, 21, 5),
  e("kofte", 280, 22, 19, 6),
  e("et doner", 400, 28, 28, 8),
  e("tavuk doner", 350, 30, 18, 12),
  e("doner", 400, 27, 26, 12),
  e("iskender", 650, 35, 38, 40),
  e("adana kebap", 480, 30, 36, 6),
  e("urfa kebap", 460, 30, 34, 6),
  e("beyti", 520, 32, 34, 20),
  e("kebap", 460, 30, 32, 8),
  e("tavuk sis", 320, 34, 16, 6),
  e("et sis", 380, 32, 26, 4),
  e("pirzola", 450, 32, 34, 2),
  e("tavuk pirzola", 320, 30, 18, 6),
  e("tavuk kanat", 360, 26, 26, 4),
  e("kanat", 360, 26, 26, 4),
  e("tavuk sote", 300, 28, 14, 12),
  e("et sote", 360, 30, 22, 10),
  e("et guvec", 380, 26, 22, 18),
  e("guvec", 360, 22, 20, 20),
  e("tas kebabi", 360, 28, 20, 16),
  e("hunkar begendi", 480, 26, 30, 24),
  e("kuzu tandir", 520, 34, 40, 2),
  e("kuzu incik", 550, 36, 42, 4),
  e("kokorec", 380, 20, 28, 8),
  e("cig kofte", 180, 5, 3, 34),
  e("icli kofte", 300, 12, 16, 26),
  // ── Hamur işi / pide / makarna ──
  e("manti", 480, 18, 18, 60),
  e("lahmacun", 300, 14, 10, 38),
  e("kiymali pide", 520, 22, 22, 55),
  e("kasarli pide", 560, 22, 26, 58),
  e("kusbasili pide", 540, 24, 24, 55),
  e("karisik pide", 560, 24, 26, 56),
  e("pide", 520, 22, 24, 55),
  e("makarna", 350, 12, 8, 58),
  e("spagetti", 380, 13, 10, 60),
  e("penne", 360, 12, 9, 58),
  // ── Pilav / garnitür ──
  e("nohutlu pilav", 300, 9, 7, 50),
  e("sehriyeli pilav", 260, 6, 7, 45),
  e("ic pilav", 320, 8, 12, 46),
  e("bulgur pilavi", 220, 6, 5, 40),
  e("pirinc pilavi", 250, 5, 6, 45),
  e("pilav", 250, 5, 6, 45),
  e("patates kizartmasi", 320, 4, 17, 40),
  e("patates puresi", 220, 4, 10, 28),
  // ── Deniz ──
  e("levrek", 250, 34, 12, 0),
  e("cipura", 260, 34, 13, 0),
  e("somon", 320, 34, 20, 0),
  e("hamsi tava", 380, 22, 28, 10),
  e("kalamar", 320, 20, 18, 20),
  e("midye dolma", 220, 7, 6, 34),
  e("midye tava", 340, 16, 18, 28),
  e("karides", 240, 26, 10, 8),
  e("balik ekmek", 380, 24, 14, 40),
  // ── Kahvaltı / börek ──
  e("menemen", 250, 12, 18, 8),
  e("sucuklu yumurta", 340, 18, 28, 3),
  e("omlet", 220, 14, 17, 2),
  e("bal kaymak", 320, 6, 26, 18),
  e("kaymak", 300, 5, 26, 12),
  e("sigara boregi", 300, 9, 16, 30),
  e("su boregi", 350, 12, 18, 34),
  e("kol boregi", 340, 11, 18, 34),
  e("borek", 320, 10, 16, 32),
  e("gozleme", 350, 12, 14, 44),
  e("pogaca", 260, 6, 12, 32),
  e("acma", 300, 7, 12, 40),
  e("simit", 270, 8, 3, 52),
  // ── Salata / meze ──
  e("coban salata", 90, 2, 5, 9),
  e("mevsim salata", 80, 2, 4, 9),
  e("gavurdagi", 160, 4, 12, 10),
  e("sezar salata", 320, 14, 22, 14),
  e("mercimek koftesi", 180, 6, 5, 28),
  e("humus", 220, 7, 12, 20),
  e("haydari", 150, 6, 12, 4),
  e("ezme", 90, 2, 5, 10),
  e("kisir", 200, 5, 6, 32),
  e("patlican salatasi", 170, 3, 13, 12),
  e("rus salatasi", 220, 3, 16, 16),
  e("salata", 90, 2, 5, 9),
  // ── Tatlılar ──
  e("fistikli baklava", 350, 6, 20, 36),
  e("baklava", 330, 5, 18, 38),
  e("kunefe", 450, 9, 22, 52),
  e("sutlac", 220, 6, 5, 38),
  e("kazandibi", 240, 6, 6, 40),
  e("tavuk gogsu", 230, 7, 5, 38),
  e("revani", 320, 4, 10, 54),
  e("sekerpare", 300, 4, 10, 50),
  e("kadayif", 340, 5, 16, 46),
  e("katmer", 480, 10, 26, 50),
  e("trilece", 340, 6, 16, 42),
  e("profiterol", 380, 6, 22, 40),
  e("magnolia", 300, 5, 12, 42),
  e("cheesecake", 380, 7, 24, 34),
  e("brownie", 400, 5, 20, 50),
  e("waffle", 450, 8, 18, 62),
  e("kabak tatlisi", 250, 3, 6, 46),
  e("ekmek kadayifi", 380, 6, 14, 58),
  e("irmik helvasi", 320, 5, 12, 48),
  e("dondurma", 210, 4, 11, 24),
  // ── Fast food ──
  e("cheeseburger", 560, 28, 32, 40),
  e("hamburger", 500, 25, 26, 40),
  e("tavuk burger", 480, 26, 22, 44),
  e("burger", 500, 25, 26, 40),
  e("sucuklu tost", 400, 18, 24, 30),
  e("kasarli tost", 340, 14, 18, 30),
  e("karisik tost", 420, 19, 25, 31),
  e("tost", 300, 12, 14, 30),
  e("kumpir", 550, 14, 24, 68),
  e("sandvic", 350, 15, 14, 40),
  e("tavuk nugget", 300, 16, 18, 18),
  e("nugget", 300, 16, 18, 18),
  e("pizza", 285, 12, 10, 36),
  // ── İçecekler ──
  e("ayran", 90, 5, 5, 6),
  e("turk kahvesi", 10, 0, 0, 2),
  e("filtre kahve", 5, 0, 0, 1),
  e("americano", 10, 0, 0, 2),
  e("espresso", 5, 0, 0, 1),
  e("latte", 130, 7, 5, 13),
  e("cappuccino", 110, 6, 5, 11),
  e("sicak cikolata", 240, 8, 9, 32),
  e("sahlep", 200, 6, 6, 32),
  e("salep", 200, 6, 6, 32),
  e("milkshake", 350, 8, 12, 52),
  e("smoothie", 180, 3, 3, 36),
  e("limonata", 110, 0, 0, 27),
  e("meyve suyu", 120, 0, 0, 29),
  e("kola", 140, 0, 0, 35),
  e("cola", 140, 0, 0, 35),
  e("gazoz", 130, 0, 0, 33),
  e("salgam", 25, 1, 0, 5),
  e("boza", 160, 2, 0, 36),
  e("cay", 2, 0, 0, 0),
  e("soda", 0, 0, 0, 0),
  e("maden suyu", 0, 0, 0, 0),
  e("su", 0, 0, 0, 0),
];

/**
 * Ürün adına en iyi eşleşen tahmini besin değerini döndürür.
 * Tam kelime öbeği eşleşmesi arar; birden çok eşleşmede EN UZUN (en özel) anahtarı seçer.
 * Örn. "Tavuk Döner Dürüm" → "tavuk doner" (jenerik "doner"e tercih edilir).
 */
export function lookupNutrition(name: string): Nutrition | null {
  const n = ` ${norm(name)} `;
  if (n.trim().length < 2) return null;
  let best: Entry | null = null;
  for (const t of TABLE) {
    if (n.includes(` ${t.key} `) && (!best || t.key.length > best.key.length)) {
      best = t;
    }
  }
  if (!best) return null;
  return {
    calories: best.calories,
    protein: best.protein,
    fat: best.fat,
    carbs: best.carbs,
  };
}
