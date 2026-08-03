"use client";

import { useState } from "react";
import { updateSocialSettings } from "@/lib/actions/social";

export function SettingsForm({
  initial,
}: {
  initial: {
    brandTone: string;
    defaultHashtags: string;
    includeQrLink: boolean;
    includeLogo: boolean;
  };
}) {
  const [brandTone, setBrandTone] = useState(initial.brandTone);
  const [defaultHashtags, setDefaultHashtags] = useState(initial.defaultHashtags);
  const [includeQrLink, setIncludeQrLink] = useState(initial.includeQrLink);
  const [includeLogo, setIncludeLogo] = useState(initial.includeLogo);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string>("");

  async function save() {
    setBusy(true);
    setNote("");
    try {
      const tags = defaultHashtags
        .split(/[\s,\n]+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean);
      const res = await updateSocialSettings({
        brandTone,
        defaultHashtags: tags,
        includeQrLink,
        includeLogo,
      });
      setNote(res.ok ? "Ayarlar kaydedildi." : res.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-surface p-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg">Marka tonu</label>
        <textarea
          value={brandTone}
          onChange={(e) => setBrandTone(e.target.value)}
          rows={3}
          placeholder='Örn: "Sıcak, samimi, aile dostu. Yerel ve taze vurgusu."'
          className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
        />
        <p className="mt-1 text-xs text-faint">AI içerik üretirken bu tonu dikkate alır.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg">Varsayılan hashtag'ler</label>
        <input
          value={defaultHashtags}
          onChange={(e) => setDefaultHashtags(e.target.value)}
          placeholder="kafe restoran lezzet"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
        />
        <p className="mt-1 text-xs text-faint">Boşlukla ayırın; üretilen içeriğe eklenir.</p>
      </div>

      <label className="flex items-center gap-3 text-sm text-fg">
        <input
          type="checkbox"
          checked={includeQrLink}
          onChange={(e) => setIncludeQrLink(e.target.checked)}
          className="h-4 w-4 accent-green"
        />
        Görselde/açıklamada QR menü adresini kullan
      </label>
      <label className="flex items-center gap-3 text-sm text-fg">
        <input
          type="checkbox"
          checked={includeLogo}
          onChange={(e) => setIncludeLogo(e.target.checked)}
          className="h-4 w-4 accent-green"
        />
        Görsellerde Söztek QR Menü logosunu kullan
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-xl bg-gradient-to-b from-green to-green-dark px-5 py-2 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
        >
          {busy ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {note && <span className="text-sm text-muted">{note}</span>}
      </div>
    </div>
  );
}
