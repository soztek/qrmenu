/**
 * Söztek QR Menü — Landing (tanıtım sayfası) çoklu dil sözlüğü.
 * Kapsam: yalnızca ana sayfa. Dört dil: TR (varsayılan), EN, DE, FR.
 * Fiyatlar ₺ olarak kalır; {n} = TRIAL_DAYS yerine geçer (kullanım anında replace).
 */

export type Lang = "tr" | "en" | "de" | "fr";

export const DEFAULT_LANG: Lang = "tr";

/** Bayrak seçicide gösterilen diller. */
export const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
];

const tr = {
  nav: {
    features: "Özellikler",
    how: "Nasıl çalışır",
    packages: "Paketler",
    contact: "İletişim",
    login: "Giriş yap",
    tryFree: "Ücretsiz dene",
    whatsapp: "WhatsApp Destek",
  },
  hero: {
    badge: "{n} gün ücretsiz — kart gerekmez",
    titleBefore: "İşletmeniz için ",
    titleHighlight: "dijital QR menü",
    titleAfter: " dakikalar içinde",
    subtitle:
      "Menünüzü oluşturun, ürünlerinize fotoğraf ekleyin, QR kodunuzu masaya koyun. Müşteriniz telefonundan menüyü görsün, dilerseniz sipariş versin.",
    ctaPrimary: "Hemen ücretsiz başla",
    ctaSecondary: "Nasıl çalışır?",
    check1: "Kurulum gerekmez",
    check2: "Anında güncelleme",
  },
  phone: {
    menu: "Menü",
    popular: "Popüler",
    desserts: "Tatlılar",
    items: [
      { name: "Cheeseburger", tag: "Ana yemek" },
      { name: "Türk Kahvesi", tag: "Sıcak içecek" },
      { name: "Frambuazlı Pasta", tag: "Tatlı" },
    ],
  },
  marquee: {
    eyebrow: "Menü Galerisi",
    title: "İşletmelerin Menülerinden Bazı Görüntüler",
  },
  features: {
    eyebrow: "Özellikler",
    title: "İşletmenizin ihtiyacı olan her şey",
    subtitle:
      "Sade bir QR menüden tam kapsamlı sipariş yönetimine kadar, ihtiyacınız kadarını kullanın.",
    items: [
      {
        title: "QR menü",
        desc: "Kendi QR kodunuzu üretin, masaya koyun; müşteri telefonundan menüyü açsın.",
      },
      {
        title: "Fotoğraflı ürünler",
        desc: "Her ürüne fotoğraf ekleyin; iştah açan görsellerle satışı artırın.",
      },
      {
        title: "Sipariş + mutfak paneli",
        desc: "Müşteri QR'dan sipariş versin, siparişler canlı mutfak panelinize düşsün.",
      },
      {
        title: "Masa yönetimi",
        desc: "Her masaya özel QR; hangi siparişin hangi masadan geldiğini görün.",
      },
      {
        title: "Çoklu dil",
        desc: "Menünüzü birden fazla dilde sunun, yabancı misafirlerinizi rahat ettirin.",
      },
      {
        title: "Anında güncelleme",
        desc: "Fiyat mı değişti, ürün mü tükendi? Menü anında güncellenir, baskı yok.",
      },
    ],
  },
  how: {
    eyebrow: "Nasıl çalışır",
    title: "3 adımda yayında",
    subtitle:
      "Teknik bilgi gerekmez. Kaydolun, menünüzü girin, QR'ı paylaşın.",
    steps: [
      {
        title: "Kayıt olun",
        desc: "Ücretsiz hesap açın, {n} günlük denemeniz hemen başlasın.",
      },
      {
        title: "Menünüzü oluşturun",
        desc: "Kategori ve ürünlerinizi ekleyin, fotoğraflarını yükleyin.",
      },
      {
        title: "QR'ı yayınlayın",
        desc: "QR kodunuzu indirin, masaya koyun. Müşteriniz okutsun, menü açılsın.",
      },
    ],
  },
  compliance: {
    eyebrow: "Yasal Uyumluluk",
    title: "Mevzuata hazır QR menü",
    subtitle:
      "Türkiye'de menülerde kalori, alerjen ve içerik şeffaflığına yönelik düzenlemeler yürürlüğe giriyor. Söztek QR Menü bu gerekliliklere hazır.",
    items: [
      {
        title: "Kalori & besin değerleri",
        desc: "Porsiyon başına kcal, protein, yağ ve karbonhidrat girin.",
      },
      {
        title: "14 alerjen bildirimi",
        desc: "Gluten, süt, yumurta, kuruyemiş… ürün bazında işaretleyin.",
      },
      {
        title: "Et türü belirtme",
        desc: "“Köfte/kebap” yerine dana, kuzu, kanatlı olarak gösterin.",
      },
      {
        title: "Hassas içerik işareti",
        desc: "Alkol veya domuz türevi içeriği açıkça belirtin.",
      },
      {
        title: "Fiyat = kasa tutarı",
        desc: "Menü fiyatı kasadakiyle aynı; anlık güncelleme, gizli ücret yok.",
      },
      {
        title: "Fiziki (basılı) menü",
        desc: "Talep edene sunmak için tek tıkla yazdırılabilir PDF menü.",
      },
    ],
    footnote:
      "* Tarım ve Orman Bakanlığı (şeffaf menü / kalori) ve Ticaret Bakanlığı (fiyat etiketi) düzenlemeleri kapsamında; ulusal zincirlerde 2026, tek şubeli / KOBİ işletmelerde 2027'ye kadar kademeli geçiş öngörüldüğü duyurulmuştur. Güncel ve size özel yükümlülükler için resmi kaynakları ve mali müşavirinizi kontrol edin.",
  },
  pricing: {
    eyebrow: "Paketler",
    title: "İşletmenize uygun paketi seçin",
    subtitle: "Tüm paketler {n} gün ücretsiz. Dilediğiniz zaman iptal edin.",
    popular: "En popüler",
    perMonth: "/ay",
    cta: "{n} gün ücretsiz dene",
  },
  plans: {
    starter: {
      name: "Başlangıç",
      tagline: "Dijital menüye ilk adım",
      highlights: [
        "Sınırsız kategori ve ürün",
        "Ürün fotoğrafları",
        "QR kod üretimi",
        "Mobil uyumlu menü",
        "Menüyü anında güncelleme",
      ],
    },
    pro: {
      name: "Pro",
      tagline: "Sipariş alan işletmeler için",
      highlights: [
        "Başlangıç'taki her şey",
        "Müşteriden QR ile sipariş alma",
        "Canlı mutfak paneli",
        "Sipariş durumu takibi",
      ],
    },
    premium: {
      name: "Premium",
      tagline: "Tam kapsamlı işletme yönetimi",
      highlights: [
        "Pro'daki her şey",
        "Masa yönetimi ve masaya özel QR",
        "Çoklu dil desteği",
        "Öncelikli destek",
      ],
    },
  },
  finalCta: {
    title: "Menünüzü bugün dijitale taşıyın",
    subtitle:
      "{n} gün boyunca tüm özellikleri ücretsiz deneyin. Kart bilgisi istemiyoruz.",
    cta: "Ücretsiz hesap oluştur",
  },
  footer: {
    brandDesc:
      "İşletmeniz için dijital QR menü, sipariş ve masa yönetimi. Dakikalar içinde kurun.",
    login: "Giriş",
    register: "Kayıt ol",
    packages: "Paketler",
    contactTitle: "İletişim",
    telFax: "Tel/Faks",
    gsm: "GSM",
    company: "Firma",
    taxOffice: "Vergi Dairesi",
    taxNo: "VKN",
    securePayment: "Güvenli ödeme — kart bilgileriniz saklanmaz",
    rights: "Tüm hakları saklıdır.",
    about: "Hakkımızda",
    privacy: "Gizlilik Sözleşmesi",
    distanceSales: "Mesafeli Satış Sözleşmesi",
    delivery: "Teslimat ve İade Şartları",
  },
};

