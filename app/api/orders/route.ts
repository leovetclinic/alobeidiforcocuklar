import { getDb } from "@/db";
import { orderItems, orders, products, settings, variantImages, variants } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "غير مخول" }, { status: 401 });
  const db = getDb(), os = await db.select().from(orders).orderBy(desc(orders.createdAt)), items = await db.select().from(orderItems);
  return Response.json({ orders: os.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) })) });
}

export async function POST(req: Request) {
  const x = await req.json();
  if (!x.customerName || !x.phone || !x.governorate || !x.address || !Array.isArray(x.items) || !x.items.length)
    return Response.json({ error: "بيانات الطلب غير مكتملة" }, { status: 400 });
  const db = getDb(), validated: any[] = [];
  for (const item of x.items) {
    const quantity = Math.max(1, +item.quantity || 1), [v] = await db.select().from(variants).where(eq(variants.id, +item.variantId)).limit(1);
    if (!v || !v.active || v.stock < quantity) return Response.json({ error: "الكمية غير متوفرة لأحد المنتجات" }, { status: 409 });
    const [p] = await db.select().from(products).where(eq(products.id, v.productId)).limit(1);
    if (!p || !p.active) return Response.json({ error: "أحد المنتجات غير متوفر" }, { status: 409 });
    const [img] = await db.select().from(variantImages).where(eq(variantImages.variantId, v.id)).limit(1);
    validated.push({ p, v, img, quantity });
  }
  const config = Object.fromEntries((await db.select().from(settings)).map((s) => [s.key, s.value]));
  const deliveryFee = x.governorate === "بغداد" ? Math.max(0, +(config.baghdadDeliveryFee || 5000)) : Math.max(0, +(config.provinceDeliveryFee || 6000));
  const productsTotal = validated.reduce((s, i) => s + i.p.price * i.quantity, 0), total = productsTotal + deliveryFee;
  const totalCost = validated.reduce((s, i) => s + i.p.cost * i.quantity, 0), orderNumber = `ALB-${Date.now().toString().slice(-9)}`;
  const [order] = await db.insert(orders).values({ orderNumber, customerName: x.customerName, phone: x.phone, governorate: x.governorate, address: x.address, landmark: x.landmark || null, notes: x.notes || null, total, deliveryFee, totalCost, status: "pending", inventoryApplied: false, createdAt: Date.now() }).returning();
  for (const i of validated) await db.insert(orderItems).values({ orderId: order.id, productId: i.p.id, variantId: i.v.id, productName: i.p.name, productCode: i.p.sku, colorName: i.v.colorName, size: i.v.size, age: i.v.age, quantity: i.quantity, unitPrice: i.p.price, unitCost: i.p.cost, imageUrl: i.img?.imageUrl || null, status: "pending", inventoryApplied: false });
  return Response.json({ order: { ...order, items: validated.map((i) => ({ productName: i.p.name, productCode: i.p.sku, colorName: i.v.colorName, size: i.v.size, age: i.v.age, quantity: i.quantity, unitPrice: i.p.price, imageUrl: i.img?.imageUrl || null })) } }, { status: 201 });
}
