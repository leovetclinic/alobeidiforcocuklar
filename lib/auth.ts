import {getDb} from "@/db"; import {admins,sessions} from "@/db/schema"; import {and,eq,gt} from "drizzle-orm"; import {cookies} from "next/headers";
import {env} from "cloudflare:workers";
const enc=new TextEncoder(),hex=(b:ArrayBuffer)=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function digest(v:string){return hex(await crypto.subtle.digest("SHA-256",enc.encode(v)))}
async function derive(p:string,s:string){const k=await crypto.subtle.importKey("raw",enc.encode(p),"PBKDF2",false,["deriveBits"]);return hex(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:enc.encode(s),iterations:100000},k,256))}
export async function verifyLogin(username:string,password:string){const db=getDb();let [a]=await db.select().from(admins).where(eq(admins.username,username)).limit(1);const bootstrap=env as unknown as {ADMIN_BOOTSTRAP_USERNAME?:string;ADMIN_BOOTSTRAP_PASSWORD?:string};if(!a&&bootstrap.ADMIN_BOOTSTRAP_USERNAME&&bootstrap.ADMIN_BOOTSTRAP_PASSWORD&&username===bootstrap.ADMIN_BOOTSTRAP_USERNAME&&password===bootstrap.ADMIN_BOOTSTRAP_PASSWORD){const salt=crypto.randomUUID();[a]=await db.insert(admins).values({username,salt,passwordHash:await derive(password,salt),createdAt:Date.now()}).returning()}if(!a||await derive(password,a.salt)!==a.passwordHash)return null;const token=crypto.randomUUID()+crypto.randomUUID();await db.insert(sessions).values({id:crypto.randomUUID(),adminId:a.id,tokenHash:await digest(token),createdAt:Date.now(),expiresAt:Date.now()+2592000000});return token}
export async function requireAdmin(){const token=(await cookies()).get("admin_session")?.value;if(!token)return null;const [s]=await getDb().select().from(sessions).where(and(eq(sessions.tokenHash,await digest(token)),gt(sessions.expiresAt,Date.now()))).limit(1);return s??null}
export async function changeAdminPassword(adminId:number,currentPassword:string,newPassword:string){
  const db=getDb();
  const [admin]=await db.select().from(admins).where(eq(admins.id,adminId)).limit(1);
  if(!admin||await derive(currentPassword,admin.salt)!==admin.passwordHash)return false;
  const salt=crypto.randomUUID();
  await db.update(admins).set({salt,passwordHash:await derive(newPassword,salt)}).where(eq(admins.id,adminId));
  return true;
}
