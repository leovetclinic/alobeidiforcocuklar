"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Baby,
  Bell,
  Boxes,
  LayoutDashboard,
  PackagePlus,
  Settings as SettingsIcon,
  LogIn,
  Plus,
  Trash2,
  ImagePlus,
  Eye,
  EyeOff,
  Search,
  ShoppingCart,
  Tags,
  ExternalLink,
  Save,
} from "lucide-react";
import { compressProductImage } from "@/lib/compress-image";
type Img = {
  key?: string;
  url?: string;
  imageUrl?: string;
  objectKey?: string;
};
type V = {
  id?: number;
  colorName: string;
  colorHex: string;
  size: string;
  age: string;
  stock: number;
  images: Img[];
};
type P = {
  id: number;
  name: string;
  sku: string;
  categoryId: number | null;
  price: number;
  cost: number;
  oldPrice: number | null;
  gender: string | null;
  active: boolean;
  featured: boolean;
  newArrival: boolean;
  offer: boolean;
  variants: (V & { id: number })[];
};
type Cat = { id: number; name: string; parentId: number | null };
const blank = (): V => ({
  colorName: "",
  colorHex: "#eeb5c3",
  size: "",
  age: "",
  stock: 0,
  images: [],
});
const sizeOptions = ["0-3 شهر","3-6 شهر","6-9 شهر","9-12 شهر","12-18 شهر","18-24 شهر","24-36 شهر"];
const themeDefaults={themeBackground:"#fff9fb",themeText:"#55434c",themePrimary:"#d58fa7",themeSecondary:"#b56d86",themeSoft:"#f8dce6",themeAccent:"#dff0f8",themeBorder:"#eadfd2",themeFooter:"#55434c"};
export default function Admin() {
  const [auth, setAuth] = useState<boolean | null>(null),
    [tab, setTab] = useState("dashboard"),
    [products, setProducts] = useState<P[]>([]),
    [categories, setCategories] = useState<Cat[]>([]),
    [orders, setOrders] = useState<any[]>([]),
    [variants, setVariants] = useState<V[]>([blank()]),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false),
    [settings, setSettings] = useState<Record<string, string>>({}),
    [search, setSearch] = useState(""),
    [gender, setGender] = useState(""),
    [color, setColor] = useState(""),
    [age, setAge] = useState("");
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((x) => {
        setAuth(x.authenticated);
        if (x.authenticated) load();
      });
  }, []);
  async function load() {
    const [p, c, s, o] = await Promise.all([
      fetch("/api/products?admin=1").then((r) => r.json()),
      fetch("/api/categories?admin=1").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ]);
    setProducts(p.products || []);
    setCategories(c.categories || []);
    setSettings(s);
    setOrders(o.orders || []);
  }
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget),
      r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: d.get("username"),
          password: d.get("password"),
        }),
      });
    if (r.ok) {
      const next = new URLSearchParams(location.search).get("next");
      if (next?.startsWith("/admin/")) location.href = next;
      else { setAuth(true); load(); }
    } else setNotice((await r.json()).error);
  }
  async function upload(i: number, files: FileList | null) {
    for (const original of Array.from(files || [])) {
      const file = await compressProductImage(original);
      const f = new FormData();
      f.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: f }),
        img = await r.json();
      if (r.ok)
        setVariants((a) =>
          a.map((v, n) => (n === i ? { ...v, images: [...v.images, img] } : v)),
        );
      else setNotice(img.error);
    }
  }
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const d = new FormData(e.currentTarget),
      r = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: d.get("name"),
          sku: d.get("sku"),
          categoryId: d.get("categoryId"),
          price: +(d.get("price") || 0),
          cost: +(d.get("cost") || 0),
          oldPrice: +(d.get("oldPrice") || 0) || null,
          gender: d.get("gender"),
          shortDescription: d.get("shortDescription"),
          description: d.get("description"),
          newArrival: !!d.get("newArrival"),
          offer: !!d.get("offer"),
          featured: !!d.get("featured"),
          bestSeller: !!d.get("bestSeller"),
          variants,
        }),
      });
    setSaving(false);
    const result = await r.json();
    setNotice(r.ok ? "تم حفظ المنتج بنجاح" : result.error || "تعذر حفظ المنتج");
    if (r.ok) {
      e.currentTarget.reset();
      setVariants([blank()]);
      load();
    }
  }
  async function remove(id: number) {
    if (!confirm("هل تريد حذف المنتج نهائياً؟")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setNotice("تم حذف المنتج");
    load();
  }
  async function toggle(p: P) {
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...p, active: !p.active }),
    });
    load();
  }
  async function stock(productId: number, variantId: number, value: number) {
    await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "stock", variantId, stock: value }),
    });
    setNotice("تم حفظ المخزون");
    load();
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    setNotice("تم حفظ الإعدادات");
  }
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!search || p.name.includes(search) || p.sku.includes(search)) &&
          (!gender || p.gender === gender) &&
          (!color || p.variants.some((v) => v.colorName === color)) &&
          (!age || p.variants.some((v) => v.age === age)),
      ),
    [products, search, gender, color, age],
  );
  if (auth === null) return <Center>جاري التحميل...</Center>;
  if (!auth)
    return (
      <main
        dir="rtl"
        className="grid min-h-screen place-items-center bg-[#fff9fb] p-4"
      >
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl"
        >
          {settings.logo ? (
            <img
              src={settings.logo}
              className="mx-auto size-24 rounded-full object-cover"
            />
          ) : (
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-[#dff0f8]">
              <Baby />
            </span>
          )}
          <h1 className="mt-4 text-center text-2xl font-black">
            دخول إدارة العبيدي
          </h1>
          <input
            name="username"
            required
            placeholder="اسم المستخدم"
            className="input"
          />
          <input
            name="password"
            required
            type="password"
            placeholder="كلمة المرور"
            className="input"
          />
          {notice && <p className="mt-3 text-red-600">{notice}</p>}
          <button className="mt-5 flex w-full justify-center gap-2 rounded-xl bg-[#d58fa7] py-3 font-bold text-white">
            <LogIn /> دخول
          </button>
        </form>
      </main>
    );
  const totalStock = products
      .flatMap((p) => p.variants)
      .reduce((s, v) => s + v.stock, 0),
    threshold = +(settings.lowStock || 3),
    lowItems = products
      .flatMap((p) => p.variants.map((v) => ({ p, v })))
      .filter((x) => x.v.stock <= threshold),
    pending = orders.filter(
      (o) => o.status === "pending" && !o.inventoryApplied,
    ),
    shipping = orders.filter((o) => o.status === "shipping"),
    alerts = pending.length + shipping.length + lowItems.length;
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#fff9fb] md:grid md:grid-cols-[260px_1fr]"
    >
      <aside className="bg-[#55434c] p-5 text-white">
        <div className="flex items-start justify-between">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Baby /> إدارة العبيدي
          </h1>
          <details className="relative z-50">
            <summary className="relative cursor-pointer list-none rounded-full bg-white/10 p-2">
              <Bell />
              {alerts > 0 && (
                <b className="absolute -left-2 -top-2 grid size-6 place-items-center rounded-full bg-red-500 text-xs">
                  {alerts}
                </b>
              )}
            </summary>
            <div className="fixed inset-x-3 top-20 z-[100] max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-4 text-[#55434c] shadow-2xl md:right-[280px] md:left-auto md:w-96">
              <div className="sticky top-0 -mx-1 mb-2 flex items-center justify-between bg-white p-1">
                <b>التنبيهات</b>
                <small>{alerts} تنبيه</small>
              </div>
              {pending.map((o) => (
                <a
                  key={o.id}
                  href={`/admin/sales#order-${o.id}`}
                  className="mt-2 block rounded-xl bg-[#fff4f7] p-3"
                >
                  طلب جديد من {o.customerName} بانتظار الموافقة
                </a>
              ))}
              {shipping.map((o) => (
                <a key={`shipping-${o.id}`} href={`/admin/sales#order-${o.id}`} className="mt-2 block rounded-xl bg-[#dff0f8] p-3">
                  🚚 الطلب {o.orderNumber} لدى شركة الشحن — افتحه وأكد إذا وصل
                </a>
              ))}
              {lowItems.map(({ p, v }) => (
                <button
                  key={v.id}
                  onClick={() => setTab("inventory")}
                  className="mt-2 block w-full rounded-xl bg-amber-50 p-3 text-right"
                >
                  {p.name} – {v.colorName || "بدون لون"}:{" "}
                  {v.stock === 0 ? "نفذت الكمية" : `بقي ${v.stock} فقط`}
                </button>
              ))}
              {alerts === 0 && <p className="mt-3">ماكو تنبيهات حالياً 🤍</p>}
            </div>
          </details>
        </div>
        <div className="mt-5 grid gap-2">
          <a
            href="/"
            target="_blank"
            className="flex gap-2 rounded-xl bg-[#dff0f8] p-3 font-bold text-[#55434c]"
          >
            <ExternalLink /> واجهة الزبون
          </a>
          <a
            href="/admin/sales"
            className="flex gap-2 rounded-xl bg-[#f8dce6] p-3 font-bold text-[#55434c]"
          >
            <ShoppingCart /> المبيعات{" "}
            {pending.length > 0 && <b>({pending.length})</b>}
          </a>
          <a
            href="/admin/categories"
            className="flex gap-2 rounded-xl bg-white/10 p-3"
          >
            <Tags /> الأقسام
          </a>
        </div>
        <nav className="mt-5 space-y-2">
          {[
            ["dashboard", "الرئيسية", LayoutDashboard],
            ["add", "إضافة منتج", PackagePlus],
            ["products", "المنتجات", Boxes],
            ["inventory", "المخزن", Boxes],
            ["settings", "الإعدادات", SettingsIcon],
          ].map(([id, label, I]: any) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex w-full gap-2 rounded-xl p-3 ${tab === id ? "bg-white/15" : ""}`}
            >
              <I />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 p-4 md:p-8">
        {notice && (
          <div className="mb-5 rounded-xl bg-[#dff0f8] p-3">
            {notice}
            <button onClick={() => setNotice("")} className="float-left">
              ×
            </button>
          </div>
        )}
        {tab === "dashboard" && (
          <>
            <h2 className="text-3xl font-black">لوحة المتجر</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <Stat n={products.length} l="المنتجات" />
              <Stat n={totalStock} l="إجمالي المخزون" />
              <Stat n={lowItems.length} l="تنبيهات المخزون" />
              <Stat n={pending.length} l="طلبات تنتظر الموافقة" />
            </div>
          </>
        )}
        {tab === "add" && (
          <ProductForm
            categories={categories}
            variants={variants}
            setVariants={setVariants}
            upload={upload}
            save={add}
            saving={saving}
          />
        )}{" "}
        {tab === "products" && (
          <Products
            products={filtered}
            all={products}
            search={search}
            setSearch={setSearch}
            gender={gender}
            setGender={setGender}
            color={color}
            setColor={setColor}
            age={age}
            setAge={setAge}
            toggle={toggle}
            remove={remove}
          />
        )}{" "}
        {tab === "inventory" && (
          <Inventory
            products={filtered}
            search={search}
            setSearch={setSearch}
            stock={stock}
          />
        )}{" "}
        {tab === "settings" && (
          <SettingsForm
            settings={settings}
            setSettings={setSettings}
            save={saveSettings}
          />
        )}
      </main>
    </div>
  );
}
function ProductForm({
  categories,
  variants,
  setVariants,
  upload,
  save,
  saving,
}: any) {
  return (
    <>
      <h2 className="text-3xl font-black">إضافة منتج</h2>
      <form onSubmit={save} className="mt-5 space-y-5">
        <section className="grid gap-4 rounded-3xl bg-white p-5 md:grid-cols-2">
          <Field name="name" label="اسم المنتج *" required />
          <Field name="sku" label="كود المنتج *" required />
          <label>
            القسم *
            <select name="categoryId" required className="input">
              <option value="">اختر القسم</option>
              {categories.map((c: Cat) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? "↳ " : ""}
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            الجنس
            <select name="gender" className="input">
              <option value="">بدون</option>
              <option>بناتي</option>
              <option>ولادي</option>
              <option>مشترك</option>
            </select>
          </label>
          <Field name="price" label="سعر البيع *" type="number" required />
          <div>
            <Field
              name="cost"
              label="سعر الجملة (خاص بالإدارة فقط)"
              type="number"
            />
            <small>
              لا يظهر هذا السعر للزبون ويُستخدم فقط لحساب صافي الربح.
            </small>
          </div>
          <Field name="oldPrice" label="السعر القديم" type="number" />
          <Field name="shortDescription" label="الوصف المختصر" />
          <label className="md:col-span-2">
            الوصف الكامل
            <textarea name="description" className="input min-h-24" />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-5">
            <Check name="newArrival" label="وصل حديثاً" />
            <Check name="offer" label="عرض" />
            <Check name="featured" label="مميز" />
            <Check name="bestSeller" label="الأكثر طلباً" />
          </div>
        </section>
        <section className="rounded-3xl bg-white p-5">
          <div className="flex justify-between">
            <h3 className="text-xl font-black">الألوان والعمر والقياس والصور</h3>
            <button
              type="button"
              onClick={() => setVariants((v: V[]) => [...v, blank()])}
              className="btn-soft"
            >
              <Plus /> إضافة قياس أو لون
            </button>
          </div>
          {variants.map((v: V, i: number) => (
            <div key={i} className="mt-4 rounded-2xl border p-4">
              <div className="grid items-end gap-3 md:grid-cols-6">
                <input
                  value={v.colorName}
                  onChange={(e) =>
                    setVariants((a: V[]) =>
                      a.map((x, n) =>
                        n === i ? { ...x, colorName: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="اللون"
                  className="input"
                />
                <input
                  type="color"
                  value={v.colorHex}
                  onChange={(e) =>
                    setVariants((a: V[]) =>
                      a.map((x, n) =>
                        n === i ? { ...x, colorHex: e.target.value } : x,
                      ),
                    )
                  }
                />
                <label className="text-sm font-bold">العمر والقياس<input list="size-options-new" value={v.size||v.age} onChange={(e)=>setVariants((a:V[])=>a.map((x,n)=>n===i?{...x,size:e.target.value,age:""}:x))} className="input" placeholder="اختر أو اكتب قياساً جديداً" /><datalist id="size-options-new">{sizeOptions.map(s=><option key={s} value={s}/>)}</datalist></label>
                <label className="text-sm font-bold">
                  الكمية في المخزن
                  <input type="number" min="0" value={v.stock} onChange={(e) => setVariants((a: V[]) => a.map((x, n) => n === i ? { ...x, stock: +e.target.value } : x))} className="input" />
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed p-2 text-xs font-bold">
                  {v.images[0] ? <img src={v.images[0].url || v.images[0].imageUrl} className="size-16 rounded-lg object-cover" /> : <span className="grid size-16 place-items-center rounded-lg bg-stone-50"><ImagePlus /></span>}
                  الصورة
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(i, e.target.files)} />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setVariants((a: V[]) => a.filter((_, n) => n !== i))
                  }
                  className="text-red-600"
                >
                  <Trash2 />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setVariants((a: V[]) => [...a, { ...v, id: undefined, size: "", age: "", stock: 0, images: [...v.images] }])}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#eef7f3] px-4 py-2 font-bold text-[#527465]"
              >
                <Plus className="size-4" /> إضافة قياس آخر لنفس المنتج
              </button>
              <p className="mt-2 text-xs text-stone-500">القياس الجديد يأخذ الصورة نفسها تلقائياً، ويمكن الضغط على الصورة لإضافة صور أخرى.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {v.images.map((img, j) => (
                  <div key={j} className="relative">
                    <img
                      src={img.url || img.imageUrl}
                      className="size-24 rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((a: V[]) =>
                          a.map((x, n) =>
                            n === i
                              ? {
                                  ...x,
                                  images: x.images.filter((_, k) => k !== j),
                                }
                              : x,
                          ),
                        )
                      }
                      className="absolute -left-1 -top-1 rounded-full bg-red-600 px-2 text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        <button
          disabled={saving}
          className="rounded-xl bg-[#d58fa7] px-8 py-3 font-bold text-white"
        >
          {saving ? "جاري الحفظ..." : "حفظ المنتج"}
        </button>
      </form>
    </>
  );
}
function Products({
  products,
  all,
  search,
  setSearch,
  gender,
  setGender,
  color,
  setColor,
  age,
  setAge,
  toggle,
  remove,
}: any) {
  const colors = [
      ...new Set(
        all
          .flatMap((p: P) => p.variants.map((v) => v.colorName))
          .filter(Boolean),
      ),
    ],
    ages = [
      ...new Set(
        all.flatMap((p: P) => p.variants.map((v) => v.age)).filter(Boolean),
      ),
    ];
  return (
    <>
      <h2 className="text-3xl font-black">المنتجات</h2>
      <Filters
        search={search}
        setSearch={setSearch}
        gender={gender}
        setGender={setGender}
        color={color}
        setColor={setColor}
        age={age}
        setAge={setAge}
        colors={colors}
        ages={ages}
      />
      <div className="mt-5 overflow-x-auto rounded-2xl bg-white">
        <table className="w-full min-w-[850px] text-right">
          <thead>
            <tr>
              <th>#</th>
              <th>الصورة</th>
              <th>SKU</th>
              <th>المنتج</th>
              <th>الجنس</th>
              <th>السعر</th>
              <th>المخزون</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: P, i: number) => (
              <tr key={p.id} className="border-t">
                <td>{i + 1}</td>
                <td>
                  {p.variants[0]?.images[0] && (
                    <img
                      src={
                        p.variants[0].images[0].url ||
                        p.variants[0].images[0].imageUrl
                      }
                      className="size-14 rounded-xl object-cover"
                    />
                  )}
                </td>
                <td>{p.sku}</td>
                <td>
                  <b>{p.name}</b>
                </td>
                <td>{p.gender || "—"}</td>
                <td>{p.price.toLocaleString()} د.ع</td>
                <td>{p.variants.reduce((s, v) => s + v.stock, 0)}</td>
                <td>
                  <a
                    href={`/admin/products/${p.id}`}
                    className="ml-3 font-bold text-[#b56d86]"
                  >
                    تعديل
                  </a>
                  <button onClick={() => toggle(p)} className="ml-3">
                    {p.active ? <EyeOff /> : <Eye />}
                  </button>
                  <button onClick={() => remove(p.id)} className="text-red-600">
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Inventory({ products, search, setSearch, stock }: any) {
  const [draft, setDraft] = useState<Record<number, number>>({});
  return (
    <>
      <h2 className="text-3xl font-black">المخزن</h2>
      <div className="relative mt-4 max-w-md">
        <Search className="absolute right-3 top-3" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم المنتج"
          className="input pr-11"
        />
      </div>
      <div className="mt-5 space-y-3">
        {products.flatMap((p: P) =>
          p.variants.map((v) => (
            <div
              key={v.id}
              className="grid items-center gap-3 rounded-2xl bg-white p-4 md:grid-cols-[1fr_1fr_130px_160px]"
            >
              <b>{p.name}</b>
              <span>
                {v.colorName} {v.size && `• ${v.size}`} {v.age && `• ${v.age}`}
              </span>
              <span>
                {v.stock === 0
                  ? "🔴 نفذت"
                  : v.stock <= 3
                    ? "🟠 قليل"
                    : "🟢 متوفر"}
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={draft[v.id!] ?? v.stock}
                  onChange={(e) =>
                    setDraft({ ...draft, [v.id!]: +e.target.value })
                  }
                  className="input w-20"
                />
                <button
                  onClick={() => stock(p.id, v.id, draft[v.id!] ?? v.stock)}
                  className="rounded-xl bg-[#dff0f8] p-3"
                  title="حفظ"
                >
                  <Save />
                </button>
              </div>
            </div>
          )),
        )}
      </div>
    </>
  );
}
function Filters({
  search,
  setSearch,
  gender,
  setGender,
  color,
  setColor,
  age,
  setAge,
  colors,
  ages,
}: any) {
  return (
    <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث بالاسم أو SKU"
        className="input"
      />
      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        className="input"
      >
        <option value="">كل الأجناس</option>
        <option>بناتي</option>
        <option>ولادي</option>
        <option>مشترك</option>
      </select>
      <select
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="input"
      >
        <option value="">كل الألوان</option>
        {colors.map((x: string) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        value={age}
        onChange={(e) => setAge(e.target.value)}
        className="input"
      >
        <option value="">كل الأعمار</option>
        {ages.map((x: string) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </div>
  );
}
function SettingsForm({ settings, setSettings, save }: any) {
  const [passwordMessage,setPasswordMessage]=useState("");
  const [passwordBusy,setPasswordBusy]=useState(false);
  async function changePassword(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setPasswordBusy(true);setPasswordMessage("");
    const form=e.currentTarget,d=new FormData(form);
    const r=await fetch("/api/auth/change-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({currentPassword:d.get("currentPassword"),newPassword:d.get("newPassword"),confirmPassword:d.get("confirmPassword")})});
    const x=await r.json();setPasswordMessage(x.message||x.error||"تعذر تغيير كلمة السر");setPasswordBusy(false);if(r.ok)form.reset();
  }
  async function logo(file?: File) {
    if (!file) return;
    const f = new FormData();
    f.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: f }),
      x = await r.json();
    if (r.ok) {
      const next = { ...settings, logo: x.url };
      setSettings(next);
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
    }
  }
  const fields = [
    ["storeName", "اسم المتجر"],
    ["phone", "الهاتف"],
    ["whatsapp", "WhatsApp"],
    ["address", "العنوان"],
    ["maps", "Google Maps"],
    ["instagram", "Instagram"],
    ["facebook", "Facebook"],
    ["lowStock", "حد المخزون القليل"],
    ["baghdadDeliveryFee", "أجرة توصيل بغداد (د.ع)"],
    ["provinceDeliveryFee", "أجرة توصيل باقي المحافظات (د.ع)"],
    ["paymentMethodsTitle", "عنوان قسم طرق الدفع في نهاية الموقع"],
    ["paymentMethodsSubtitle", "النص التوضيحي أسفل عنوان طرق الدفع"],
  ];
  return (
    <>
      <div className="flex justify-between">
        <h2 className="text-3xl font-black">الإعدادات</h2>
        <div className="flex gap-2">
          <a href="/admin/banners" className="btn-soft">
            البنرات
          </a>
          <a href="/admin/categories" className="btn-soft">
            الأقسام
          </a>
          <a href="/admin/effects" className="btn-soft">
            المؤثرات الموسمية
          </a>
          <a href="/admin/payments" className="btn-soft">
            طرق الدفع
          </a>
        </div>
      </div>
      <form
        onSubmit={save}
        className="mt-5 grid gap-4 rounded-3xl bg-white p-5 md:grid-cols-2"
      >
        <div className="flex items-center gap-4 md:col-span-2">
          {settings.logo ? (
            <img
              src={settings.logo}
              className="size-24 rounded-full object-cover"
            />
          ) : (
            <Baby />
          )}
          <label className="cursor-pointer rounded-xl border-2 border-dashed p-4">
            <ImagePlus className="inline" /> تغيير الشعار
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => logo(e.target.files?.[0])}
            />
          </label>
        </div>
        {fields.map(([k, l]) => (
          <label key={k}>
            {l}
            <input
              value={settings[k] || ""}
              onChange={(e) =>
                setSettings({ ...settings, [k]: e.target.value })
              }
              className="input"
            />
          </label>
        ))}
        <section className="rounded-2xl bg-[#fff9fb] p-4 md:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black">ألوان الموقع</h3><p className="text-sm text-stone-500">غيّر الألوان وشاهدها بالواجهة بعد الحفظ.</p></div><button type="button" onClick={()=>setSettings({...settings,...themeDefaults})} className="rounded-xl border bg-white px-4 py-2 font-bold">إرجاع الألوان الافتراضية</button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["themeBackground","خلفية الموقع"],["themeText","لون الكتابة"],["themePrimary","اللون الرئيسي والأزرار"],["themeSecondary","لون العناوين الثانوية"],["themeSoft","اللون الناعم الأول"],["themeAccent","اللون الناعم الثاني"],["themeBorder","لون الحدود"],["themeFooter","لون نهاية الموقع"]].map(([k,l])=><label key={k}>{l}<input type="color" value={settings[k]||themeDefaults[k as keyof typeof themeDefaults]} onChange={e=>setSettings({...settings,[k]:e.target.value})} className="input h-12"/></label>)}</div>
        </section>
        <label className="md:col-span-2">
          دليل المقاسات (كل سطر: المقاس | الفئة العمرية | الوزن)
          <textarea
            className="input min-h-72 font-mono text-sm"
            value={settings.sizeGuide || ""}
            onChange={(e) => setSettings({ ...settings, sizeGuide: e.target.value })}
            placeholder="0-3 أشهر | حديث ولادة | 3 إلى 4.5 كيلو"
          />
          <small>تقدر تعدّل أي سطر، تمسحه، أو تضيف سطراً جديداً بنفس ترتيب الفواصل.</small>
        </label>
        <label className="md:col-span-2">
          نص حقوق النشر
          <input className="input" value={settings.copyright || ""} onChange={(e)=>setSettings({...settings,copyright:e.target.value})}/>
        </label>
        <label className="md:col-span-2">
          شروط الشحن التي تظهر بنهاية الطلب
          <textarea
            className="input min-h-36"
            value={settings.shippingTerms || ""}
            onChange={(e) => setSettings({ ...settings, shippingTerms: e.target.value })}
          />
        </label>
        <button className="rounded-xl bg-[#d58fa7] py-3 font-bold text-white md:col-span-2">
          حفظ الإعدادات
        </button>
      </form>
      <form onSubmit={changePassword} className="mt-5 grid gap-4 rounded-3xl bg-white p-5 md:grid-cols-3">
        <div className="md:col-span-3"><h3 className="text-xl font-black">تغيير كلمة سر المدير</h3><p className="mt-1 text-sm text-stone-500">اكتب كلمة السر الحالية، وبعدها اختر كلمة سر جديدة خاصة بك.</p></div>
        <label>كلمة السر الحالية<input name="currentPassword" type="password" required className="input" autoComplete="current-password" /></label>
        <label>كلمة السر الجديدة<input name="newPassword" type="password" required minLength={8} className="input" autoComplete="new-password" /></label>
        <label>تأكيد كلمة السر<input name="confirmPassword" type="password" required minLength={8} className="input" autoComplete="new-password" /></label>
        {passwordMessage&&<p className="md:col-span-3 rounded-xl bg-[#fff3f6] p-3 font-bold">{passwordMessage}</p>}
        <button disabled={passwordBusy} className="rounded-xl bg-[#6c8f80] py-3 font-bold text-white md:col-span-3 disabled:opacity-60">{passwordBusy?"جاري التغيير...":"تغيير كلمة السر"}</button>
      </form>
    </>
  );
}
function Field(p: any) {
  return (
    <label>
      {p.label}
      <input
        {...p}
        label={undefined}
        min={p.type === "number" ? 0 : undefined}
        className="input"
      />
    </label>
  );
}
function Check({ name, label }: any) {
  return (
    <label>
      <input type="checkbox" name={name} /> {label}
    </label>
  );
}
function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-3xl bg-white p-5">
      <b className="text-3xl">{n}</b>
      <p>{l}</p>
    </div>
  );
}
function Center({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="grid min-h-screen place-items-center">
      {children}
    </div>
  );
}
