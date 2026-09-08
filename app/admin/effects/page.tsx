"use client";
import { useEffect,useState } from "react";
import { ArrowRight,Eye,Plus,Save,Trash2,TriangleAlert } from "lucide-react";
import { SeasonalEffects,type SeasonalEffect } from "@/components/seasonal-effects";

const presets=[['ramadan','رمضان'],['eid','العيد'],['autumn','الخريف'],['spring','الربيع'],['winter','الشتاء'],['rain','المطر'],['summer','الصيف'],['night','الليل'],['christmas','Christmas / New Year'],['custom','تأثير مخصص']];
const fresh=():SeasonalEffect=>({id:0,name:"تأثير جديد",preset:"winter",active:false,startDate:null,endDate:null,speed:"normal",density:25,opacity:35,elementSize:24,motion:"fall",desktopEnabled:true,mobileEnabled:true,pages:"home,products",customSymbols:null,barEnabled:false,barText:"",barTextColor:"#ffffff",barBackground:"#8b5e83",barLink:"",sortOrder:0});
export default function EffectsAdmin(){
 const [effects,setEffects]=useState<SeasonalEffect[]>([]),[disabled,setDisabled]=useState(false),[preview,setPreview]=useState<SeasonalEffect|null>(null),[message,setMessage]=useState("");
 async function load(){const a=await fetch('/api/auth/me').then(r=>r.json());if(!a.authenticated){location.href='/admin?next=/admin/effects';return}const x=await fetch('/api/seasonal-effects').then(r=>r.json());setEffects(x.effects||[]);setDisabled(!!x.disabled)}
 useEffect(()=>{load()},[]);
 const update=(id:number,key:string,value:any)=>setEffects(xs=>xs.map(x=>x.id===id?{...x,[key]:value}:x));
 async function save(x:SeasonalEffect){const r=await fetch('/api/seasonal-effects',{method:x.id?'PATCH':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});setMessage(r.ok?'تم حفظ التأثير':'تعذر الحفظ');await load()}
 async function remove(id:number){if(!confirm('هل تريد حذف هذا التأثير؟'))return;await fetch(`/api/seasonal-effects?id=${id}`,{method:'DELETE'});await load()}
 async function emergency(action:'disable-all'|'enable-system'){await fetch('/api/seasonal-effects',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action})});setMessage(action==='disable-all'?'تم إيقاف جميع المؤثرات فوراً':'تم فتح نظام المؤثرات');await load()}
 return <main dir="rtl" className="min-h-screen bg-[#fff9fb] p-4 text-[#55434c] md:p-8">
  <div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-3"><div><a href="/admin" className="inline-flex items-center gap-2 font-bold"><ArrowRight/> لوحة المدير</a><h1 className="mt-3 text-3xl font-black">المؤثرات الموسمية والمناسبات</h1><p>مؤثرات زخرفية خفيفة لا تمنع الضغط على أي جزء من المتجر.</p></div><div className="flex gap-2">{disabled?<button onClick={()=>emergency('enable-system')} className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white">إعادة تفعيل النظام</button>:<button onClick={()=>emergency('disable-all')} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white"><TriangleAlert/> Disable All Effects</button>}<button onClick={()=>setEffects(x=>[fresh(),...x])} className="btn-soft"><Plus/> إضافة تأثير</button></div></div>
  {message&&<p className="mt-4 rounded-xl bg-white p-3 font-bold">{message}</p>}
  <div className="mt-6 space-y-5">{effects.map((x,i)=><section key={x.id||`new-${i}`} className="rounded-3xl bg-white p-5 shadow-sm">
   <div className="grid gap-4 md:grid-cols-4">
    <label>اسم التأثير<input className="input" value={x.name} onChange={e=>update(x.id,'name',e.target.value)}/></label>
    <label>القالب<select className="input" value={x.preset} onChange={e=>update(x.id,'preset',e.target.value)}>{presets.map(p=><option key={p[0]} value={p[0]}>{p[1]}</option>)}</select></label>
    <label>تاريخ البداية<input type="date" className="input" value={x.startDate||''} onChange={e=>update(x.id,'startDate',e.target.value||null)}/></label>
    <label>تاريخ النهاية<input type="date" className="input" value={x.endDate||''} onChange={e=>update(x.id,'endDate',e.target.value||null)}/></label>
    <label>السرعة<select className="input" value={x.speed} onChange={e=>update(x.id,'speed',e.target.value)}><option value="slow">بطيئة</option><option value="normal">متوسطة</option><option value="fast">سريعة</option></select></label>
    <label>نوع الحركة<select className="input" value={x.motion} onChange={e=>update(x.id,'motion',e.target.value)}><option value="fall">تساقط</option><option value="float">طفو هادئ</option><option value="sparkle">لمعان</option><option value="drift">انجراف جانبي</option></select></label>
    <label>الكثافة: {x.density}%<input type="range" min="1" max="100" value={x.density} onChange={e=>update(x.id,'density',+e.target.value)} className="mt-4 w-full"/></label>
    <label>الشفافية: {x.opacity}%<input type="range" min="5" max="100" value={x.opacity} onChange={e=>update(x.id,'opacity',+e.target.value)} className="mt-4 w-full"/></label>
    <label>حجم العناصر: {x.elementSize}px<input type="range" min="10" max="80" value={x.elementSize} onChange={e=>update(x.id,'elementSize',+e.target.value)} className="mt-4 w-full"/></label>
    <label>الصفحات<select className="input" value={x.pages} onChange={e=>update(x.id,'pages',e.target.value)}><option value="home,products">الرئيسية والمنتجات</option><option value="home">الرئيسية فقط</option><option value="products">المنتجات فقط</option><option value="all">كل صفحات المتجر</option></select></label>
    {x.preset==='custom'&&<label className="md:col-span-2">رموز التأثير المخصص<input className="input" value={x.customSymbols||''} onChange={e=>update(x.id,'customSymbols',e.target.value)} placeholder="✨ 🌸 ⭐"/></label>}
   </div>
   <div className="mt-4 flex flex-wrap gap-5"><Check label="تشغيل التأثير" checked={x.active} set={v=>update(x.id,'active',v)}/><Check label="Desktop" checked={x.desktopEnabled} set={v=>update(x.id,'desktopEnabled',v)}/><Check label="Mobile" checked={x.mobileEnabled} set={v=>update(x.id,'mobileEnabled',v)}/><Check label="إظهار شريط المناسبة" checked={x.barEnabled} set={v=>update(x.id,'barEnabled',v)}/></div>
   {x.barEnabled&&<div className="mt-4 grid gap-3 rounded-2xl bg-[#fff9fb] p-4 md:grid-cols-4"><label>نص الشريط<input className="input" value={x.barText||''} onChange={e=>update(x.id,'barText',e.target.value)}/></label><label>لون النص<input type="color" className="input h-12" value={x.barTextColor} onChange={e=>update(x.id,'barTextColor',e.target.value)}/></label><label>لون الخلفية<input type="color" className="input h-12" value={x.barBackground} onChange={e=>update(x.id,'barBackground',e.target.value)}/></label><label>الرابط الاختياري<input className="input" value={x.barLink||''} onChange={e=>update(x.id,'barLink',e.target.value)}/></label></div>}
   <div className="mt-5 flex gap-2"><button onClick={()=>save(x)} className="inline-flex items-center gap-2 rounded-xl bg-[#d58fa7] px-5 py-3 font-bold text-white"><Save/> حفظ</button><button onClick={()=>setPreview({...x,active:true})} className="btn-soft"><Eye/> معاينة</button>{x.id>0&&<button onClick={()=>remove(x.id)} className="rounded-xl bg-red-50 px-4 text-red-600"><Trash2/></button>}</div>
  </section>)}</div></div>
  {preview&&<div className="fixed inset-0 z-[120] bg-white/90"><SeasonalEffects effects={[preview]} preview/><button onClick={()=>setPreview(null)} className="fixed left-5 top-5 z-[130] rounded-full bg-[#55434c] px-5 py-3 font-bold text-white">إغلاق المعاينة</button><div className="grid min-h-screen place-items-center p-5 text-center"><div className="rounded-3xl bg-white p-10 shadow-xl"><h2 className="text-3xl font-black">معاينة: {preview.name}</h2><p className="mt-3">هذه معاينة قبل نشر التأثير للزبائن.</p></div></div></div>}
 </main>
}
function Check({label,checked,set}:{label:string;checked:boolean;set:(v:boolean)=>void}){return <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={checked} onChange={e=>set(e.target.checked)}/>{label}</label>}
