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

export interface ClientItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  photoUrl: string | null;
  isAvailable: boolean;
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
