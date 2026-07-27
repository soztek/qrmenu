# Söztek QR Menü — Proje Hafızası

> Bu dosya projenin tüm kararlarını, durumunu ve nasıl çalıştırılacağını tutar.
> Yeni bir oturuma başlarken önce bunu oku.

**Son güncelleme:** 2026-07-27

---

## 1. Proje nedir?

Türkiye geneli **tüm işletmelere** yönelik QR menü **SaaS** platformu. İşletmeler
kayıt olur, kendi dijital menülerini oluşturur, QR üretir; müşteriler QR'ı
telefondan okutup mobil menüyü görür ve (pakete göre) sipariş verir.

- **Domain:** https://www.soztekqrmenu.com.tr
- **Hosting:** Vercel
- **Marka teması:** siyah zemin + yeşil (ana aksiyon) + turuncu (vurgu/CTA)

---

## 2. Roller

| Rol | Ne yapar |
|-----|----------|
| **Süper Admin (biz)** | Kayıtlı işletmeler, abonelikler, gelir, deneme durumları (Faz 7) |
| **İşletme (üye)** | Kayıt → 7 gün deneme → menü/kategori/ürün+foto → QR → pakete göre sipariş/masa/dil |
| **Müşteri** | QR okut → mobil menü → sipariş (ödeme YOK, işletme manuel alır) |

**Para akışı:** Sadece İşletme ↔ Platform aboneliği. Müşteri ↔ İşletme ödemesi yok.

---

## 3. Teknoloji yığını

- **Next.js 16.2** (App Router, Turbopack, React 19.2)
- **Prisma 7.9** + PostgreSQL (driver adapter: `@prisma/adapter-pg` + `pg`)
- **Tailwind v4** (tema `@theme` token'ları ile)
- **Auth:** kendi çözümü (NextAuth yok) — e-posta/şifre, bcrypt, DB session + httpOnly cookie
- **Ödeme:** iyzico (abonelik) — *Faz 4'te*
- **QR:** `qrcode` paketi

### Next.js 16 tuzakları (ÖNEMLİ)
- `params`, `searchParams`, `cookies()`, `headers()` **async** (Promise) → `await` et.
- `middleware.ts` yerine **`proxy.ts`** (fonksiyon adı `proxy`, nodejs runtime).

### Prisma 7 tuzakları
- Client `src/generated/prisma`'ya üretilir (gitignore'da). Import: `@/generated/prisma/client`.
- **Driver adapter zorunlu** (Rust engine yok). Bkz `src/lib/db.ts`.
- DB url `prisma.config.ts` içinde `dotenv` ile yüklenir (`.env` Prisma tarafından otomatik okunmaz).

---

## 4. Abonelik paketleri (fiyatlar TASLAK)

Tek kaynak: `src/lib/plans.ts`. Hepsinde **7 gün ücretsiz deneme** (kart gerekmez).

| Paket | Fiyat | Özellikler |
|-------|-------|-----------|
| **Başlangıç** | ₺199/ay | QR menü, kategori/ürün, fotoğraf, QR üretimi, mobil menü |
| **Pro** | ₺399/ay | + Sipariş alma + mutfak paneli |
| **Premium** | ₺699/ay | + Masa yönetimi + Çoklu dil |

Özellik kilitleri (`Feature`): `qr_menu`, `orders`, `tables`, `multi_language`.
Gating: `planHasFeature(plan, feature)`.

---

## 5. Yol haritası / durum

1. ✅ **İskelet + tema + landing** (BİTTİ)
2. ✅ **Kayıt & Auth + 7 gün deneme** (BİTTİ)
3. ✅ **Menü kurucu + QR + mobil menü** (BİTTİ)
4. ⏳ **Abonelik + iyzico + paket kilitleme** (sıradaki)
5. ⏳ Sipariş + mutfak paneli (Pro)
6. ⏳ Masa yönetimi + çoklu dil (Premium)
7. ⏳ Süper admin paneli

> **Not:** Canlıya alma (Neon + Vercel + GitHub) da bekliyor; kullanıcı Faz 3'ü
> önce bitirmek istedi. Hesaplar (GitHub + Vercel) hazır.

---

## 6. Dosya haritası

