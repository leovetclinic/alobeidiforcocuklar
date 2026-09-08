import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { seasonalEffects, settings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const clean=(x:any)=>({
  name:String(x.name||"").trim(),preset:String(x.preset||"winter"),active:!!x.active,
  startDate:x.startDate||null,endDate:x.endDate||null,speed:String(x.speed||"normal"),
  density:Math.max(1,Math.min(100,+x.density||25)),opacity:Math.max(5,Math.min(100,+x.opacity||35)),
  elementSize:Math.max(10,Math.min(80,+x.elementSize||24)),motion:String(x.motion||"fall"),
  desktopEnabled:x.desktopEnabled!==false,mobileEnabled:x.mobileEnabled!==false,pages:String(x.pages||"home,products"),
  customSymbols:x.customSymbols?String(x.customSymbols):null,barEnabled:!!x.barEnabled,barText:x.barText?String(x.barText):null,
  barTextColor:String(x.barTextColor||"#ffffff"),barBackground:String(x.barBackground||"#8b5e83"),barLink:x.barLink?String(x.barLink):null,
  sortOrder:+x.sortOrder||0,updatedAt:Date.now()
});
export async function GET(){
  const db=getDb(),rows=await db.select().from(seasonalEffects).orderBy(asc(seasonalEffects.sortOrder),asc(seasonalEffects.id));
  const [disabled]=await db.select().from(settings).where(eq(settings.key,"effectsDisabled")).limit(1);
  return Response.json({effects:rows,disabled:disabled?.value==="true"});
}
export async function POST(req:Request){
  if(!await requireAdmin())return Response.json({error:"غير مخول"},{status:401});
  const body=await req.json(),data=clean(body);if(!data.name)return Response.json({error:"يرجى كتابة اسم التأثير"},{status:400});
  const [row]=await getDb().insert(seasonalEffects).values({...data,createdAt:Date.now()}).returning();return Response.json(row,{status:201});
}
export async function PATCH(req:Request){
  if(!await requireAdmin())return Response.json({error:"غير مخول"},{status:401});
  const body=await req.json();if(body.action==="disable-all"){
    const db=getDb();await db.update(seasonalEffects).set({active:false,updatedAt:Date.now()});
    await db.insert(settings).values({key:"effectsDisabled",value:"true",updatedAt:Date.now()}).onConflictDoUpdate({target:settings.key,set:{value:"true",updatedAt:Date.now()}});return Response.json({ok:true});
  }
  if(body.action==="enable-system"){
    await getDb().insert(settings).values({key:"effectsDisabled",value:"false",updatedAt:Date.now()}).onConflictDoUpdate({target:settings.key,set:{value:"false",updatedAt:Date.now()}});return Response.json({ok:true});
  }
  const id=+body.id;if(!id)return Response.json({error:"معرّف غير صحيح"},{status:400});
  const [row]=await getDb().update(seasonalEffects).set(clean(body)).where(eq(seasonalEffects.id,id)).returning();return Response.json(row);
}
export async function DELETE(req:Request){
  if(!await requireAdmin())return Response.json({error:"غير مخول"},{status:401});
  const id=+new URL(req.url).searchParams.get("id")!;if(!id)return Response.json({error:"معرّف غير صحيح"},{status:400});
  await getDb().delete(seasonalEffects).where(eq(seasonalEffects.id,id));return Response.json({ok:true});
}
