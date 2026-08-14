# Söztek QR Menü — Rekabet Analizi ve Ürün Backlog'u

_Benchmark: promenu.com.tr (yalnızca bilgi mimarisi, satış yaklaşımı ve ürün kanıtı açısından; hiçbir metin/görsel/kod kopyalanmadı)._
_Tarih: 2026-08-14 · Hazırlayan: geliştirme oturumu_

## 1. Konumlandırma

Söztek QR Menü artık "sadece QR menü" değil:

> **"QR menüden siparişe, mutfaktan masaya tüm restoran operasyonunu tek panelden yöneten sistem."**

Rakip (Promenu) daha çok menü + AI özelliklerine yaslanıyor. Söztek'in **gerçek ve kodda doğrulanmış** farklılaştırıcıları: canlı **mutfak paneli**, **masa yönetimi + masaya özel QR**, **sipariş durumu takibi**, **yasal uyumluluk alanları** (14 alerjen, kalori, et türü, hassas içerik) ve **kurumsal firma güvencesi** (Söztek Bilgisayar, açık ünvan/vergi bilgisi, iyzico, WhatsApp destek).

## 2. Kodda doğrulanmış mevcut özellikler (ana sayfada öne çıkarılabilir)

| Özellik | Kaynak (kod) |
|---|---|
| QR menü + QR üretimi | `app/qr`, `app/m/[slug]` |
| Sınırsız kategori/ürün + fotoğraf | `MenuItem`, `Category` modelleri |
| Anlık fiyat/stok güncelleme | `MenuItem.price/stockQty/stockStatus` |
| Ürün gizle/göster | `MenuItem.isAvailable/isOrderable` |
| Masadan sipariş | `app/m/[slug]/order-view.tsx`, `lib/orders` |
| Canlı mutfak paneli | `app/dashboard/mutfak` |
| Sipariş durumu takibi | `OrderStatus`, `order-view` polling |
| Masa yönetimi + masaya özel QR | `RestaurantTable`, `app/qr-yazdir?mode=tables` |
| Çoklu dil (menü) | Premium `multi_language` feature |
| 14 alerjen / kalori / besin / et türü / hassas içerik | `MenuItem` alanları, `lib/compliance.ts` |
| Yazdırılabilir PDF/fiziki menü | `app/yazdir` |
| **7 menü teması** | `lib/themes.ts` (dark/corporate/luxury/organic/warm/tropical/berry) |
| **Yıllık ödeme (~2 ay bedava)** | `lib/paytr.ts priceForTL` (yıllık = aylık×10) |
| iyzico güvenli ödeme | `lib/iyzico.ts`, callback route'ları |
| 7 gün ücretsiz deneme / kart gerekmez | `registerAction`, `TRIAL_DAYS` |
| E-posta bildirimleri (ödeme/hoş geldin/deneme hatırlatma) | `lib/email.ts` |

> Bu tablodaki maddeler ana sayfada iddia olarak kullanılabilir. **Tabloda olmayan hiçbir şey** satış metnine eklenmemeli.

## 3. Rakipte olup Söztek'te OLMAYAN özellikler (backlog)

Aşağıdakiler ana sayfaya "varmış gibi" **eklenmedi**. Kodda yoklar; öncelik ve değerle backlog:

| # | Özellik | İş değeri | Teknik zorluk | Öneri önceliği |
|---|---|---|---|---|
| 1 | Excel/CSV ile toplu ürün yükleme | Yüksek (kurulum sürtünmesini azaltır, satış kapatır) | Orta (parser + eşleme + doğrulama) | **P1** |
| 2 | Sürükle-bırak ürün/kategori sıralama | Yüksek (günlük kullanım konforu) | Orta (dnd + sortOrder yazımı) | **P1** |
| 3 | Toplu fiyat güncelleme (% zam / toplu) | Yüksek | Düşük-Orta | **P1** |
| 4 | Garson çağırma / hesap iste | Orta-Yüksek (kısmen `ServiceRequest` modeli var, UI tam değil) | Düşük (model mevcut) | **P1** |
| 5 | Ürün varyantları + varyant şablonları | Yüksek (`ModifierGroup/Option` altyapısı kısmen var) | Orta | **P2** |
| 6 | PWA + anlık sipariş bildirimi (push) | Orta-Yüksek | Orta-Yüksek (service worker, web push) | **P2** |
| 7 | Çoklu şube yönetimi | Orta (kurumsal müşteri için) | Yüksek (`branchId` alanları var, izolasyon+rol gerek) | **P2** |
| 8 | Google değerlendirme yönlendirme | Orta (itibar yönetimi) | Düşük | **P2** |
| 9 | Müşteri öneri/şikâyet sistemi | Orta | Düşük-Orta | **P3** |
| 10 | Kampanya/duyuru popup'ları | Düşük-Orta | Düşük | **P3** |
| 11 | Kağıt menüden OCR ile ürün aktarımı | Orta (kurulumu hızlandırır) | Yüksek (OCR + eşleme + insan onayı) | **P3** |
| 12 | Linkten menü aktarımı | Düşük-Orta | Yüksek | **P3** |

