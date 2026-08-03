import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Teslimat ve İade Şartları" };

export default function TeslimatIadePage() {
  return (
    <LegalPage title="Teslimat ve İade Şartları" updated="2026">
      <h2>Teslimat (Hizmetin sunulması)</h2>
      <p>
        Söztek QR Menü tamamen <strong>dijital bir hizmettir</strong>; fiziksel ürün
        gönderimi ve kargo bulunmamaktadır. Ödemeniz onaylandığı anda seçtiğiniz
        paket hesabınızda <strong>otomatik olarak aktifleşir</strong> ve tüm
        özelliklere erişim başlar. Aktivasyon genellikle birkaç saniye içinde
        gerçekleşir.
      </p>

      <h2>Ücretsiz deneme</h2>
      <p>
        Yeni üyeler <strong>7 gün ücretsiz</strong> deneme ile başlar. Deneme
        süresinde herhangi bir ücret alınmaz ve dilediğiniz zaman vazgeçebilirsiniz.
      </p>

      <h2>İptal</h2>
      <p>
        Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz. İptal ettiğinizde, o an
        için ödemesini yaptığınız dönemin sonuna kadar hizmete erişiminiz devam eder;
        dönem sonunda otomatik yenileme yapılmaz. İptal talebinizi panelinizden ya da
        aşağıdaki iletişim kanallarından iletebilirsiniz.
      </p>

      <h2>İade</h2>
      <p>
        Hizmet dijital olduğundan ve ödeme sonrası anında ifa edildiğinden, kullanıma
        başlanmış ücretli dönemler için kural olarak iade yapılmaz. Ancak; ödemenin
        yanlışlıkla/mükerrer alınması veya hizmetin sağlanamaması gibi durumlarda,
        talebiniz incelenerek uygun görülen tutar <strong>aynı ödeme yöntemine
        (iyzico üzerinden)</strong> iade edilir. İadeler, onaydan sonra bankanıza
        bağlı olarak genellikle birkaç iş günü içinde hesabınıza yansır.
      </p>

      <h2>İptal / iade talebi</h2>
      <p>
        Talepleriniz için:
        <br />
        {COMPANY.legalName}
        <br />
        Telefon: {COMPANY.phone} · GSM/WhatsApp: {COMPANY.gsm}
        <br />
        E-posta: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </p>
    </LegalPage>
  );
}
