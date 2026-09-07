import { getDb } from "@/db";
import { orderItems, orders, variants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

async function refreshOrder(id: number) {
  const db = getDb(), items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const approved = items.filter((i) => i.inventoryApplied), pending = items.filter((i) => i.status === "pending");
  const readyForShipping = approved.length > 0 && pending.length === 0;
  await db.update(orders).set({
    inventoryApplied: readyForShipping,
    status: pending.length ? "pending" : approved.length ? "shipping" : "cancelled",
    approvedAt: approved.length ? Date.now() : null,
    shippingAt: readyForShipping ? Date.now() : null,
    deliveredAt: null,
  }).where(eq(orders.id, id));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return Response.json({ error: "غير مخول" }, { status: 401 });
  const id = +(await params).id, x = await req.json(), db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (x.action === "markDelivered") {
    if (order.status !== "shipping") return Response.json({ error: "الطلب ليس لدى شركة الشحن" }, { status: 409 });
    await db.update(orders).set({ status: "delivered", deliveredAt: Date.now() }).where(eq(orders.id, id));
    return Response.json({ ok: true });
  }
  if (x.action === "approveItem" || x.action === "rejectItem") {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, +x.itemId)).limit(1);
    if (!item || item.orderId !== id) return Response.json({ error: "المنتج غير موجود بالطلب" }, { status: 404 });
    if (item.inventoryApplied) return Response.json({ ok: true });
    if (item.status !== "pending") return Response.json({ error: "تم حسم هذا المنتج سابقاً" }, { status: 409 });
    if (x.action === "approveItem") {
      let [v] = item.variantId ? await db.select().from(variants).where(eq(variants.id, item.variantId)).limit(1) : [];
      if (!v && item.productId) {
        const candidates=await db.select().from(variants).where(eq(variants.productId,item.productId));
        v=candidates.find(x=>(x.colorName||"")===(item.colorName||"")&&(x.size||"")===(item.size||"")&&(x.age||"")===(item.age||""))||candidates[0];
      }
      if (!v || v.stock < item.quantity) return Response.json({ error: `المخزون غير كافٍ للمنتج: ${item.productName}` }, { status: 409 });
      await db.update(variants).set({ stock: v.stock - item.quantity }).where(eq(variants.id, v.id));
      await db.update(orderItems).set({ status: "approved", inventoryApplied: true, approvedAt: Date.now() }).where(eq(orderItems.id, item.id));
    } else await db.update(orderItems).set({ status: "rejected", inventoryApplied: false }).where(eq(orderItems.id, item.id));
    await refreshOrder(id);
    return Response.json({ ok: true });
  }
  if (x.action === "undoItem") {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, +x.itemId)).limit(1);
    if (!item || item.orderId !== id) return Response.json({ error: "المنتج غير موجود بالطلب" }, { status: 404 });
    if (item.inventoryApplied && item.variantId) {
      const [v] = await db.select().from(variants).where(eq(variants.id, item.variantId)).limit(1);
      if (v) await db.update(variants).set({ stock: v.stock + item.quantity }).where(eq(variants.id, v.id));
    }
    await db.update(orderItems).set({ status: "pending", inventoryApplied: false, approvedAt: null }).where(eq(orderItems.id, item.id));
    await refreshOrder(id);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "إجراء غير معروف" }, { status: 400 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return Response.json({ error: "غير مخول" }, { status: 401 });
  const id = +(await params).id, db = getDb(), items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const allVariants=await db.select().from(variants),returns=new Map<number,number>();
  for(const i of items)if(i.inventoryApplied&&i.variantId)returns.set(i.variantId,(returns.get(i.variantId)||0)+i.quantity);
  await Promise.all([...returns].map(async([variantId,quantity])=>{const v=allVariants.find(x=>x.id===variantId);if(v)await db.update(variants).set({stock:v.stock+quantity}).where(eq(variants.id,variantId));}));
  await db.delete(orderItems).where(eq(orderItems.orderId,id));
  await db.delete(orders).where(eq(orders.id, id));
  return Response.json({ ok: true });
}
