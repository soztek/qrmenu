import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Hakkımızda" };

export default function HakkimizdaPage() {
  return (
    <LegalPage title="Hakkımızda">
      <p>
        <strong>Söztek QR Menü</strong>, {COMPANY.legalName} tarafından geliştirilen
        bir dijital menü (QR menü) hizmetidir. Kafe, restoran, otel, çay bahçesi ve
        benzeri işletmelerin menülerini kolayca dijitalleştirmesini, QR kod ile
        müşterilerine sunmasını ve anında güncellemesini sağlar.
      </p>

      <h2>Ne sunuyoruz?</h2>
      <p>
        Fotoğraflı ve mobil uyumlu QR menü, kalori/alerjen bilgisi, dijital ekran
        menüsü, yazdırılabilir menü, müşteri yorumları ve menü ziyaret istatistikleri
        gibi özelliklerle işletmelere uçtan uca bir dijital menü çözümü sunuyoruz.
        İşletmeler 7 gün ücretsiz deneme ile başlar, ardından ihtiyaçlarına uygun
        paketle devam eder.
      </p>

      <h2>Firma bilgileri</h2>
      <p>
        <strong>Ünvan:</strong> {COMPANY.legalName}
        <br />
        <strong>Adres:</strong> {COMPANY.address}
        <br />
        <strong>Vergi Dairesi / No:</strong> {COMPANY.taxOffice} · {COMPANY.taxNumber}
        <br />
        <strong>Telefon:</strong> {COMPANY.phone}
        <br />
        <strong>GSM:</strong> {COMPANY.gsm}
        <br />
        <strong>E-posta:</strong>{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        <br />
        <strong>Web:</strong>{" "}
        <a href={COMPANY.websiteUrl} target="_blank" rel="noopener noreferrer">
          {COMPANY.website}
        </a>
      </p>

      <h2>İletişim</h2>
      <p>
        Her türlü soru, öneri ve destek talebiniz için bize telefon, GSM/WhatsApp ya
        da e-posta ile ulaşabilirsiniz.
      </p>
    </LegalPage>
  );
}
