"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createCategory,
  renameCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
  toggleItemAvailability,
  bulkCreateItems,
  type ActionState,
} from "@/lib/actions/menu";
import { formatTL } from "@/lib/url";
import { PhotoUpload } from "@/components/photo-upload";
import { setCategoryImage } from "@/lib/actions/menu";
import { ALLERGENS, MEAT_TYPES } from "@/lib/compliance";

export interface ClientItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  photoUrl: string | null;
  isAvailable: boolean;
  calories: number | null;
  protein: string | null;
  fat: string | null;
  carbs: string | null;
  allergens: string[];
  meatType: string | null;
  containsAlcohol: boolean;
  containsPork: boolean;
}
export interface ClientCategory {
  id: string;
  name: string;
  imageUrl: string | null;
  items: ClientItem[];
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition placeholder:text-faint focus:border-green focus:ring-2 focus:ring-green/20";

/* ── Kategori ekle ────────────────────────────────────────────── */
export function AddCategoryForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createCategory,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-wrap items-start gap-2"
    >
      <div className="flex-1">
        <input
          name="name"
          placeholder="Yeni kategori (ör. Kahveler)"
          className={inputCls}
          required
        />
        {state.error && <p className="mt-1 text-xs text-orange">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
      >
        {pending ? "Ekleniyor…" : "Kategori ekle"}
      </button>
    </form>
  );
}