export type Dict = typeof tr;

const en: Dict = {
  nav: {
    features: "Features",
    how: "How it works",
    packages: "Pricing",
    contact: "Contact",
    login: "Log in",
    tryFree: "Try for free",
    whatsapp: "WhatsApp Support",
  },
  hero: {
    badge: "{n}-day free trial — no card required",
    titleBefore: "Your business's ",
    titleHighlight: "digital QR menu",
    titleAfter: " in minutes",
    subtitle:
      "Create your menu, add photos to your products, place your QR code on the table. Your guests view the menu on their phones and can even order.",
    ctaPrimary: "Start free now",
    ctaSecondary: "How it works?",
    check1: "No setup needed",
    check2: "Instant updates",
  },
  phone: {
    menu: "Menu",
    popular: "Popular",
    desserts: "Desserts",
    items: [
      { name: "Cheeseburger", tag: "Main dish" },
      { name: "Turkish Coffee", tag: "Hot drink" },
      { name: "Raspberry Cake", tag: "Dessert" },
    ],
  },
  marquee: {
    eyebrow: "Menu Gallery",
    title: "A glimpse of our clients' menus",
  },
  features: {
    eyebrow: "Features",
    title: "Everything your business needs",
    subtitle:
      "From a simple QR menu to full order management — use as much as you need.",
    items: [
      {
        title: "QR menu",
        desc: "Generate your own QR code and place it on the table; guests open the menu on their phones.",
      },
      {
        title: "Products with photos",
        desc: "Add a photo to every item; boost sales with appetizing visuals.",
      },
      {
        title: "Orders + kitchen panel",
        desc: "Let guests order via QR; orders land on your live kitchen panel.",
      },
      {
        title: "Table management",
        desc: "A unique QR per table; see which order came from which table.",
      },
      {
        title: "Multi-language",
        desc: "Offer your menu in multiple languages and make foreign guests feel at home.",
      },
      {
        title: "Instant updates",
        desc: "Price changed or item sold out? The menu updates instantly — no reprinting.",
      },
    ],
  },
  how: {
    eyebrow: "How it works",
    title: "Live in 3 steps",
    subtitle:
      "No technical skills needed. Sign up, enter your menu, share the QR.",
    steps: [
      {
        title: "Sign up",
        desc: "Open a free account and start your {n}-day trial right away.",
      },
      {
        title: "Create your menu",
        desc: "Add your categories and products, upload their photos.",
      },
      {
        title: "Publish the QR",
        desc: "Download your QR code and place it on the table. Guests scan it and the menu opens.",
      },
    ],
  },
  compliance: {
    eyebrow: "Legal compliance",
    title: "A QR menu ready for regulations",
    subtitle:
      "New rules on calorie, allergen and ingredient transparency are coming into force for menus in Türkiye. Söztek QR Menu is ready for these requirements.",
    items: [
      {
        title: "Calories & nutrition",
        desc: "Enter kcal, protein, fat and carbs per portion.",
      },
      {
        title: "14 allergen labelling",
        desc: "Gluten, milk, egg, nuts… flag them per product.",
      },
      {
        title: "Specify meat type",
        desc: "Show beef, lamb or poultry instead of just “meatball/kebab.”",
      },
      {
        title: "Sensitive-content flag",
        desc: "Clearly indicate alcohol or pork-derived ingredients.",
      },
      {
        title: "Price = checkout amount",
        desc: "The menu price matches the till; instant updates, no hidden fees.",
      },
      {
        title: "Printed menu",
        desc: "A one-click printable PDF menu to offer on request.",
      },
    ],
    footnote:
      "* Under the transparency (calorie/menu) rules of the Ministry of Agriculture and Forestry and the price-tag rules of the Ministry of Trade; a phased transition has been announced — until 2026 for national chains and 2027 for single-branch/SME businesses. Check official sources and your accountant for your current, specific obligations.",
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Choose the plan that fits your business",
    subtitle: "All plans free for {n} days. Cancel anytime.",
    popular: "Most popular",
    perMonth: "/mo",
    cta: "Try {n} days free",
  },
  plans: {
    starter: {
      name: "Starter",
      tagline: "First step to a digital menu",
      highlights: [
        "Unlimited categories and products",
        "Product photos",
        "QR code generation",
        "Mobile-friendly menu",
        "Instant menu updates",
      ],
    },
    pro: {
      name: "Pro",
      tagline: "For businesses taking orders",
      highlights: [
        "Everything in Starter",
        "Take orders from guests via QR",
        "Live kitchen panel",
        "Order status tracking",
      ],
    },
    premium: {
      name: "Premium",
      tagline: "Full-scale business management",
      highlights: [
        "Everything in Pro",
        "Table management with per-table QR",
        "Multi-language support",
        "Priority support",
      ],
    },
  },
  finalCta: {
    title: "Take your menu digital today",
    subtitle:
      "Try all features free for {n} days. No card details required.",
    cta: "Create a free account",
  },
  footer: {
    brandDesc:
      "Digital QR menu, ordering and table management for your business. Set up in minutes.",
    login: "Log in",
    register: "Sign up",
    packages: "Pricing",
    contactTitle: "Contact",
    telFax: "Phone/Fax",
    gsm: "Mobile",
    company: "Company",
    taxOffice: "Tax office",
    taxNo: "Tax no.",
    securePayment: "Secure payment — your card details are never stored",
    rights: "All rights reserved.",
    about: "About us",
    privacy: "Privacy Policy",
    distanceSales: "Distance Sales Agreement",
    delivery: "Delivery & Refund Terms",
  },
};

