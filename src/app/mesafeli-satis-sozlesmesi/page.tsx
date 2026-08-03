import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { COMPANY } from "@/lib/company";
import { PLANS, formatPrice } from "@/lib/plans";

export const metadata: Metadata = { title: "Mesafeli Satış Sözleşmesi" };

export default function MesafeliSatisPage() {
  return (
    <LegalPage title="Mesafeli Satış Sözleşmesi" updated="2026">
      <h2>1. Taraflar</h2>
      <p>
        <strong>SATICI:</strong> {COMPANY.legalName}
        <br />
        Adres: {COMPANY.address}
        <br />
        Vergi Dairesi / No: {COMPANY.taxOffice} · {COMPANY.taxNumber}
        <br />
        Telefon: {COMPANY.phone} · {COMPANY.gsm}
        <br />
        E-posta: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </p>
      <p>
        <strong>ALICI (ÜYE İŞLETME):</strong> Söztek QR Menü&apos;ye üye olan ve
        abonelik satın alan gerçek/tüzel kişi. Alıcının üyelik sırasında beyan ettiği
        bilgiler bu sözleşmenin ekidir.
      </p>

      <h2>2. Konu</h2>
      <p>
        İşbu sözleşmenin konusu, Alıcı&apos;nın Söztek QR Menü web sitesi üzerinden
        elektronik ortamda sipariş verdiği, aşağıda nitelikleri ve bedeli belirtilen
        dijital abonelik hizmetinin satışı ve ifası ile tarafların 6502 sayılı
        Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
        uyarınca hak ve yükümlülüklerinin belirlenmesidir.
      </p>

      <h2>3. Hizmet ve bedeli</h2>
      <p>
        Hizmet, işletmelere yönelik dijital QR menü (Söztek QR Menü) abonelik
        hizmetidir. Güncel paketler ve aylık bedelleri:
      </p>
      <ul className="ml-4 list-disc space-y-1">
        {PLANS.map((p) => (
          <li key={p.id}>
            <strong>{p.name}:</strong> {formatPrice(p.priceMonthly)} / ay (yıllık
            seçenekte {formatPrice(p.priceMonthly * 10)}). {p.tagline}.
          </li>
        ))}
      </ul>
      <p>
        Fiyatlara KDV dahildir/uygulanabilir mevzuata göre yansıtılır. Satıcı,
        gelecekteki dönemler için fiyatları güncelleme hakkını saklı tutar; güncel
        fiyat sipariş anında geçerlidir.
      </p>

      <h2>4. Ödeme</h2>
      <p>
        Ödeme, kredi kartı / banka kartı ile <strong>iyzico</strong> güvenli ödeme
        altyapısı üzerinden tek seferlik olarak (aylık veya yıllık dönem için)
        alınır. Kart bilgileri Satıcı tarafından saklanmaz.
      </p>

      <h2>5. Teslimat / ifa</h2>
      <p>
        Hizmet dijitaldir; fiziksel teslimat yoktur. Ödeme onaylandığında ilgili
        paket <strong>anında</strong> aktif olur ve erişim süresi (aylık/yıllık)
        başlar. Yeni üyeler ayrıca <strong>7 gün ücretsiz deneme</strong> ile
        başlayabilir.
      </p>

      <h2>6. Cayma hakkı</h2>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca, tüketicinin onayı ile ifasına
        başlanan ve anında ifa edilen dijital içerik/hizmetlerde cayma hakkı
        kullanılamaz. Bununla birlikte, Alıcı 7 günlük ücretsiz deneme süresinde
        herhangi bir ücret ödemeden hizmeti değerlendirebilir ve dilediği zaman
        aboneliğini iptal edebilir (bkz. Teslimat ve İade Şartları).
      </p>

      <h2>7. Genel hükümler</h2>
      <p>
        Alıcı, hizmeti hukuka ve genel ahlaka uygun kullanmayı kabul eder. Satıcı,
        teknik bakım ve zorunlu hallerde hizmete geçici ara verebilir. İşbu sözleşme
        elektronik ortamda onaylanarak yürürlüğe girer.
      </p>

      <h2>8. Uyuşmazlıklar</h2>
      <p>
        Uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca ilan edilen parasal sınırlar
        dahilinde Tüketici Hakem Heyetleri, aşan hallerde Tüketici Mahkemeleri
        yetkilidir.
      </p>

      <h2>9. İletişim</h2>
      <p>
        {COMPANY.legalName} · {COMPANY.phone} · {COMPANY.gsm} ·{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </p>
    </LegalPage>
  );
}