/* ── Kategori kartı ───────────────────────────────────────────── */
export function CategoryCard({ category }: { category: ClientCategory }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-border bg-surface">
      {/* Başlık */}
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              autoFocus
            />
            <button
              onClick={() => {
                startTransition(async () => {
                  await renameCategory(category.id, name);
                  setEditing(false);
                });
              }}
              className="rounded-lg bg-green px-3 py-2 text-sm font-semibold text-black"
            >
              Kaydet
            </button>
            <button
              onClick={() => {
                setName(category.name);
                setEditing(false);
              }}
              className="text-sm text-faint hover:text-fg"
            >
              İptal
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold">
              {category.name}{" "}
              <span className="text-sm font-normal text-faint">
                ({category.items.length})
              </span>
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={() => setEditing(true)}
                className="text-muted hover:text-fg"
              >
                Yeniden adlandır
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `"${category.name}" kategorisi ve içindeki tüm ürünler silinsin mi?`,
                    )
                  ) {
                    startTransition(() => deleteCategory(category.id));
                  }
                }}
                className="text-faint hover:text-orange"
                disabled={pending}
              >
                Sil
              </button>
            </div>
          </>
        )}
      </header>

      {/* Kategori kapağı (menüde kart görseli) */}
      <div className="border-b border-border px-4 py-3">
        <PhotoUpload
          label="Kategori kapağı (menüde kart görseli olarak görünür)"
          initialUrl={category.imageUrl}
          onChange={(url) =>
            startTransition(() => setCategoryImage(category.id, url))
          }
        />
      </div>

      {/* Ürünler */}
      <div className="divide-y divide-border">
        {category.items.length === 0 && !adding && (
          <p className="px-4 py-5 text-sm text-faint">
            Bu kategoride henüz ürün yok.
          </p>
        )}
        {category.items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>

      {/* Ürün ekle */}
      <div className="border-t border-border p-4">
        {adding ? (
          <AddItemForm categoryId={category.id} onDone={() => setAdding(false)} />
        ) : bulk ? (
          <BulkAddForm categoryId={category.id} onDone={() => setBulk(false)} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAdding(true)}
              className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted transition hover:border-green/50 hover:text-fg"
            >
              + Ürün ekle
            </button>
            <button
              onClick={() => setBulk(true)}
              className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted transition hover:border-green/50 hover:text-fg"
            >
              Toplu ekle (liste yapıştır)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Ürün satırı (görüntüle / düzenle) ────────────────────────── */
function ItemRow({ item }: { item: ClientItem }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="p-4">
        <ItemForm
          mode="edit"
          item={item}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-4 ${
        item.isAvailable ? "" : "opacity-60"
      }`}
    >
      {item.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photoUrl}
          alt={item.name}
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface-2">
          🍽️
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
          {!item.isAvailable && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-faint">
              stokta yok
            </span>
          )}
        </div>
        {item.description && (
          <p className="truncate text-sm text-muted">{item.description}</p>
        )}
      </div>
      <span className="shrink-0 font-semibold text-orange">
        {formatTL(item.price)}
      </span>
      <div className="flex shrink-0 items-center gap-2 text-sm">
        <button
          onClick={() => startTransition(() => toggleItemAvailability(item.id))}
          className="text-muted hover:text-fg"
          disabled={pending}
          title={item.isAvailable ? "Stoktan kaldır" : "Stoğa ekle"}
        >
          {item.isAvailable ? "Gizle" : "Göster"}
        </button>
        <button
          onClick={() => setEditing(true)}
          className="text-muted hover:text-fg"
        >
          Düzenle
        </button>
        <button
          onClick={() => {
            if (confirm(`"${item.name}" silinsin mi?`)) {
              startTransition(() => deleteItem(item.id));
            }
          }}
          className="text-faint hover:text-orange"
          disabled={pending}
        >
          Sil
        </button>
      </div>
    </div>
  );
}

/* ── Ürün ekleme formu ────────────────────────────────────────── */
function AddItemForm({
  categoryId,
  onDone,
}: {
  categoryId: string;
  onDone: () => void;
}) {
  return <ItemForm mode="create" categoryId={categoryId} onDone={onDone} />;
}

/* ── Toplu ürün ekle (liste yapıştır) ─────────────────────────── */
function BulkAddForm({
  categoryId,
  onDone,
}: {
  categoryId: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    bulkCreateItems,
    {},
  );
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="categoryId" value={categoryId} />
      <p className="text-xs text-faint">
        Her satıra bir ürün yaz:{" "}
        <code className="text-muted">Ürün adı | açıklama | fiyat</code>
        <br />
        Açıklama opsiyonel: <code className="text-muted">Ürün adı | fiyat</code> de olur.
      </p>
      <textarea
        name="text"
        rows={7}
        placeholder={"Sütlaç | Tarçınlı fırın sütlaç | 120\nBaklava | Fındıklı geleneksel baklava | 160\nTürk Kahvesi | 70"}
        className={`${inputCls} font-mono`}
        required
      />
      {state.error && <p className="text-sm text-orange">{state.error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
        >
          {pending ? "Ekleniyor…" : "Toplu ekle"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-faint hover:text-fg">
          İptal
        </button>
      </div>
    </form>
  );
}

/* ── Ortak ürün formu (ekle & düzenle) ────────────────────────── */
function ItemForm({
  mode,
  categoryId,
  item,
  onDone,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  item?: ClientItem;
  onDone: () => void;
}) {
  const action = mode === "create" ? createItem : updateItem;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      {mode === "create" && (
        <input type="hidden" name="categoryId" value={categoryId} />
      )}
      {mode === "edit" && <input type="hidden" name="id" value={item!.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          ref={nameRef}
          name="name"
          defaultValue={item?.name}
          placeholder="Ürün adı"
          className={inputCls}
          required
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={item?.price}
          placeholder="Fiyat (₺)"
          className={inputCls}
          required
        />
      </div>
      <textarea
        name="description"
        defaultValue={item?.description ?? ""}
        placeholder="Açıklama (opsiyonel)"
        rows={2}
        className={inputCls}
      />
      <PhotoUpload
        name="photoUrl"
        initialUrl={item?.photoUrl ?? null}
        getQuery={() => nameRef.current?.value ?? ""}
      />

      {/* Yasal uyumluluk (opsiyonel) */}
      <details className="rounded-lg border border-border bg-surface-2/40 p-3">
        <summary className="cursor-pointer text-sm font-medium text-muted">
          İçerik & besin değerleri{" "}
          <span className="text-xs text-faint">(opsiyonel · mevzuata uyumluluk)</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input name="calories" type="number" min="0" defaultValue={item?.calories ?? ""} placeholder="Kalori (kcal)" className={inputCls} />
            <input name="protein" type="number" step="0.1" min="0" defaultValue={item?.protein ?? ""} placeholder="Protein (g)" className={inputCls} />
            <input name="fat" type="number" step="0.1" min="0" defaultValue={item?.fat ?? ""} placeholder="Yağ (g)" className={inputCls} />
            <input name="carbs" type="number" step="0.1" min="0" defaultValue={item?.carbs ?? ""} placeholder="Karb. (g)" className={inputCls} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-faint">Et türü (varsa)</label>
            <select name="meatType" defaultValue={item?.meatType ?? ""} className={inputCls}>
              <option value="">— yok / belirtme —</option>
              {MEAT_TYPES.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-faint">Alerjenler</label>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGENS.map((a) => (
                <label
                  key={a.key}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted"
                >
                  <input
                    type="checkbox"
                    name="allergens"
                    value={a.key}
                    defaultChecked={item?.allergens?.includes(a.key)}
                    className="accent-green"
                  />
                  <span>{a.icon}</span>
                  {a.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="containsAlcohol" defaultChecked={item?.containsAlcohol} className="accent-orange" />
              Alkol içerir
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="containsPork" defaultChecked={item?.containsPork} className="accent-orange" />
              Domuz türevi içerir
            </label>
          </div>
        </div>
      </details>

      {state.error && <p className="text-sm text-orange">{state.error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
        >
          {pending
            ? "Kaydediliyor…"
            : mode === "create"
              ? "Ürünü ekle"
              : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-faint hover:text-fg"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