const de: Dict = {
  nav: {
    features: "Funktionen",
    how: "So funktioniert's",
    packages: "Preise",
    contact: "Kontakt",
    login: "Anmelden",
    tryFree: "Kostenlos testen",
    whatsapp: "WhatsApp-Support",
  },
  hero: {
    badge: "{n} Tage kostenlos — keine Karte nötig",
    titleBefore: "Ihre ",
    titleHighlight: "digitale QR-Speisekarte",
    titleAfter: " in Minuten",
    subtitle:
      "Erstellen Sie Ihre Speisekarte, fügen Sie Fotos hinzu und legen Sie Ihren QR-Code auf den Tisch. Ihre Gäste sehen die Karte auf dem Handy und können sogar bestellen.",
    ctaPrimary: "Jetzt kostenlos starten",
    ctaSecondary: "Wie funktioniert's?",
    check1: "Keine Installation",
    check2: "Sofortige Updates",
  },
  phone: {
    menu: "Menü",
    popular: "Beliebt",
    desserts: "Desserts",
    items: [
      { name: "Cheeseburger", tag: "Hauptgericht" },
      { name: "Türkischer Kaffee", tag: "Heißgetränk" },
      { name: "Himbeertorte", tag: "Dessert" },
    ],
  },
  marquee: {
    eyebrow: "Menü-Galerie",
    title: "Einblicke in die Menüs unserer Kunden",
  },
  features: {
    eyebrow: "Funktionen",
    title: "Alles, was Ihr Betrieb braucht",
    subtitle:
      "Vom einfachen QR-Menü bis zur kompletten Bestellverwaltung — nutzen Sie so viel, wie Sie brauchen.",
    items: [
      {
        title: "QR-Menü",
        desc: "Erstellen Sie Ihren QR-Code und legen Sie ihn auf den Tisch; Gäste öffnen das Menü per Handy.",
      },
      {
        title: "Produkte mit Fotos",
        desc: "Fügen Sie jedem Produkt ein Foto hinzu; steigern Sie den Umsatz mit appetitlichen Bildern.",
      },
      {
        title: "Bestellungen + Küchenpanel",
        desc: "Gäste bestellen per QR; Bestellungen erscheinen live auf Ihrem Küchenpanel.",
      },
      {
        title: "Tischverwaltung",
        desc: "Ein eigener QR pro Tisch; sehen Sie, welche Bestellung von welchem Tisch kam.",
      },
      {
        title: "Mehrsprachig",
        desc: "Bieten Sie Ihr Menü in mehreren Sprachen an und lassen Sie ausländische Gäste sich wohlfühlen.",
      },
      {
        title: "Sofortige Updates",
        desc: "Preis geändert oder ausverkauft? Das Menü aktualisiert sich sofort — kein Nachdruck.",
      },
    ],
  },
  how: {
    eyebrow: "So funktioniert's",
    title: "In 3 Schritten online",
    subtitle:
      "Keine technischen Kenntnisse nötig. Registrieren, Menü eingeben, QR teilen.",
    steps: [
      {
        title: "Registrieren",
        desc: "Eröffnen Sie ein kostenloses Konto und starten Sie sofort Ihre {n}-tägige Testphase.",
      },
      {
        title: "Menü erstellen",
        desc: "Fügen Sie Kategorien und Produkte hinzu und laden Sie Fotos hoch.",
      },
      {
        title: "QR veröffentlichen",
        desc: "Laden Sie Ihren QR-Code herunter und legen Sie ihn auf den Tisch. Gäste scannen, Menü öffnet sich.",
      },
    ],
  },
  compliance: {
    eyebrow: "Rechtskonformität",
    title: "Ein gesetzeskonformes QR-Menü",
    subtitle:
      "In der Türkei treten neue Vorschriften zu Kalorien-, Allergen- und Zutatentransparenz für Speisekarten in Kraft. Söztek QR Menü ist darauf vorbereitet.",
    items: [
      {
        title: "Kalorien & Nährwerte",
        desc: "Geben Sie kcal, Protein, Fett und Kohlenhydrate pro Portion an.",
      },
      {
        title: "14 Allergene ausweisen",
        desc: "Gluten, Milch, Ei, Nüsse… pro Produkt kennzeichnen.",
      },
      {
        title: "Fleischart angeben",
        desc: "Zeigen Sie Rind, Lamm oder Geflügel statt nur „Köfte/Kebab“.",
      },
      {
        title: "Hinweis auf sensible Inhalte",
        desc: "Weisen Sie Alkohol oder Schweinefleischbestandteile klar aus.",
      },
      {
        title: "Preis = Kassenbetrag",
        desc: "Der Menüpreis entspricht dem an der Kasse; sofortige Updates, keine versteckten Gebühren.",
      },
      {
        title: "Gedruckte Speisekarte",
        desc: "Eine druckbare PDF-Speisekarte auf einen Klick — auf Wunsch vorzulegen.",
      },
    ],
    footnote:
      "* Im Rahmen der Transparenzvorschriften (Kalorien/Speisekarte) des Ministeriums für Landwirtschaft und Forsten sowie der Preisauszeichnungsvorschriften des Handelsministeriums; ein stufenweiser Übergang wurde angekündigt — bis 2026 für nationale Ketten und 2027 für Einzelbetriebe/KMU. Prüfen Sie offizielle Quellen und Ihren Steuerberater für Ihre aktuellen, konkreten Pflichten.",
  },
  pricing: {
    eyebrow: "Preise",
    title: "Wählen Sie den passenden Tarif",
    subtitle: "Alle Tarife {n} Tage kostenlos. Jederzeit kündbar.",
    popular: "Am beliebtesten",
    perMonth: "/Mon.",
    cta: "{n} Tage kostenlos testen",
  },
  plans: {
    starter: {
      name: "Starter",
      tagline: "Erster Schritt zur digitalen Karte",
      highlights: [
        "Unbegrenzte Kategorien und Produkte",
        "Produktfotos",
        "QR-Code-Erstellung",
        "Mobilfreundliches Menü",
        "Sofortige Menü-Updates",
      ],
    },
    pro: {
      name: "Pro",
      tagline: "Für Betriebe mit Bestellungen",
      highlights: [
        "Alles aus Starter",
        "Bestellungen per QR annehmen",
        "Live-Küchenpanel",
        "Bestellstatus-Verfolgung",
      ],
    },
    premium: {
      name: "Premium",
      tagline: "Umfassende Betriebsverwaltung",
      highlights: [
        "Alles aus Pro",
        "Tischverwaltung mit QR pro Tisch",
        "Mehrsprachigkeit",
        "Priorisierter Support",
      ],
    },
  },
  finalCta: {
    title: "Digitalisieren Sie Ihre Speisekarte noch heute",
    subtitle:
      "Testen Sie alle Funktionen {n} Tage kostenlos. Keine Kartendaten nötig.",
    cta: "Kostenloses Konto erstellen",
  },
  footer: {
    brandDesc:
      "Digitales QR-Menü, Bestellungen und Tischverwaltung für Ihren Betrieb. In Minuten eingerichtet.",
    login: "Anmelden",
    register: "Registrieren",
    packages: "Preise",
    contactTitle: "Kontakt",
    telFax: "Tel./Fax",
    gsm: "Mobil",
    company: "Firma",
    taxOffice: "Finanzamt",
    taxNo: "St.-Nr.",
    securePayment: "Sichere Zahlung — Ihre Kartendaten werden nicht gespeichert",
    rights: "Alle Rechte vorbehalten.",
    about: "Über uns",
    privacy: "Datenschutz",
    distanceSales: "Fernabsatzvertrag",
    delivery: "Liefer- & Rückgabebedingungen",
  },
};

