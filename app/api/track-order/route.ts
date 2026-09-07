import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const x = await req.json();
  const orderNumber = String(x.orderNumber || "").trim().toUpperCase();
  const phone = String(x.phone || "").replace(/\D/g, "");
  if (!orderNumber || phone.length < 8) return Response.json({ error: "اكتب رقم الطلب ورقم الهاتف بصورة صحيحة" }, { status: 400 });
  const db = getDb();
  const rows = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
  const order = rows.find((o) => o.phone.replace(/\D/g, "") === phone);
  if (!order) return Response.json({ error: "لم نعثر على طلب مطابق لهذه البيانات" }, { status: 404 });
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return Response.json({ order: { orderNumber: order.orderNumber, status: order.status, createdAt: order.createdAt, approvedAt: order.approvedAt, shippingAt: order.shippingAt, deliveredAt: order.deliveredAt, governorate: order.governorate, total: order.total, items: items.map((i) => ({ productName: i.productName, productCode: i.productCode, colorName: i.colorName, size: i.size, age: i.age, quantity: i.quantity, imageUrl: i.imageUrl, status: i.status })) } });
}
