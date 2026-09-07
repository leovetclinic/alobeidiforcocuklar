import {changeAdminPassword,requireAdmin} from "@/lib/auth";

export async function POST(req:Request){
  const session=await requireAdmin();
  if(!session)return Response.json({error:"غير مخول"},{status:401});
  const {currentPassword,newPassword,confirmPassword}=await req.json();
  if(!currentPassword)return Response.json({error:"أدخل كلمة السر الحالية"},{status:400});
  if(String(newPassword||"").length<8)return Response.json({error:"كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل"},{status:400});
  if(newPassword!==confirmPassword)return Response.json({error:"تأكيد كلمة السر غير مطابق"},{status:400});
  const ok=await changeAdminPassword(session.adminId,String(currentPassword),String(newPassword));
  if(!ok)return Response.json({error:"كلمة السر الحالية غير صحيحة"},{status:400});
  return Response.json({ok:true,message:"تم تغيير كلمة السر بنجاح"});
}