### Yapay zekâ özellikleri (rakip vurgusu) — ayrı değerlendirme

| # | Özellik | Not |
|---|---|---|
| 13 | AI ürün açıklaması üretme | Altyapı var (`@anthropic-ai/sdk`, `@google/genai` bağımlılıkları). Uygulanabilir. **P2** |
| 14 | AI menü çevirisi | Çoklu dil menü altyapısıyla birleştirilebilir. **P2** |
| 15 | AI kalori/alerjen önerisi | `lib/nutrition.ts` var (tahmin). **Kritik uyarı:** AI ile üretilen kalori/içerik/alerjen bilgisi **insan onayı olmadan yayınlanmamalı** — yanlış beyan yasal risk doğurur. Öneri: "AI taslak üretir → işletme onaylar → yayınlanır" akışı. **P2** |
| 16 | AI ürün görseli iyileştirme | `@google/genai` ile mümkün. **P3** |

> **İlke:** AI çıktıları (özellikle besin/alerjen) her zaman "taslak" olarak sunulmalı ve işletmenin açık onayı olmadan menüde yayınlanmamalı. Bu, hem yasal uyumluluk hem marka güveni için zorunludur.

## 4. Ana sayfa / dönüşüm eksikleri (bu turda ele alınıyor veya öneriliyor)

| Konu | Durum |
|---|---|
| Nav'da Canlı Demo / Referanslar / SSS | Eksik → eklenecek (Referanslar izinli müşteri yoksa gizli) |
| Güven şeridi (Söztek/iyzico/WhatsApp/deneme) | Eksik → eklenecek |
| Problem→Çözüm kartları | Eksik → eklenecek |
| Özelliklerin gruplanması (4 grup) | Tek liste → gruplanacak |
| Tema vitrini ("Markanıza uysun") | Yok ama 7 tema **gerçek** → eklenebilir |
| Paket karşılaştırma tablosu + yıllık fiyat | Yok; yıllık ödeme **gerçek** → eklenecek |
| SSS accordion + FAQPage şeması | Eksik → eklenecek |
| Canlı demo bölümü | **Karar gerekiyor** (aşağıda) |
| Gerçek ürün ekran görüntüleri (mutfak/masa/panel) | **Asset gerekiyor** (aşağıda) |
| Organization / Product-Offer / FAQPage şeması, canonical, OG görsel | Eksik → eklenecek |
| Global 404 sayfası | Eksik → eklenecek |

## 5. Karar / asset gerektiren konular (ticari veya içerik)

1. **Canlı demo menü:** Ana sayfada "Canlı Demo" bağlantısı için yayında gerçek bir işletme menüsü (`/m/<slug>`) gerekiyor. Seçenekler:
   - (a) İzin verilen gerçek bir müşteri menüsüne bağlan,
   - (b) Örnek fixture verisiyle **salt okunur** demo menü sayfası oluştur (sipariş gerçek mutfağa düşmez, "Demo" etiketli).
   - _Not:_ Arama motorunda geçtiği belirtilen `/m/deneme-deneme` üretimde kontrol edilmeli; geçerli yeni demo varsa 301 yönlendirme kurulmalı.
2. **Gerçek ekran görüntüleri:** "Ürünü iş başında göster" bölümü için mutfak paneli / masa yönetimi / yönetim paneli ekran görüntüleri gerekiyor. Elde yoksa uydurma arayüz **kullanılmayacak**; mevcut mobil menü önizlemesiyle sınırlı kalınacak.
3. **Referanslar:** İzinli gerçek müşteri (logo + izin) yoksa bölüm **veri yapısı hazır ama gizli** bırakılacak; sahte logo/yorum üretilmeyecek.
4. **Fiyat/paket:** 249/449/749 TL fiyatları ve yıllık çarpanı **ticari onay olmadan değiştirilmeyecek**. Yıllık "2 ay bedava" ifadesi `priceForTL` (aylık×10) ile **doğru**, kullanılabilir.
5. **hreflang:** Çoklu dil ana sayfada **client-side** (localStorage) çalışıyor; her dilin ayrı URL'i yok. Bu nedenle hreflang **eklenmiyor** (yanlış sinyal olur). Ayrı dil URL'leri istenirse ayrı iş kalemi.

## 6. Özet öneri

- **Kısa vade (ana sayfa):** güven şeridi, problem/çözüm, özellik gruplama, tema vitrini, paket karşılaştırma + yıllık fiyat, SSS + şema, SEO/404. (Hepsi mevcut gerçek özelliklerle.)
- **Orta vade (ürün):** P1 backlog — toplu ürün yükleme, sürükle-bırak sıralama, toplu fiyat güncelleme, garson çağırma UI.
- **AI:** insan-onaylı taslak modeliyle açıklama/çeviri; besin/alerjende asla otomatik yayın yok.
