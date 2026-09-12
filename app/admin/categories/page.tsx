"use client";
import {useEffect,useState} from "react";
import {ArrowRight,ImagePlus,Plus,Save,Trash2} from "lucide-react";
import {compressProductImage} from "@/lib/compress-image";
type Cat={id:number;name:string;icon:string;imageUrl?:string|null;displayShape?:string|null;displayMode?:string|null;parentId?:number|null;active:boolean;sortOrder:number};const icons=["👕","👶","🎀","🛏️","🍼","🛒","🧷","🧸","👧","👦","🤍","🧢","👟","🛁","🎁"];
export default function Categories(){const [cats,setCats]=useState<Cat[]>([]),[name,setName]=useState(""),[icon,setIcon]=useState("🧸"),[imageUrl,setImageUrl]=useState<string|null>(null),[displayShape,setDisplayShape]=useState("rounded"),[displayMode,setDisplayMode]=useState("icon"),[parentId,setParentId]=useState(""),[notice,setNotice]=useState("");
 async function load(){const r=await fetch('/api/categories?admin=1');if(r.status===401){location.href='/admin';return}setCats((await r.json()).categories||[])}useEffect(()=>{load()},[]);
 async function add(e:React.FormEvent){e.preventDefault();const r=await fetch('/api/categories',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,icon,imageUrl,displayShape,displayMode,parentId:parentId?+parentId:null})});if(r.ok){setName('');setParentId('');setImageUrl(null);setNotice('تمت إضافة القسم');load()}}
 async function upload(file:File|undefined,onDone:(url:string)=>void){if(!file)return;setNotice("جاري رفع الصورة...");const fd=new FormData();fd.append("file",await compressProductImage(file));const r=await fetch("/api/upload",{method:"POST",body:fd}),x=await r.json();if(r.ok){onDone(x.url);setNotice("تم رفع الصورة، اضغط حفظ")}else setNotice(x.error||"تعذر رفع الصورة")}
 async function presets(){await fetch('/api/categories',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'installPresets'})});setNotice('تمت إضافة الأقسام والفرعيات المقترحة، وتكدر تعدل أو تحذف أي واحد');load()}
 async function save(c:Cat){const r=await fetch(`/api/categories/${c.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(c)});if(r.ok)setNotice('تم حفظ التعديل')}
 async function remove(id:number){if(!confirm('هل أنت متأكد من حذف القسم؟'))return;const r=await fetch(`/api/categories/${id}`,{method:'DELETE'});if(r.ok){setNotice('تم حذف القسم');load()}else setNotice((await r.json()).error||'تعذر الحذف')}
 return <main dir="rtl" className="min-h-screen bg-[#fff9fb] p-4 md:p-8"><div className="mx-auto max-w-6xl">
  <a href="/admin" className="inline-flex gap-2"><ArrowRight/> رجوع للوحة</a>
  <div className="mt-5 flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-black">إدارة الأقسام</h1><p>اختر شكل القسم ومحتواه: صورة أو كتابة أو إيموجي.</p></div><button onClick={presets} className="btn-soft">إضافة المقترحات الكاملة</button></div>
  {notice&&<p className="my-4 rounded-xl bg-[#dff0f8] p-3">{notice}</p>}
  <form onSubmit={add} className="my-6 grid gap-3 rounded-3xl bg-white p-5 md:grid-cols-3">
   <label>اسم القسم<input required value={name} onChange={e=>setName(e.target.value)} className="input"/></label>
   <label>شكل القسم<ShapeSelect value={displayShape} onChange={setDisplayShape}/></label>
   <label>المحتوى داخل القسم<ModeSelect value={displayMode} onChange={setDisplayMode}/></label>
   {displayMode==="icon"&&<label>الإيموجي<IconSelect value={icon} onChange={setIcon}/></label>}
   {displayMode==="image"&&<label className="btn-soft cursor-pointer self-end"><ImagePlus/> رفع صورة القسم<input type="file" accept="image/*" className="hidden" onChange={e=>upload(e.target.files?.[0],setImageUrl)}/></label>}
   <label>يتبع إلى<select value={parentId} onChange={e=>setParentId(e.target.value)} className="input"><option value="">قسم رئيسي</option>{cats.filter(c=>!c.parentId).map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></label>
   <Preview name={name||"اسم القسم"} icon={icon} imageUrl={imageUrl} mode={displayMode} shape={displayShape}/>
   <button className="btn-soft self-end"><Plus/> إضافة القسم</button>
  </form>
  <div className="space-y-4">{cats.map((c,i)=><section key={c.id} className="grid items-end gap-3 rounded-3xl bg-white p-4 md:grid-cols-4">
   <b>#{i+1}</b>
   <label>اسم القسم<input value={c.name} onChange={e=>setCats(xs=>xs.map(x=>x.id===c.id?{...x,name:e.target.value}:x))} className="input"/></label>
   <label>الشكل<ShapeSelect value={c.displayShape||"rounded"} onChange={v=>setCats(xs=>xs.map(x=>x.id===c.id?{...x,displayShape:v}:x))}/></label>
   <label>المحتوى<ModeSelect value={c.displayMode||"icon"} onChange={v=>setCats(xs=>xs.map(x=>x.id===c.id?{...x,displayMode:v}:x))}/></label>
   {(c.displayMode||"icon")==="icon"&&<label>الإيموجي<IconSelect value={c.icon||"🧸"} onChange={v=>setCats(xs=>xs.map(x=>x.id===c.id?{...x,icon:v}:x))}/></label>}
   {(c.displayMode||"icon")==="image"&&<div className="flex items-center gap-2">{c.imageUrl&&<img src={c.imageUrl} alt="" className="size-16 rounded-2xl border object-cover"/>}<label className="btn-soft cursor-pointer"><ImagePlus/> تغيير الصورة<input type="file" accept="image/*" className="hidden" onChange={e=>upload(e.target.files?.[0],url=>setCats(xs=>xs.map(x=>x.id===c.id?{...x,imageUrl:url}:x)))}/></label></div>}
   <label>يتبع إلى<select value={c.parentId||""} onChange={e=>setCats(xs=>xs.map(x=>x.id===c.id?{...x,parentId:e.target.value?+e.target.value:null}:x))} className="input"><option value="">رئيسي</option>{cats.filter(x=>!x.parentId&&x.id!==c.id).map(x=><option key={x.id} value={x.id}>{x.icon} {x.name}</option>)}</select></label>
   <label>الترتيب<input type="number" value={c.sortOrder||0} onChange={e=>setCats(xs=>xs.map(x=>x.id===c.id?{...x,sortOrder:+e.target.value}:x))} className="input"/></label>
   <label className="flex items-center gap-2 pb-3"><input type="checkbox" checked={c.active} onChange={e=>setCats(xs=>xs.map(x=>x.id===c.id?{...x,active:e.target.checked}:x))}/> ظاهر</label>
   <Preview name={c.name} icon={c.icon} imageUrl={c.imageUrl||null} mode={c.displayMode||"icon"} shape={c.displayShape||"rounded"}/>
   <div className="flex gap-2"><button onClick={()=>save(c)} className="btn-soft"><Save/> حفظ</button><button onClick={()=>remove(c.id)} className="rounded-xl bg-red-50 p-3 text-red-600"><Trash2/></button></div>
  </section>)}</div>
 </div></main>}
function ShapeSelect({value,onChange}:{value:string;onChange:(v:string)=>void}){return <select value={value} onChange={e=>onChange(e.target.value)} className="input"><option value="rounded">مستطيل مستدير</option><option value="rectangle">مستطيل</option><option value="square">مربع</option><option value="circle">دائرة</option></select>}
function ModeSelect({value,onChange}:{value:string;onChange:(v:string)=>void}){return <select value={value} onChange={e=>onChange(e.target.value)} className="input"><option value="icon">إيموجي + كتابة</option><option value="image">صورة + كتابة</option><option value="text">كتابة فقط</option></select>}
function IconSelect({value,onChange}:{value:string;onChange:(v:string)=>void}){return <select value={value} onChange={e=>onChange(e.target.value)} className="input text-xl">{icons.map(x=><option key={x}>{x}</option>)}</select>}
function Preview({name,icon,imageUrl,mode,shape}:{name:string;icon:string;imageUrl:string|null;mode:string;shape:string}){const box=shape==="circle"?"size-28 rounded-full":shape==="square"?"size-28 rounded-3xl":"h-24 w-44 rounded-3xl";return <div className="grid place-items-center"><div className={["grid place-items-center overflow-hidden border bg-[#fff9fb] p-3 text-center",box].join(" ")}>{mode==="image"&&imageUrl?<img src={imageUrl} className="mb-1 size-14 rounded-xl object-cover" alt=""/>:mode==="icon"?<span className="text-2xl">{icon}</span>:null}<b className="text-sm">{name}</b></div><small>معاينة</small></div>}
