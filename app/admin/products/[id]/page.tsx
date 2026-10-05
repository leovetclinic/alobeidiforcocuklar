"use client";
import { useEffect, useState } from "react";
import { ArrowRight, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { compressProductImage } from "@/lib/compress-image";
type Image = { imageUrl?: string; url?: string };
type Variant = {
  id?: number;
  colorName: string;
  colorHex: string;
  size: string;
  age: string;
  stock: number;
  active: boolean;
  images: Image[];
  sizeStocks?: Record<string, number>;
};
type Cat = { id: number; name: string; parentId?: number };
const sizeOptions = ["0-3 شهر","3-6 شهر","6-9 شهر","9-12 شهر","12-18 شهر","18-24 شهر","24-36 شهر"];
function groupVariantsByColor(items: Variant[]) {
  const groups = new Map<string, Variant>();
  for (const item of items || []) {
    const key = `${item.colorName || ""}::${item.colorHex || ""}`;
    const size = item.size || item.age || "";
    const current = groups.get(key);
    if (!current) {
      groups.set(key, {
        ...item,
        size: "",
        age: "",
        stock: 0,
        images: item.images || [],
        sizeStocks: size ? { [size]: Number(item.stock || 0) } : {},
      });
    } else {
      if (size) current.sizeStocks = { ...(current.sizeStocks || {}), [size]: Number(item.stock || 0) };
      if ((!current.images || !current.images.length) && item.images?.length) current.images = item.images;
    }
  }
  return Array.from(groups.values());
}
export default function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState(0),
    [p, setP] = useState<any>(null),
    [cats, setCats] = useState<Cat[]>([]),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    params.then((x) => {
      setId(+x.id);
      Promise.all([
        fetch(`/api/products/${x.id}?admin=1`).then((r) => r.json()),
        fetch("/api/categories?admin=1").then((r) => r.json()),
      ]).then(([a, c]) => {
        const product = a.product || a;
        setP({ ...product, variants: groupVariantsByColor(product.variants || []) });
        setCats(c.categories || []);
      });
    });
  }, [params]);
  const change = (k: string, v: any) => setP({ ...p, [k]: v });
  const editV = (i: number, k: string, v: any) =>
    setP({
      ...p,
      variants: p.variants.map((x: Variant, n: number) =>
        n === i ? { ...x, [k]: v } : x,
      ),
    });
  async function upload(i: number, files: FileList | null) {
    if (!files) return;
    for (const original of Array.from(files)) {
      const file = await compressProductImage(original);
      const f = new FormData();
      f.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: f });
      const x = await r.json();
      if (r.ok)
        setP((old: any) => ({
          ...old,
          variants: old.variants.map((v: Variant, n: number) =>
            n === i ? { ...v, images: [...v.images, { url: x.url }] } : v,
          ),
        }));
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const expandedVariants = p.variants.flatMap((v: Variant) => {
      const sizes = Object.entries(v.sizeStocks || {}).filter(([, stock]) => Number(stock) >= 0);
      return sizes.length
        ? sizes.map(([size, stock]) => ({ ...v, id: undefined, size, age: "", stock: Number(stock), sizeStocks: undefined }))
        : [{ ...v, id: undefined, size: v.size || "", stock: Number(v.stock || 0), sizeStocks: undefined }];
    });
    const body = {
      ...p,
      categoryId: +p.categoryId,
      price: +p.price,
      cost: +(p.cost || 0),
      oldPrice: p.oldPrice ? +p.oldPrice : null,
      variants: expandedVariants.map((v: Variant) => ({
        ...v,
        stock: +v.stock,
        images: v.images.map((x: Image) => ({ url: x.url || x.imageUrl })),
      })),
    };
    const r = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setNotice(r.ok ? "تم حفظ تعديلات المنتج" : "تعذر حفظ التعديل");
  }
  if (!p)
    return (
      <main dir="rtl" className="p-8">
        جاري تحميل المنتج...
      </main>
    );
  return (
    <main dir="rtl" className="min-h-screen bg-[#fff9fb] p-4 md:p-8">
      <form onSubmit={save} className="mx-auto max-w-6xl">
        <a href={`/admin?tab=products&product=${new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("returnProduct") || id}`} className="inline-flex gap-2">
          <ArrowRight /> رجوع للمنتجات
        </a>
        <div className="mt-5 flex justify-between">
          <h1 className="text-3xl font-black">تعديل المنتج</h1>
          <button disabled={saving} className="btn-soft">
            <Save /> {saving ? "جاري الحفظ" : "حفظ التعديل"}
          </button>
        </div>
        {notice && <p className="my-4 rounded-xl bg-[#dff0f8] p-3">{notice}</p>}
        <section className="mt-6 grid gap-4 rounded-3xl bg-white p-5 md:grid-cols-2">
          <Field
            label="اسم المنتج"
            value={p.name}
            onChange={(e: any) => change("name", e.target.value)}
          />
          <Field
            label="SKU"
            value={p.sku}
            onChange={(e: any) => change("sku", e.target.value)}
          />
          <label>
            القسم
            <select
              className="input"
              value={p.categoryId || ""}
              onChange={(e) => change("categoryId", e.target.value)}
            >
              <option value="">اختر القسم</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? "↳ " : ""}
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            الجنس
            <select
              className="input"
              value={p.gender || ""}
              onChange={(e) => change("gender", e.target.value)}
            >
              <option value="">بدون</option>
              <option>بناتي</option>
              <option>ولادي</option>
              <option>مشترك</option>
            </select>
          </label>
          <Field
            label="سعر البيع"
            type="number"
            value={p.price}
            onChange={(e: any) => change("price", e.target.value)}
          />
          <Field
            label="سعر التكلفة"
            type="number"
            value={p.cost || 0}
            onChange={(e: any) => change("cost", e.target.value)}
          />
          <Field
            label="السعر القديم"
            type="number"
            value={p.oldPrice || ""}
            onChange={(e: any) => change("oldPrice", e.target.value)}
          />
          <Field
            label="الوصف المختصر"
            value={p.shortDescription || ""}
            onChange={(e: any) => change("shortDescription", e.target.value)}
          />
          <label className="md:col-span-2">
            الوصف الكامل
            <textarea
              className="input min-h-24"
              value={p.description || ""}
              onChange={(e) => change("description", e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-5 md:col-span-2">
            {[
              ["active", "ظاهر"],
              ["newArrival", "وصل حديثاً"],
              ["offer", "عرض"],
              ["featured", "مميز"],
              ["bestSeller", "الأكثر طلباً"],
            ].map(([k, l]) => (
              <label key={k}>
                <input
                  type="checkbox"
                  checked={!!p[k]}
                  onChange={(e) => change(k, e.target.checked)}
                />{" "}
                {l}
              </label>
            ))}
          </div>
        </section>
        <section className="mt-5 rounded-3xl bg-white p-5">
          <div className="flex justify-between">
            <h2 className="text-xl font-black">الألوان والعمر والقياس والصور</h2>
            <button
              type="button"
              className="btn-soft"
              onClick={() =>
                change("variants", [
                  ...p.variants,
                  {
                    colorName: "",
                    colorHex: "#f3b6c2",
                    size: "",
                    age: "",
                    stock: 0,
                    active: true,
                    images: [],
                  },
                ])
              }
            >
              <Plus /> إضافة قياس أو لون
            </button>
          </div>
          {p.variants.map((v: Variant, i: number) => (
            <div key={i} className="mt-4 rounded-2xl border p-4">
              <div className="grid items-end gap-3 md:grid-cols-[1fr_90px_1fr_auto_auto]">
                <label className="text-sm font-bold">
                  اللون
                  <input className="input" placeholder="مثلاً: سمائي" value={v.colorName || ""} onChange={(e) => editV(i, "colorName", e.target.value)} />
                </label>
                <input type="color" value={v.colorHex || "#eeeeee"} onChange={(e) => editV(i, "colorHex", e.target.value)} className="h-12 w-full rounded-xl" aria-label="لون المنتج" />
                <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed p-2 text-xs font-bold">
                  {v.images[0] ? <img src={v.images[0].url || v.images[0].imageUrl} className="size-16 rounded-lg object-cover" /> : <span className="grid size-16 place-items-center rounded-lg bg-stone-50"><ImagePlus /></span>}
                  صور هذا اللون (ترفع مرة واحدة)
                  <input hidden type="file" multiple accept="image/*" onChange={(e) => upload(i, e.target.files)} />
                </label>
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => change("variants", [...p.variants, { colorName: "", colorHex: "#f3b6c2", size: "", age: "", stock: 0, active: true, images: [], sizeStocks: {} }])}
                >
                  <Plus /> لون آخر
                </button>
                <button type="button" className="text-red-600" onClick={() => change("variants", p.variants.filter((_: Variant, n: number) => n !== i))} aria-label="حذف اللون">
                  <Trash2 />
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-[#fff9fb] p-4">
                <b>حددي القياسات المتوفرة لهذا اللون والكمية لكل قياس:</b>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sizeOptions.map((size) => {
                    const checked = Object.prototype.hasOwnProperty.call(v.sizeStocks || {}, size);
                    return (
                      <label key={size} className={`flex items-center gap-2 rounded-xl border p-3 ${checked ? "border-[#d58fa7] bg-[#fff1f6]" : "bg-white"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = { ...(v.sizeStocks || {}) };
                            if (e.target.checked) next[size] = 0;
                            else delete next[size];
                            editV(i, "sizeStocks", next);
                          }}
                        />
                        <span className="flex-1 font-bold">{size}</span>
                        {checked && <input type="number" min="0" value={(v.sizeStocks || {})[size] ?? 0} onChange={(e) => editV(i, "sizeStocks", { ...(v.sizeStocks || {}), [size]: +e.target.value })} className="input !mt-0 w-20" aria-label={`كمية ${size}`} />}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {v.images.map((x, j) => (
                  <div key={j} className="relative">
                    <img src={x.url || x.imageUrl} className="size-24 rounded-xl object-cover" />
                    <button type="button" onClick={() => editV(i, "images", v.images.filter((_, n) => n !== j))} className="absolute -left-1 -top-1 rounded-full bg-red-600 px-2 text-white">×</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </form>
    </main>
  );
}
function Field({ label, ...p }: any) {
  return (
    <label>
      {label}
      <input
        {...p}
        min={p.type === "number" ? 0 : undefined}
        className="input"
      />
    </label>
  );
}
