"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTENT_TYPES, POST_FORMATS, type PostFormat } from "@/lib/social/types";
import type { SocialPostType } from "@/generated/prisma/enums";
import {
  generateDraft,
  regenerateDraft,
  updatePost,
  setPostStatus,
  schedulePost,
  publishNow,
  type PostDTO,
} from "@/lib/actions/social";
import { InstagramPreview } from "../instagram-preview";

interface MenuItemLite {
  id: string;
  name: string;
  categoryName: string | null;
  photoUrl: string | null;
}

interface Props {
  business: { name: string };
  menuItems: MenuItemLite[];
  igAccount: { username: string | null; avatarUrl: string | null } | null;
  aiEnabled: boolean;
  instagramConnected: boolean;
}

type Note = { kind: "ok" | "err"; text: string } | null;

export function CreateStudio({
  business,
  menuItems,
  igAccount,
  aiEnabled,
  instagramConnected,
}: Props) {
  const [type, setType] = useState<SocialPostType>("product");
  const [menuItemId, setMenuItemId] = useState<string>("");
  const [format, setFormat] = useState<PostFormat>("portrait");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const [post, setPost] = useState<PostDTO | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [note, setNote] = useState<Note>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const selectedItem = menuItems.find((m) => m.id === menuItemId) ?? null;

  function loadPost(p: PostDTO) {
    setPost(p);
    setTitle(p.title ?? "");
    setBody(p.body ?? "");
    setCta(p.cta ?? "");
    setHashtags(p.hashtags.join(" "));
    setFormat((p.format as PostFormat) ?? "portrait");
  }

  function parseTags(s: string): string[] {
    return s
      .split(/[\s,\n]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  async function onGenerate() {
    setNote(null);
    setGenerating(true);
    try {
      const res = await generateDraft({
        type,
        userPrompt: prompt.trim() || undefined,
        menuItemId: menuItemId || null,
        format,
      });
      if (res.ok) {
        loadPost(res.data);
        setNote({ kind: "ok", text: "İçerik oluşturuldu. Önizleyip düzenleyebilirsiniz." });
      } else {
        setNote({ kind: "err", text: res.error });
      }
    } finally {
      setGenerating(false);
    }
  }

  async function withBusy(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setNote(null);
    try {
      await fn();
    } finally {
      setBusy("");
    }
  }

  async function onSave() {
    if (!post) return;
    await withBusy("save", async () => {
      const res = await updatePost(post.id, {
        title,
        body,
        cta,
        hashtags: parseTags(hashtags),
      });
      if (res.ok) {
        loadPost(res.data);
        setNote({ kind: "ok", text: "Değişiklikler kaydedildi." });
      } else setNote({ kind: "err", text: res.error });
    });
  }

  async function onRegenerate() {
    if (!post) return;
    await withBusy("regen", async () => {
      const res = await regenerateDraft(post.id, prompt.trim() || undefined);
      if (res.ok) {
        loadPost(res.data);
        setNote({ kind: "ok", text: "İçerik yeniden oluşturuldu." });
      } else setNote({ kind: "err", text: res.error });
    });
  }

  async function onApprove() {
    if (!post) return;
    await withBusy("approve", async () => {
      // önce düzenlemeleri kaydet, sonra onayla
      await updatePost(post.id, { title, body, cta, hashtags: parseTags(hashtags) });
      const res = await setPostStatus(post.id, "approved");
      if (res.ok) {
        loadPost(res.data);
        setNote({ kind: "ok", text: "İçerik onaylandı. Yayınlayabilir veya zamanlayabilirsiniz." });
      } else setNote({ kind: "err", text: res.error });
    });
  }

  async function onSaveDraft() {
    if (!post) return;
    await withBusy("draft", async () => {
      const res = await updatePost(post.id, {
        title,
        body,
        cta,
        hashtags: parseTags(hashtags),
      });
      if (res.ok) {
        loadPost(res.data);
        setNote({ kind: "ok", text: "Taslak kaydedildi. “Taslaklar”dan bulabilirsiniz." });
      } else setNote({ kind: "err", text: res.error });
    });
  }

  async function onSchedule() {
    if (!post || !scheduleAt) return;
    await withBusy("schedule", async () => {
      await updatePost(post.id, { title, body, cta, hashtags: parseTags(hashtags) });
      const iso = new Date(scheduleAt).toISOString();
      const res = await schedulePost(post.id, iso);
      if (res.ok) {
        loadPost(res.data);
        setNote({ kind: "ok", text: "İçerik zamanlandı. “İçerik takvimi”nde görünecek." });
      } else setNote({ kind: "err", text: res.error });
    });
  }

  async function onPublish() {
    if (!post) return;
    await withBusy("publish", async () => {
      await updatePost(post.id, { title, body, cta, hashtags: parseTags(hashtags) });
      const res = await publishNow(post.id);
      if (res.ok) {
        loadPost(res.data);
        if (res.data.status === "published") {
          setNote({ kind: "ok", text: "🎉 Instagram'da yayınlandı!" });
        } else {
          setNote({ kind: "err", text: res.data.errorMessage ?? "Paylaşım başarısız." });
        }
      } else setNote({ kind: "err", text: res.error });
    });
  }

  const previewCaption = [body, cta, parseTags(hashtags).map((h) => "#" + h).join(" ")]
    .filter((s) => s && s.trim())
    .join("\n\n");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* SOL: form / düzenleme */}
      <div className="space-y-5">
        {!aiEnabled && (
          <div className="rounded-xl border border-orange/40 bg-orange-soft/40 p-3 text-sm text-fg">
            AI içerik üretimi şu an kapalı. Yönetici <code>OPENAI_API_KEY</code> ekleyince aktifleşir.
          </div>
        )}

        {/* İçerik türü */}
        <div>
          <label className="mb-2 block text-sm font-medium text-fg">İçerik türü</label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setType(c.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  type === c.id
                    ? "border-green bg-green-soft/50 text-fg"
                    : "border-border text-muted hover:border-green/40 hover:text-fg"
                }`}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ürün seçimi */}
        {menuItems.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">
              Ürün (menünüzden — isteğe bağlı)
            </label>
            <select
              value={menuItemId}
              onChange={(e) => setMenuItemId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
            >
              <option value="">Ürün seçmeden (genel içerik)</option>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.categoryName ? ` — ${m.categoryName}` : ""}
                  {m.photoUrl ? " 📷" : ""}
                </option>
              ))}
            </select>
            {selectedItem && !selectedItem.photoUrl && (
              <p className="mt-1 text-xs text-faint">
                Bu ürünün fotoğrafı yok — yayın için menüden fotoğraf eklemeniz önerilir.
              </p>
            )}
          </div>
        )}

        {/* Format */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">Görsel formatı</label>
          <div className="flex gap-2">
            {(Object.keys(POST_FORMATS) as PostFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  format === f
                    ? "border-green bg-green-soft/50 text-fg"
                    : "border-border text-muted hover:border-green/40 hover:text-fg"
                }`}
              >
                {POST_FORMATS[f].label}
              </button>
            ))}
          </div>
        </div>

        {/* Serbest not */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">
            Ne anlatalım? (isteğe bağlı)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder='Örn: "Hafta sonu brunch menümüzü tanıt, aile dostu vurgusu yap"'
            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
          />
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || !aiEnabled}
          className="w-full rounded-xl bg-gradient-to-b from-green to-green-dark py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
        >
          {generating ? "Oluşturuluyor…" : post ? "🔄 Baştan oluştur" : "✨ İçerik oluştur"}
        </button>

        {/* Düzenlenebilir alanlar */}
        {post && (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="text-sm font-semibold text-fg">İçeriği düzenle</div>
            <Field label="Başlık">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
            </Field>
            <Field label="Açıklama">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
            </Field>
            <Field label="Harekete geçirici (CTA)">
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
            </Field>
            <Field label="Hashtag'ler (boşlukla ayırın)">
              <input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
            </Field>
          </div>
        )}
      </div>

      {/* SAĞ: önizleme + aksiyonlar */}
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="text-sm font-medium text-muted">Önizleme</div>
        <InstagramPreview
          data={{
            businessName: business.name,
            username: igAccount?.username,
            avatarUrl: igAccount?.avatarUrl,
            imageUrl: post?.imageUrl ?? selectedItem?.photoUrl ?? null,
            imageConcept: post?.imageConcept ?? null,
            caption: post ? previewCaption : null,
            format,
          }}
        />

        {note && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              note.kind === "ok"
                ? "border-green/40 bg-green-soft/40 text-fg"
                : "border-orange/50 bg-orange-soft/40 text-fg"
            }`}
          >
            {note.text}
          </div>
        )}

        {post && (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn onClick={onSave} busy={busy === "save"} label="💾 Kaydet" />
              <ActionBtn onClick={onRegenerate} busy={busy === "regen"} label="🔄 Yeniden oluştur" disabled={!aiEnabled} />
              <ActionBtn onClick={onSaveDraft} busy={busy === "draft"} label="📄 Taslağa kaydet" />
              <ActionBtn onClick={onApprove} busy={busy === "approve"} label="✅ Onayla" />
            </div>

            {/* Zamanla */}
            <div className="rounded-lg border border-border bg-bg p-3">
              <label className="mb-1.5 block text-xs font-medium text-muted">
                📅 Zamanla (tarih & saat)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-fg outline-none focus:border-green/50"
                />
                <button
                  type="button"
                  onClick={onSchedule}
                  disabled={!scheduleAt || busy === "schedule"}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-fg transition hover:border-green/50 disabled:opacity-50"
                >
                  {busy === "schedule" ? "…" : "Zamanla"}
                </button>
              </div>
            </div>

            {/* Yayınla */}
            <div>
              {instagramConnected ? (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={busy === "publish"}
                  className="w-full rounded-xl bg-gradient-to-b from-[#25D366] to-[#1eaf57] py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
                >
                  {busy === "publish" ? "Yayınlanıyor…" : "📤 Onayla ve şimdi yayınla"}
                </button>
              ) : (
                <Link
                  href="/dashboard/sosyal/baglanti"
                  className="block w-full rounded-xl border border-border py-2.5 text-center text-sm font-medium text-muted transition hover:border-green/50 hover:text-fg"
                >
                  Yayınlamak için Instagram'ı bağlayın →
                </Link>
              )}
              <p className="mt-2 text-center text-xs text-faint">
                Güvenlik için otomatik paylaşım yoktur; her içerik sizin onayınızla yayınlanır.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}

function ActionBtn({
  onClick,
  busy,
  label,
  disabled,
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="rounded-lg border border-border px-3 py-2 text-sm text-fg transition hover:border-green/50 disabled:opacity-50"
    >
      {busy ? "…" : label}
    </button>
  );
}
