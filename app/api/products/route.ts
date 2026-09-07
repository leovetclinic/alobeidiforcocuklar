import { getDb } from "@/db";
import { products, variants, variantImages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = new URL(req.url).searchParams.get("admin") === "1" && !!(await requireAdmin());
  const db = getDb();
  const ps = admin ? await db.select().from(products).orderBy(desc(products.createdAt)) : await db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.createdAt));
  const vs = await db.select().from(variants), imgs = await db.select().from(variantImages);
  return Response.json({ products: ps.map((p) => ({ ...p, variants: vs.filter((v) => v.productId === p.id).map((v) => ({ ...v, images: imgs.filter((i) => i.variantId === v.id) })) })) });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "غير مخول" }, { status: 401 });
  const x = await req.json(), sku = String(x.sku || "").trim();
  if (!x.name || !sku || !Number.isFinite(+x.price) || +x.price < 0) return Response.json({ error: "يرجى إدخال اسم المنتج وكود المنتج وسعر صحيح" }, { status: 400 });
  const db = getDb(), [existing] = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
  if (existing) return Response.json({ error: "كود المنتج مستخدم لمنتج آخر" }, { status: 409 });
  const now = Date.now();
  const [p] = await db.insert(products).values({ name: x.name, slug: x.slug || `product-${now}`, sku, price: +x.price, cost: Math.max(0, +x.cost || 0), oldPrice: x.oldPrice ? +x.oldPrice : null, categoryId: x.categoryId ? +x.categoryId : null, shortDescription: x.shortDescription || null, description: x.description || null, gender: x.gender || null, featured: !!x.featured, newArrival: !!x.newArrival, offer: !!x.offer, bestSeller: !!x.bestSeller, active: true, createdAt: now, updatedAt: now }).returning();
  for (const [n, v] of (x.variants || []).entries()) {
    const [saved] = await db.insert(variants).values({ productId: p.id, colorName: v.colorName || null, colorHex: v.colorHex || null, size: v.size || null, age: v.age || null, stock: Math.max(0, +v.stock || 0), active: true, sortOrder: n }).returning();
    for (const [j, img] of (v.images || []).entries()) await db.insert(variantImages).values({ variantId: saved.id, imageUrl: img.url, objectKey: img.key || null, alt: `${p.name} - ${v.colorName || "المنتج"}`, sortOrder: j, isMain: j === 0 });
  }
  return Response.json({ product: p }, { status: 201 });
}
