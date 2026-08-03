import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Gizlilik Sözleşmesi" };

export default function GizlilikPage() {
  return (
    <LegalPage title="Gizlilik ve Kişisel Verilerin Korunması" updated="2026">
      <p>
        {COMPANY.legalName} (&ldquo;Şirket&rdquo;, &ldquo;biz&rdquo;) olarak Söztek
        QR Menü hizmeti kapsamında kişisel verilerinizin gizliliğine önem veriyoruz.
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca
        hangi verileri, hangi amaçla işlediğimizi açıklar.
      </p>

      <h2>Toplanan veriler</h2>
      <p>
        Üyelik ve hizmet sırasında; ad-soyad, e-posta, telefon numarası, işletme
        bilgileri (işletme adı, adres, iletişim, çalışma saatleri), oluşturduğunuz
        menü içerikleri ve görselleri ile ödeme işlemine ilişkin işlem bilgileri
        işlenir. <strong>Kredi/banka kartı bilgileriniz Şirket tarafından
        görülmez ve saklanmaz;</strong> ödemeler iyzico güvenli ödeme altyapısı
        üzerinden alınır.
      </p>

      <h2>İşleme amaçları</h2>
      <p>
        Verileriniz; üyeliğinizin oluşturulması ve yönetimi, hizmetin sunulması,
        abonelik ve ödeme süreçlerinin yürütülmesi, destek sağlanması, yasal
        yükümlülüklerin yerine getirilmesi ve hizmet kalitesinin artırılması
        amaçlarıyla işlenir.
      </p>

      <h2>Aktarım</h2>
      <p>
        Verileriniz; ödeme hizmeti (iyzico), barındırma/altyapı hizmet sağlayıcıları
        ve yasal olarak yetkili kurumlar dışında üçüncü kişilerle paylaşılmaz.
        Hizmet sağlayıcılarla paylaşım, yalnızca hizmetin gerektirdiği ölçüdedir.
      </p>

      <h2>Saklama ve güvenlik</h2>
      <p>
        Verileriniz, işleme amaçlarının gerektirdiği süre ve ilgili mevzuattaki
        zamanaşımı süreleri boyunca saklanır. Sitemiz SSL sertifikası ile korunur ve
        verilere yetkisiz erişimi önlemek için makul teknik ve idari tedbirler alınır.
      </p>

      <h2>Çerezler</h2>
      <p>
        Hizmetin çalışması ve oturum yönetimi için gerekli çerezler kullanılır.
        Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.
      </p>

      <h2>Haklarınız (KVKK m.11)</h2>
      <p>
        Kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya
        silinmesini isteme ve kanunda sayılan diğer haklarınızı kullanmak için bize
        <a href={`mailto:${COMPANY.email}`}> {COMPANY.email}</a> adresinden
        ulaşabilirsiniz.
      </p>

      <h2>İletişim (Veri Sorumlusu)</h2>
      <p>
        {COMPANY.legalName}
        <br />
        {COMPANY.address}
        <br />
        {COMPANY.phone} · {COMPANY.gsm} ·{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </p>
    </LegalPage>
  );
}
