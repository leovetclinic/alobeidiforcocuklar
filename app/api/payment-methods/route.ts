import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { paymentMethods } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const clean=(x:any)=>({name:String(x.name||"").trim(),logoUrl:x.logoUrl?String(x.logoUrl):null,active:x.active!==false,sortOrder:+x.sortOrder||0,actionType:String(x.actionType||"whatsapp"),whatsappMessage:x.whatsappMessage?String(x.whatsappMessage):null,directUrl:x.directUrl?String(x.directUrl):null,updatedAt:Date.now()});
export async function GET(){return Response.json({methods:await getDb().select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder),asc(paymentMethods.id))})}
export async function POST(req:Request){if(!await requireAdmin())return Response.json({error:"غير مخول"},{status:401});const data=clean(await req.json());if(!data.name)return Response.json({error:"يرجى كتابة اسم طريقة الدفع"},{status:400});const [row]=await getDb().insert(paymentMethods).values({...data,createdAt:Date.now()}).returning();return Response.json(row,{status:201})}
export async function PATCH(req:Request){if(!await requireAdmin())return Response.json({error:"غير مخول"},{status:401});const body=await req.json(),id=+body.id;if(!id)return Response.json({error:"معرّف غير صحيح"},{status:400});const [row]=await getDb().update(paymentMethods).set(clean(body)).where(eq(paymentMethods.id,id)).returning();return Response.json(row)}
export async function DELETE(req:Request){if(!await requireAdmin())return Response.json({error:"غير مخول"},{status:401});const id=+new URL(req.url).searchParams.get("id")!;if(!id)return Response.json({error:"معرّف غير صحيح"},{status:400});await getDb().delete(paymentMethods).where(eq(paymentMethods.id,id));return Response.json({ok:true})}