```
src/
  app/
    layout.tsx              Kök layout (tr, SEO meta, fontlar)
    globals.css             Marka teması (Tailwind v4 @theme token'ları)
    page.tsx                Landing (hero, özellikler, paketler, CTA)
    (auth)/
      layout.tsx            Auth sayfaları ortak merkezli layout
      kayit/                Kayıt sayfası + form (register-form.tsx)
      giris/                Giriş sayfası + form (login-form.tsx)
    dashboard/
      layout.tsx            Panel: guard + kenar çubuğu + mobil bar + deneme bandı
      page.tsx              Genel bakış
      menu/                 Menü kurucu (page + menu-client + photo-upload)
      qr/                   QR kod (page + qr-actions)
    m/[slug]/               Herkese açık mobil menü (+ not-found)
    api/upload/route.ts     Fotoğraf yükleme endpoint'i
  components/form.tsx       Ortak Field + FormError
  lib/
    db.ts                   Prisma client singleton (driver adapter)
    auth.ts                 hashPassword/verifyPassword/createSession/getCurrentUser
    plans.ts                Paketler (tek kaynak)
    subscription.ts         trialDaysLeft/hasActiveAccess/statusLabel
    slug.ts                 slugify + uniqueBusinessSlug (TR karakter)
    storage.ts              saveUpload/deleteUpload (⚠️ Vercel'de Blob'a çevir)
    url.ts                  appUrl/menuUrl/formatTL
    actions/
      auth.ts               register/login/logout server action'ları
      menu.ts               kategori/ürün CRUD server action'ları
  proxy.ts                  /dashboard koruması (cookie kontrolü)
prisma/schema.prisma        Şema
```

### Veri modeli (özet)
`User` (email/passwordHash/role) 1—1 `Business` (slug, plan, subscriptionStatus,
trialEndsAt). `Business` → `Category` → `MenuItem` (Decimal price, photoUrl,
isAvailable). `RestaurantTable` (qrToken, Premium). `Session` (token, expiresAt).

---

## 7. Nasıl çalıştırılır (yerel)

**Node PATH'te değil** — her terminal oturumunda önce:
```bash
export PATH="/c/Program Files/nodejs:$PATH"
```

**Postgres'i başlat** (Windows servisi DEĞİL, elle başlatılır):
```bash
& "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D "C:\Users\Olgun Ersin\pgdata-qrmenu" -o "-p 5432" -l "C:\Users\Olgun Ersin\pgdata-qrmenu\server.log" start
```
DB: `qrmenu`, kullanıcı/şifre `postgres`/`postgres`, port 5432.

**Geliştirme sunucusu:**
```bash
npm run dev          # http://localhost:3000 (Turbopack)
```

**Şema değişince:**
```bash
npx prisma db push   # + npx prisma generate
```

**Build kontrolü:**
```bash
npm run build
```

### Test hesabı
- E-posta: `ahmet@kosekafe.com`
- Şifre: `test1234`
- İşletme: Köşe Kafe, slug `kose-kafe`, Başlangıç paketi, deneme
- Menü: http://localhost:3000/m/kose-kafe

---

## 8. Canlıya alma planı (Vercel)

1. Git init + GitHub'a push
2. **Neon**'da bulut Postgres → production `DATABASE_URL`
3. Vercel projesi + repo bağla
4. Vercel env: `DATABASE_URL`, `AUTH_SECRET` (güçlü rastgele), `NEXT_PUBLIC_APP_URL=https://www.soztekqrmenu.com.tr`
5. Build'de `prisma generate` çalıştığından emin ol
6. `prisma db push` yerine **migration**'a geç (`prisma migrate deploy`)
7. **Fotoğraf yükleme → Vercel Blob** (`src/lib/storage.ts` değiştir; public/uploads Vercel'de kalıcı değil)
8. Domain `www.soztekqrmenu.com.tr` bağla + DNS

---

## 9. Önemli notlar

- `.env` gerçek sırları içerir, git'e girmez. Örnek için `NEXT_PUBLIC_APP_URL`,
  `DATABASE_URL`, `AUTH_SECRET` gerekli.
- Fotoğraflar yerelde `public/uploads` (gitignore'da). Prod'da Blob şart.
- Cookie prod'da otomatik `secure` olur.
- Yedekler: `../qrmenu-backup-*.zip` (eski sürüm), `../qrmenu.zip` (ilk kaynak).