const fr: Dict = {
  nav: {
    features: "Fonctionnalités",
    how: "Comment ça marche",
    packages: "Tarifs",
    contact: "Contact",
    login: "Se connecter",
    tryFree: "Essai gratuit",
    whatsapp: "Support WhatsApp",
  },
  hero: {
    badge: "{n} jours gratuits — sans carte",
    titleBefore: "Votre ",
    titleHighlight: "menu QR numérique",
    titleAfter: " en quelques minutes",
    subtitle:
      "Créez votre menu, ajoutez des photos à vos produits et posez votre QR code sur la table. Vos clients consultent le menu sur leur téléphone et peuvent même commander.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Comment ça marche ?",
    check1: "Aucune installation",
    check2: "Mises à jour instantanées",
  },
  phone: {
    menu: "Menu",
    popular: "Populaire",
    desserts: "Desserts",
    items: [
      { name: "Cheeseburger", tag: "Plat principal" },
      { name: "Café turc", tag: "Boisson chaude" },
      { name: "Gâteau à la framboise", tag: "Dessert" },
    ],
  },
  marquee: {
    eyebrow: "Galerie du menu",
    title: "Aperçu des menus de nos clients",
  },
  features: {
    eyebrow: "Fonctionnalités",
    title: "Tout ce dont votre établissement a besoin",
    subtitle:
      "D'un simple menu QR à la gestion complète des commandes — utilisez ce dont vous avez besoin.",
    items: [
      {
        title: "Menu QR",
        desc: "Générez votre QR code et posez-le sur la table ; les clients ouvrent le menu sur leur téléphone.",
      },
      {
        title: "Produits avec photos",
        desc: "Ajoutez une photo à chaque produit ; augmentez les ventes avec des visuels appétissants.",
      },
      {
        title: "Commandes + écran cuisine",
        desc: "Les clients commandent via QR ; les commandes arrivent sur votre écran cuisine en direct.",
      },
      {
        title: "Gestion des tables",
        desc: "Un QR unique par table ; voyez quelle commande vient de quelle table.",
      },
      {
        title: "Multilingue",
        desc: "Proposez votre menu en plusieurs langues et mettez vos clients étrangers à l'aise.",
      },
      {
        title: "Mises à jour instantanées",
        desc: "Prix modifié ou produit épuisé ? Le menu se met à jour instantanément — sans réimpression.",
      },
    ],
  },
  how: {
    eyebrow: "Comment ça marche",
    title: "En ligne en 3 étapes",
    subtitle:
      "Aucune compétence technique requise. Inscrivez-vous, saisissez votre menu, partagez le QR.",
    steps: [
      {
        title: "Inscrivez-vous",
        desc: "Créez un compte gratuit et démarrez votre essai de {n} jours immédiatement.",
      },
      {
        title: "Créez votre menu",
        desc: "Ajoutez vos catégories et produits, téléversez leurs photos.",
      },
      {
        title: "Publiez le QR",
        desc: "Téléchargez votre QR code et posez-le sur la table. Les clients le scannent et le menu s'ouvre.",
      },
    ],
  },
  compliance: {
    eyebrow: "Conformité légale",
    title: "Un menu QR conforme à la réglementation",
    subtitle:
      "De nouvelles règles sur la transparence des calories, allergènes et ingrédients entrent en vigueur pour les menus en Turquie. Söztek QR Menu est prêt pour ces exigences.",
    items: [
      {
        title: "Calories et nutrition",
        desc: "Indiquez les kcal, protéines, lipides et glucides par portion.",
      },
      {
        title: "Étiquetage des 14 allergènes",
        desc: "Gluten, lait, œuf, fruits à coque… signalez-les par produit.",
      },
      {
        title: "Préciser le type de viande",
        desc: "Affichez bœuf, agneau ou volaille plutôt que « boulette/kebab ».",
      },
      {
        title: "Signalement de contenu sensible",
        desc: "Indiquez clairement l'alcool ou les ingrédients dérivés du porc.",
      },
      {
        title: "Prix = montant en caisse",
        desc: "Le prix du menu correspond à la caisse ; mises à jour instantanées, sans frais cachés.",
      },
      {
        title: "Menu imprimé",
        desc: "Un menu PDF imprimable en un clic, à présenter sur demande.",
      },
    ],
    footnote:
      "* Dans le cadre des règles de transparence (calories/menu) du ministère de l'Agriculture et des Forêts et des règles d'étiquetage des prix du ministère du Commerce ; une transition progressive a été annoncée — jusqu'en 2026 pour les chaînes nationales et 2027 pour les établissements à point de vente unique/PME. Vérifiez les sources officielles et votre comptable pour vos obligations actuelles et spécifiques.",
  },
  pricing: {
    eyebrow: "Tarifs",
    title: "Choisissez le forfait adapté à votre établissement",
    subtitle: "Tous les forfaits gratuits {n} jours. Annulez à tout moment.",
    popular: "Le plus populaire",
    perMonth: "/mois",
    cta: "Essayer {n} jours gratuits",
  },
  plans: {
    starter: {
      name: "Débutant",
      tagline: "Premier pas vers le menu numérique",
      highlights: [
        "Catégories et produits illimités",
        "Photos des produits",
        "Génération de QR code",
        "Menu adapté au mobile",
        "Mises à jour instantanées du menu",
      ],
    },
    pro: {
      name: "Pro",
      tagline: "Pour les établissements qui prennent des commandes",
      highlights: [
        "Tout du forfait Débutant",
        "Prise de commandes via QR",
        "Écran cuisine en direct",
        "Suivi du statut des commandes",
      ],
    },
    premium: {
      name: "Premium",
      tagline: "Gestion complète de l'établissement",
      highlights: [
        "Tout du forfait Pro",
        "Gestion des tables avec QR par table",
        "Support multilingue",
        "Support prioritaire",
      ],
    },
  },
  finalCta: {
    title: "Passez à un menu numérique dès aujourd'hui",
    subtitle:
      "Essayez toutes les fonctionnalités gratuitement pendant {n} jours. Aucune carte requise.",
    cta: "Créer un compte gratuit",
  },
  footer: {
    brandDesc:
      "Menu QR numérique, commandes et gestion des tables pour votre établissement. Configuré en quelques minutes.",
    login: "Connexion",
    register: "Inscription",
    packages: "Tarifs",
    contactTitle: "Contact",
    telFax: "Tél./Fax",
    gsm: "Mobile",
    company: "Entreprise",
    taxOffice: "Bureau des impôts",
    taxNo: "N° fiscal",
    securePayment: "Paiement sécurisé — vos données de carte ne sont pas conservées",
    rights: "Tous droits réservés.",
    about: "À propos",
    privacy: "Politique de confidentialité",
    distanceSales: "Contrat de vente à distance",
    delivery: "Conditions de livraison et de retour",
  },
};

export const DICT: Record<Lang, Dict> = { tr, en, de, fr };
