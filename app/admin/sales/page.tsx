"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CheckCircle2, Clock, RotateCcw, Trash2, Truck, X } from "lucide-react";
type Item = {
  id: number;
  productId?: number;
  variantId?: number;
  productName: string;
  productCode?: string;
  imageUrl?: string;
  colorName?: string;
  size?: string;
  age?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  status: string;
  inventoryApplied: boolean;
};
type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  governorate?: string;
  address: string;
  landmark?: string;
  deliveryFee: number;
  total: number;
  notes?: string;
  status: string;
  inventoryApplied: boolean;
  createdAt: string;
  items: Item[];
};
const money = (n: number) => new Intl.NumberFormat("ar-IQ").format(n) + " د.ع";
export default function Sales() {
  const [orders, setOrders] = useState<Order[]>([]),
    [notice, setNotice] = useState(""),
    [working,setWorking]=useState("");
  async function load() {
    const r = await fetch("/api/orders");
    if (r.status === 401) {
      location.href = `/admin?next=${encodeURIComponent(location.pathname + location.hash)}`;
      return;
    }
    setOrders((await r.json()).orders || []);
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  const items = orders.flatMap((o) => o.items),
    pending = items.filter((i) => i.status === "pending"),
    sold = items.filter((i) => i.inventoryApplied),
    total = sold.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    profit = sold.reduce(
      (s, i) => s + (i.unitPrice - i.unitCost) * i.quantity,
      0,
    );
  async function itemAction(o: Order, item: Item, action: string) {
    const key=`${action}-${item.id}`;setWorking(key);setNotice("");
    try { const r = await fetch(`/api/orders/${o.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, itemId: item.id }),
      });
    const x = await r.json().catch(()=>({error:"تعذر قراءة استجابة الموقع"}));
    if(r.status===401){location.href=`/admin?next=${encodeURIComponent(location.pathname+location.hash)}`;return;}
    setNotice(
      r.ok
        ? action === "approveItem"
          ? "تم تأكيد هذا المنتج فقط، نُقص من المخزن واحتُسب ربحه"
          : action === "rejectItem"
            ? "تم إلغاء هذا المنتج بدون تغيير المخزون"
            : "تم التراجع وإرجاع الكمية"
        : x.error || "تعذر تنفيذ العملية",
    );
    if (r.ok) await load();
    } catch { setNotice("تعذر تنفيذ العملية. تحقق من الاتصال وحاول مرة ثانية"); }
    finally {setWorking("");}
  }
  async function delivered(o: Order) {
    const r=await fetch(`/api/orders/${o.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action:"markDelivered"})}),x=await r.json();
    setNotice(r.ok?"تم تسجيل وصول الطلب للزبون":x.error||"تعذر تحديث الطلب");if(r.ok)load();
  }
  async function remove(id: number) {
    if (!confirm("حذف الطلب؟ المنتجات المؤكدة سترجع كمياتها للمخزن.")) return;
    setWorking(`delete-${id}`);setNotice("");
    try {
      const r=await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (r.ok) {
        setOrders((current)=>current.filter((order)=>order.id!==id));
        setNotice("تم حذف الطلب");
        void load();
      } else {const x=await r.json().catch(()=>({}));setNotice(x.error||"تعذر حذف الطلب");}
    } catch {setNotice("تعذر حذف الطلب، تحقق من الاتصال وحاول مرة ثانية");}
    finally {setWorking("");}
  }
  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#fff9fb] p-4 md:p-8">
      <i className="pointer-events-none absolute right-[4%] top-28 size-32 animate-pulse rounded-full bg-[#f8dce6]/60"/><i className="pointer-events-none absolute bottom-20 left-[3%] size-44 animate-pulse rounded-full bg-[#dff0f8]/60 [animation-delay:500ms]"/>
      <div className="mx-auto max-w-6xl">
        <a href="/admin" className="inline-flex gap-2">
          <ArrowRight /> رجوع للوحة
        </a>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <h1 className="text-3xl font-black">الطلبات والمبيعات</h1>
          {pending.length > 0 && (
            <span className="rounded-full bg-[#f8dce6] px-4 py-2 font-bold">
              <Clock className="inline" /> {pending.length} منتج ينتظر قرارك
            </span>
          )}
        </div>
        {notice && <p className="my-4 rounded-xl bg-[#dff0f8] p-3">{notice}</p>}
        <div className="my-6 grid gap-4 sm:grid-cols-4">
          <Card label="منتجات تنتظر" value={pending.length + ""} />
          <Card
            label="قطع مباعة"
            value={sold.reduce((s, i) => s + i.quantity, 0) + ""}
          />
          <Card label="إجمالي سعر المبيع" value={money(total)} />
          <Card label="صافي الأرباح" value={money(profit)} />
        </div>
        <p className="mb-5 rounded-2xl bg-amber-50 p-4">
          وافق أو ارفض كل منتج بصورة مستقلة. فقط المنتج الذي تضغط عليه «تم شراء
          المنتج» ينقص من المخزن ويدخل ضمن المبيعات والأرباح.
        </p>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="rounded-3xl bg-white p-8 text-center">
              لا توجد طلبات بعد.
            </p>
          ) : (
            orders.map((o) => (
              <article
                id={`order-${o.id}`}
                key={o.id}
                className="relative scroll-mt-6 overflow-hidden rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="absolute -left-8 -top-8 size-24 rounded-full bg-[#f8dce6]/40"/>
                <div className="flex justify-between gap-3">
                  <div>
                    <b>{o.orderNumber}</b>
                    <p>
                      {o.customerName} • {o.phone}
                    </p>
                    <p>{o.governorate && `${o.governorate} • `}{o.address}</p>
                    {o.landmark && <p>أقرب نقطة دالة: {o.landmark}</p>}
                    <p>التوصيل: {money(o.deliveryFee || 0)} • المجموع الكلي: {money(o.total)}</p>
                    <small>
                      {new Date(o.createdAt).toLocaleString("ar-IQ")}
                    </small>
                  </div>
                  <button
                    type="button"
                    disabled={!!working}
                    onClick={() => remove(o.id)}
                    className="inline-flex min-h-12 min-w-28 touch-manipulation items-center justify-center gap-2 rounded-xl bg-red-100 px-4 py-3 font-black text-red-700 shadow-sm transition active:scale-95 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Trash2 className={working===`delete-${o.id}`?"animate-pulse":""} />
                    {working===`delete-${o.id}`?"جاري الحذف…":"حذف الطلب"}
                  </button>
                </div>
                <div className="my-5 grid grid-cols-3 gap-2 rounded-3xl bg-[#fff9fb] p-4 text-center">
                  <div className={o.status==="pending"?"text-[#b56d86]":"text-emerald-700"}><Clock className="mx-auto mb-1"/><b className="text-xs">في المخزن</b></div>
                  <div className={o.status==="shipping"||o.status==="delivered"?"text-emerald-700":"text-gray-400"}><Truck className="mx-auto mb-1"/><b className="text-xs">شركة الشحن</b></div>
                  <div className={o.status==="delivered"?"text-emerald-700":"text-gray-400"}><CheckCircle2 className="mx-auto mb-1"/><b className="text-xs">وصل للزبون</b></div>
                </div>
                <div className="mt-4 divide-y">
                  {o.items.map((i) => (
                    <div
                      key={i.id}
                      className={`py-4 ${i.status === "pending" ? "bg-amber-50/50" : ""}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {i.imageUrl ? <img src={i.imageUrl} alt={i.productName} className="size-24 rounded-2xl border object-cover" /> : <div className="grid size-24 place-items-center rounded-2xl bg-gray-100">بدون صورة</div>}
                          <div>
                          <b>{i.productName}</b>
                          <p className="font-bold text-[#b56d86]">كود المنتج: {i.productCode || "—"}</p>
                          <p>
                            {i.colorName || "بدون لون"}{" "}
                            {i.size && `• ${i.size}`} {i.age && `• ${i.age}`} •
                            الكمية {i.quantity}
                          </p>
                          <p>
                            المبيع: {money(i.unitPrice * i.quantity)}{" "}
                            {i.inventoryApplied && (
                              <b className="mr-3 text-emerald-700">
                                الربح:{" "}
                                {money((i.unitPrice - i.unitCost) * i.quantity)}
                              </b>
                            )}
                          </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {i.status === "pending" && (
                            <>
                              <button
                                type="button"
                                disabled={!!working}
                                onClick={() => itemAction(o, i, "approveItem")}
                                className="inline-flex gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                              >
                                <Check /> {working===`approveItem-${i.id}`?"جاري التأكيد...":"تم شراء المنتج"}
                              </button>
                              <button
                                type="button"
                                disabled={!!working}
                                onClick={() => itemAction(o, i, "rejectItem")}
                                className="inline-flex gap-2 rounded-xl bg-red-50 px-4 py-3 text-red-700 disabled:opacity-50"
                              >
                                <X /> {working===`rejectItem-${i.id}`?"جاري الإلغاء...":"ألغي المنتج"}
                              </button>
                            </>
                          )}
                          {i.status === "approved" && (
                            <>
                              <span className="rounded-full bg-emerald-100 px-3 py-2">
                                تم البيع
                              </span>
                              <button
                                type="button"
                                disabled={!!working}
                                onClick={() => itemAction(o, i, "undoItem")}
                                className="inline-flex gap-2 rounded-xl bg-gray-100 px-3 py-2"
                              >
                                <RotateCcw /> تراجع
                              </button>
                            </>
                          )}
                          {i.status === "rejected" && (
                            <>
                              <span className="rounded-full bg-red-100 px-3 py-2">
                                ملغي
                              </span>
                              <button
                                type="button"
                                disabled={!!working}
                                onClick={() => itemAction(o, i, "undoItem")}
                                className="inline-flex gap-2 rounded-xl bg-gray-100 px-3 py-2"
                              >
                                <RotateCcw /> إعادة للمراجعة
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {o.notes && <p className="mt-3">ملاحظات: {o.notes}</p>}
                {o.status === "shipping" && <button type="button" disabled={!!working} onClick={()=>delivered(o)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d58fa7] py-3 font-black text-white disabled:opacity-50"><CheckCircle2/> موافق، وصل الطلب للزبون</button>}
                {o.status === "delivered" && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-center font-black text-emerald-700">✓ تم توصيل الطلب وتأكيد وصوله</p>}
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5">
      <p>{label}</p>
      <b className="text-2xl">{value}</b>
    </div>
  );
}
