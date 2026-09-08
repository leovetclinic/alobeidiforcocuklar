"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Baby,
  Heart,
  Search,
  ShoppingBag,
  MapPin,
  MessageCircle,
  Plus,
  Minus,
  X,
  ChevronLeft,
  PackageSearch,
  Truck,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SeasonalEffects, type SeasonalEffect } from "@/components/seasonal-effects";
type Image = { imageUrl: string };
type Variant = {
  id: number;
  colorName: string | null;
  colorHex: string | null;
  size: string | null;
  age: string | null;
  stock: number;
  images: Image[];
};
type Product = {
  id: number;
  name: string;
  sku: string;
  categoryId: number | null;
  shortDescription: string | null;
  description: string | null;
  price: number;
  oldPrice: number | null;
  gender: string | null;
  offer: boolean;
  newArrival: boolean;
  featured: boolean;
  variants: Variant[];
};
type Category = {
  id: number;
  name: string;
  icon: string;
  parentId: number | null;
};
type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  style?: Partial<BannerStyle> | null;
};
type BannerStyle = {
  imageWidth: string;
  imageAspect: string;
  imagePosition: string;
  titleSize: string;
  subtitleSize: string;
  textAlign: string;
  background: string;
  buttonBg: string;
  buttonColor: string;
  secondButtonBg: string;
  secondButtonColor: string;
  buttonRadius: string;
  animation: string;
  showStats: boolean;
  badgeText: string;
  secondButtonText: string;
  secondButtonLink: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
};
const defaultBannerStyle: BannerStyle = {imageWidth:"46",imageAspect:"portrait",imagePosition:"left",titleSize:"48",subtitleSize:"18",textAlign:"right",background:"#fff8f4",buttonBg:"#a9bb9d",buttonColor:"#ffffff",secondButtonBg:"#fff0ef",secondButtonColor:"#c47f84",buttonRadius:"999",animation:"slide-up",showStats:true,badgeText:"متجر ملابس الأطفال",secondButtonText:"اكتشف الأقسام",secondButtonLink:"#categories",stat1Value:"12-48",stat1Label:"ساعة للتوصيل",stat2Value:"تلقائي",stat2Label:"منتج متنوع",stat3Value:"تلقائي",stat3Label:"توصيل بغداد"};
type Cart = { product: Product; variant: Variant; qty: number };
type PaymentMethod={id:number;name:string;logoUrl:string|null;active:boolean;sortOrder:number;actionType:string;whatsappMessage:string|null;directUrl:string|null};
const money = (n: number) => `${n.toLocaleString("en-US")} د.ع`;
const governorates = ["بغداد","البصرة","نينوى","أربيل","السليمانية","دهوك","كركوك","الأنبار","صلاح الدين","ديالى","واسط","بابل","كربلاء","النجف","القادسية","المثنى","ذي قار","ميسان"];
const sizeOptions = ["0-3 شهر","3-6 شهر","6-9 شهر","9-12 شهر","12-18 شهر","18-24 شهر","24-36 شهر"];
function InstagramIcon(){return <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>}
function FacebookIcon(){return <svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor"><path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v2H6v4h3v9h4v-9h3.5l.5-4h-4V9c0-.7.3-1 1-1Z"/></svg>}
function ProductImage({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  return src ? (
    <img src={src} alt={name} className={className} />
  ) : (
    <div
      className={`${className} grid place-items-center bg-gradient-to-br from-[#f8dce6] to-[#dff0f8]`}
    >
      <Baby className="text-[#b7748b]" size={46} />
    </div>
  );
}
export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [banners, setBanners] = useState<Banner[]>([]),
    [store, setStore] = useState<Record<string, string>>({}),
    [cart, setCart] = useState<Cart[]>([]),
    [selected, setSelected] = useState<Record<number, number>>({}),
    [query, setQuery] = useState(""),
    [filterGender, setFilterGender] = useState(""),
    [filterColor, setFilterColor] = useState(""),
    [filterSize, setFilterSize] = useState(""),
    [sortBy, setSortBy] = useState("new"),
    [category, setCategory] = useState<number | null>(null),
    [mode, setMode] = useState<"all" | "offers" | "new">("all"),
    [detail, setDetail] = useState<Product | null>(null),
    [banner, setBanner] = useState(0),
    [bannerTouch, setBannerTouch] = useState<number | null>(null),
    [recentlyAdded, setRecentlyAdded] = useState<number | null>(null),
    [cartPulse, setCartPulse] = useState(false),
    [sizeGuideOpen, setSizeGuideOpen] = useState(false),
    [effects, setEffects] = useState<SeasonalEffect[]>([]),
    [effectsDisabled, setEffectsDisabled] = useState(false),
    [payments, setPayments] = useState<PaymentMethod[]>([]),
    [purchaseFocused, setPurchaseFocused] = useState(false),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/banners").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/seasonal-effects").then((r) => r.json()),
      fetch("/api/payment-methods").then((r) => r.json()),
    ]).then(([p, c, b, s, e, pm]) => {
      setProducts(p.products || []);
      setCategories(c.categories || []);
      setBanners(b.banners || []);
      setStore(s);
      setEffects(e.effects || []);
      setEffectsDisabled(!!e.disabled);
      setPayments((pm.methods || []).filter((x:PaymentMethod)=>x.active));
      setTimeout(() => setLoading(false), 650);
    });
    const saved = localStorage.getItem("alobeidi_cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);
  useEffect(()=>{
    if(loading)return;
    const nodes=Array.from(document.querySelectorAll<HTMLElement>("#home > section, #products article, #categories button"));
    nodes.forEach((node,index)=>{node.classList.add("scroll-reveal");node.style.setProperty("--reveal-delay",`${(index%5)*70}ms`)});
    const observer=new IntersectionObserver((entries)=>entries.forEach(entry=>entry.target.classList.toggle("is-visible",entry.isIntersecting)),{threshold:.1,rootMargin:"0px 0px -5% 0px"});
    nodes.forEach(node=>observer.observe(node));
    return()=>observer.disconnect();
  },[loading,products.length,categories.length,mode,category]);
  useEffect(() => {
    localStorage.setItem("alobeidi_cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(()=>{
    const cartSection=document.getElementById("cart");if(!cartSection)return;
    const observer=new IntersectionObserver(([entry])=>setPurchaseFocused(entry.isIntersecting),{threshold:.08});
    observer.observe(cartSection);return()=>observer.disconnect();
  },[loading]);
  const shown = useMemo(() => {
    const categoryIds = category
      ? [
          category,
          ...categories.filter((c) => c.parentId === category).map((c) => c.id),
        ]
      : [];
    const result = products.filter(
      (p) =>
        (!query ||
          p.name.includes(query) ||
          p.sku?.includes(query) ||
          p.variants.some((v) =>
            [v.colorName, v.size, v.age].some((x) => x?.includes(query)),
          )) &&
        (!category || categoryIds.includes(p.categoryId || 0)) &&
        (!filterGender || p.gender === filterGender) &&
        (!filterColor || p.variants.some((v) => v.colorName === filterColor)) &&
        (!filterSize || p.variants.some((v) => (v.size || v.age) === filterSize)) &&
        (mode !== "offers" || p.offer) &&
        (mode !== "new" || p.newArrival),
    );
    return [...result].sort((a,b)=>sortBy==="name"?a.name.localeCompare(b.name,"ar"):sortBy==="price-low"?a.price-b.price:sortBy==="price-high"?b.price-a.price:b.id-a.id);
  }, [products, categories, query, category, mode, filterGender, filterColor, filterSize, sortBy]);
  const colors=useMemo(()=>Array.from(new Set(products.flatMap(p=>p.variants.map(v=>v.colorName).filter(Boolean) as string[]))),[products]);
  const sizes=useMemo(()=>Array.from(new Set([...sizeOptions,...products.flatMap(p=>p.variants.map(v=>v.size||v.age).filter(Boolean) as string[])])),[products]);
  const suggestions = query ? shown.slice(0, 5) : [];
  const total = cart.reduce((s, x) => s + x.product.price * x.qty, 0);
  const sizeGuideRows=(store.sizeGuide||"").split("\n").map(line=>line.split("|").map(x=>x.trim())).filter(row=>row[0]);
  const activeBanner=banners[banner];
  const bannerStyle:BannerStyle={...defaultBannerStyle,...(activeBanner?.style||{})};
  const choose = (p: Product) =>
    p.variants.find(
      (v) =>
        v.id === (selected[p.id] ?? p.variants.find((x) => x.stock > 0)?.id),
    ) ?? p.variants[0];
  function add(p: Product, v: Variant) {
    if (!v || v.stock < 1) return;
    setCart((c) => {
      const i = c.findIndex((x) => x.variant.id === v.id);
      return i < 0
        ? [...c, { product: p, variant: v, qty: 1 }]
        : c.map((x, n) =>
            n === i ? { ...x, qty: Math.min(v.stock, x.qty + 1) } : x,
          );
    });
    setRecentlyAdded(v.id);
    setCartPulse(true);
    setTimeout(()=>setRecentlyAdded(null),1400);
    setTimeout(()=>setCartPulse(false),550);
  }
  function filterCategory(id: number) {
    setCategory(id);
    setMode("all");
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }
  function go(m: "all" | "offers" | "new") {
    setMode(m);
    setCategory(null);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }
  if (loading) return <div dir="rtl" className="fixed inset-0 grid place-items-center bg-[#fff9f6] text-center text-[#65585b]"><div>{store.logo?<img src={store.logo} className="mx-auto size-32 rounded-full border-4 border-white object-cover shadow-lg" alt="شعار العبيدي"/>:<span className="mx-auto grid size-28 place-items-center rounded-full bg-[#f8dce6]"><Baby size={52}/></span>}<b className="mt-6 block text-2xl tracking-[.2em]">ALOBEIDI</b><div className="my-5 flex justify-center gap-3"><i className="size-3 animate-bounce rounded-full bg-[#c9d9bd]"/><i className="size-3 animate-bounce rounded-full bg-[#b7dbea] [animation-delay:150ms]"/><i className="size-3 animate-bounce rounded-full bg-[#e8b7c5] [animation-delay:300ms]"/></div><p className="text-lg font-bold">نجهز لك المتجر بلمسة ناعمة وسريعة.. يرجى الانتظار لطفاً</p></div></div>;
  return (
    <div
      dir="rtl"
      className="store-theme min-h-screen pb-16 md:pb-0"
      style={{"--site-bg":store.themeBackground||"#fff9fb","--site-text":store.themeText||"#55434c","--site-primary":store.themePrimary||"#d58fa7","--site-secondary":store.themeSecondary||"#b56d86","--site-soft":store.themeSoft||"#f8dce6","--site-accent":store.themeAccent||"#dff0f8","--site-border":store.themeBorder||"#eadfd2","--site-footer":store.themeFooter||"#55434c",background:store.themeBackground||"#fff9fb",color:store.themeText||"#55434c"} as React.CSSProperties}
    >
      <SeasonalEffects effects={effects} disabled={effectsDisabled} suppress={purchaseFocused}/>
      <header className="sticky top-0 z-40 border-b border-[#f0dce4] bg-[#fff9fb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <span className="md:hidden" aria-hidden="true"><Baby /></span>
          <a href="#home" className="flex items-center gap-2 font-black">
            {store.logo ? (
              <img
                src={store.logo}
                alt="شعار المتجر"
                className="size-12 rounded-full border-2 border-[#f8dce6] object-cover"
              />
            ) : (
              <span className="grid size-11 place-items-center rounded-full bg-[#dff0f8]">
                <Baby />
              </span>
            )}
            <span>{store.storeName || "العبيدي لأناقة طفلك"}</span>
          </a>
          <nav className="hidden gap-6 font-bold md:flex">
            <button onClick={() => go("all")}>الرئيسية</button>
            <button
              onClick={() =>
                document
                  .getElementById("categories")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              الأقسام
            </button>
            <button onClick={() => go("offers")}>العروض</button>
            <button onClick={() => document.getElementById("track-order")?.scrollIntoView({behavior:"smooth"})}>تتبع الطلب</button>
            {sizeGuideRows.length>0&&<button onClick={()=>setSizeGuideOpen(true)}>دليل المقاسات</button>}
          </nav>
          <div className="flex gap-4">
            <Heart />
            <a href="#cart" className={`relative transition-transform ${cartPulse?"scale-125 animate-bounce text-[#d58fa7]":""}`}>
              <ShoppingBag />
              {cart.length > 0 && (
                <b className="absolute -left-2 -top-2 grid size-5 place-items-center rounded-full bg-[#cf858e] text-xs text-white">
                  {cart.length}
                </b>
              )}
            </a>
          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-3">
          <label className="flex gap-2 rounded-full border bg-white px-4 py-2">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full outline-none"
              placeholder="ابحثي عن منتج، لون، عمر أو مقاس..."
            />
          </label>
          {suggestions.length > 0 && (
            <div className="absolute inset-x-4 top-12 z-50 overflow-hidden rounded-2xl border bg-white shadow-xl">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setDetail(p);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 border-b p-3 text-right hover:bg-[#fff4f7]"
                >
                  <ProductImage
                    src={choose(p)?.images[0]?.imageUrl}
                    name={p.name}
                    className="size-14 rounded-xl bg-white object-contain"
                  />
                  <span className="flex-1">
                    <b>{p.name}</b>
                    <small className="block">{money(p.price)}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
          <button onClick={()=>go("all")} className="shrink-0 rounded-full bg-[#f8dce6] px-4 py-2 font-bold">الرئيسية</button>
          <button onClick={()=>document.getElementById("categories")?.scrollIntoView({behavior:"smooth"})} className="shrink-0 rounded-full border bg-white px-4 py-2 font-bold">الأقسام</button>
          <button onClick={()=>go("offers")} className="shrink-0 rounded-full border bg-white px-4 py-2 font-bold">العروض</button>
          <button onClick={()=>document.getElementById("track-order")?.scrollIntoView({behavior:"smooth"})} className="shrink-0 rounded-full border bg-white px-4 py-2 font-bold">تتبع الطلب</button>
          {sizeGuideRows.length>0&&<button onClick={()=>setSizeGuideOpen(true)} className="shrink-0 rounded-full border bg-white px-4 py-2 font-bold">دليل المقاسات</button>}
        </div>
      </header>
      <main id="home">
        <section className="mx-auto max-w-7xl px-4 py-12 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="rounded-full bg-[#f8dce6] px-4 py-2 text-sm font-bold">
              أناقة تليق بأجمل بداية
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
              لأن صغيرك يستحق الأجمل 🤍
            </h1>
            <p className="mt-4 text-lg leading-8">
              اكتشفي تشكيلتنا المختارة بعناية من ملابس ومستلزمات الأطفال.
            </p>
            <button
              onClick={() => go("all")}
              className="mt-7 rounded-full bg-[#d58fa7] px-7 py-3 font-bold text-white"
            >
              تسوق الآن
            </button>
          </div>
        </section>
        {banners.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-8">
            <article
              onTouchStart={(e)=>setBannerTouch(e.touches[0].clientX)}
              onTouchEnd={(e)=>{if(bannerTouch===null||banners.length<2)return;const d=e.changedTouches[0].clientX-bannerTouch;if(Math.abs(d)>45)setBanner((x)=>(x+(d<0?1:-1)+banners.length)%banners.length);setBannerTouch(null)}}
              className="relative touch-pan-y select-none overflow-hidden rounded-[2.5rem] border border-[#eadfd2] p-5 shadow-[0_25px_70px_rgba(96,73,61,.10)] md:p-10"
              style={{background:bannerStyle.background}}
            >
              <div className="banner-grid grid items-center gap-7" style={{"--banner-image-width":`${bannerStyle.imageWidth}%`} as React.CSSProperties}>
                <div key={`banner-image-${banner}`} className={`banner-motion banner-${bannerStyle.animation} overflow-hidden rounded-[2rem] border-[10px] border-white bg-white shadow-lg ${bannerStyle.imagePosition==="left"?"md:order-2":"md:order-1"}`}>
                  {activeBanner?.imageUrl?<img src={activeBanner.imageUrl} alt={activeBanner.title} className={`${bannerStyle.imageAspect==="square"?"aspect-square":bannerStyle.imageAspect==="wide"?"aspect-[16/9]":"aspect-[4/5]"} w-full object-cover`}/>:<div className="grid aspect-[4/5] place-items-center bg-[#f8dce6]"><Baby size={72}/></div>}
                </div>
                <div key={`banner-copy-${banner}`} className={`banner-motion banner-${bannerStyle.animation} ${bannerStyle.imagePosition==="left"?"md:order-1":"md:order-2"}`} style={{textAlign:bannerStyle.textAlign==="center"?"center":"right",animationDelay:"90ms"}}>
                  {bannerStyle.badgeText&&<small className="inline-block rounded-full border bg-white/75 px-5 py-2 font-bold text-[#b3797f]">{bannerStyle.badgeText}</small>}
                  <h2 className="mt-5 font-black leading-tight text-[#675850]" style={{fontSize:`clamp(28px,5vw,${bannerStyle.titleSize}px)`}}>{activeBanner?.title}</h2>
                  <p className="mt-4 leading-8 text-[#8a7b73]" style={{fontSize:`${bannerStyle.subtitleSize}px`}}>{activeBanner?.subtitle}</p>
                  <div className={`banner-motion banner-${bannerStyle.animation} mt-6 flex flex-wrap gap-3 ${bannerStyle.textAlign==="center"?"justify-center":"justify-start"}`} style={{animationDelay:"180ms"}}><a href={activeBanner?.buttonLink || "#products"} className="px-7 py-3 font-black shadow-lg transition-transform hover:-translate-y-1" style={{background:bannerStyle.buttonBg,color:bannerStyle.buttonColor,borderRadius:`${bannerStyle.buttonRadius}px`}}>{activeBanner?.buttonText || "تسوق الآن"}</a>{bannerStyle.secondButtonText&&<a href={bannerStyle.secondButtonLink||"#categories"} className="border border-[#edcfd2] px-7 py-3 font-black transition-transform hover:-translate-y-1" style={{background:bannerStyle.secondButtonBg,color:bannerStyle.secondButtonColor,borderRadius:`${bannerStyle.buttonRadius}px`}}>{bannerStyle.secondButtonText}</a>}</div>
                  {bannerStyle.showStats&&<div className={`banner-motion banner-${bannerStyle.animation} mt-8 grid grid-cols-3 gap-2 text-center`} style={{animationDelay:"260ms"}}><span className="rounded-2xl border bg-white/75 p-3"><b className="block text-lg">{bannerStyle.stat1Value}</b><small>{bannerStyle.stat1Label}</small></span><span className="rounded-2xl border bg-white/75 p-3"><b className="block text-lg">{bannerStyle.stat2Value==="تلقائي"?`${products.length}+`:bannerStyle.stat2Value}</b><small>{bannerStyle.stat2Label}</small></span><span className="rounded-2xl border bg-white/75 p-3"><b className="block text-lg">{bannerStyle.stat3Value==="تلقائي"?money(+(store.baghdadDeliveryFee||5000)):bannerStyle.stat3Value}</b><small>{bannerStyle.stat3Label}</small></span></div>}
                </div>
              </div>
              {banners.length>1&&<><button onClick={()=>setBanner(x=>(x-1+banners.length)%banners.length)} className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border bg-white shadow md:right-5"><ChevronLeft className="rotate-180"/></button><button onClick={()=>setBanner(x=>(x+1)%banners.length)} className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border bg-white shadow md:left-5"><ChevronLeft/></button></>}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBanner(i)}
                    className={`size-2 rounded-full ${i === banner ? "bg-[#d58fa7]" : "bg-white"}`}
                  />
                ))}
              </div>
            </article>
          </section>
        )}
        <section id="categories" className="mx-auto max-w-7xl px-4 py-8">
          <p className="font-bold text-[#b3797f]">كل ما يحتاجه صغيرك</p>
          <h2 className="mb-6 text-3xl font-black">تسوقي حسب القسم</h2>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
            <button onClick={()=>go("all")} className="min-w-[72%] snap-center rounded-3xl border border-[#eadfd2] bg-gradient-to-br from-[#f8dce6] to-[#dff0f8] p-5 text-right shadow-sm transition-transform duration-300 hover:-translate-y-1 sm:min-w-0"><span className="mb-3 block text-2xl">🛍️</span><b>كل المنتجات</b><small className="mt-2 block text-gray-600">عرض جميع منتجات المتجر</small></button>
            {categories.filter((c) => !c.parentId).length ? (
              categories
                .filter((c) => !c.parentId)
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => filterCategory(c.id)}
                    className="min-w-[72%] snap-center rounded-3xl border border-[#eadfd2] bg-white p-5 text-right shadow-sm transition-transform duration-300 hover:-translate-y-1 sm:min-w-0"
                  >
                    <span className="mb-3 block text-2xl">
                      {c.icon || "🧸"}
                    </span>
                    <b>{c.name}</b>
                    <small className="mt-2 block text-gray-500">
                      {categories
                        .filter((x) => x.parentId === c.id)
                        .slice(0, 3)
                        .map((x) => x.name)
                        .join(" • ")}
                    </small>
                  </button>
                ))
            ) : (
              <p className="col-span-full rounded-2xl bg-white p-5">
                أضف الأقسام من لوحة الإدارة.
              </p>
            )}
          </div>
        </section>
        {!query && !category && mode === "all" && categories.filter((c) => !c.parentId).map((c) => {
          const ids = [c.id, ...categories.filter((x) => x.parentId === c.id).map((x) => x.id)];
          const sectionProducts = products.filter((p) => ids.includes(p.categoryId || 0)).slice(0, 4);
          if (!sectionProducts.length) return null;
          return <section key={c.id} className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><p className="text-sm font-bold text-[#b3797f]">{c.icon} تسوقي حسب القسم</p><h2 className="text-3xl font-black">{c.name}</h2></div>
              <button onClick={()=>filterCategory(c.id)} className="inline-flex items-center gap-1 font-bold text-[#b56d86]">عرض الكل <ChevronLeft size={18}/></button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">{categories.filter((x)=>x.parentId===c.id).map((x)=><button key={x.id} onClick={()=>filterCategory(x.id)} className="rounded-full border bg-white px-4 py-2 text-sm font-bold">{x.name}</button>)}</div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{sectionProducts.map((p)=>{const v=choose(p),out=p.variants.every(x=>x.stock<1);return <button key={p.id} onClick={()=>setDetail(p)} className="overflow-hidden rounded-[1.7rem] border bg-white text-right shadow-sm transition hover:-translate-y-1"><span className="relative block overflow-hidden"><ProductImage src={v?.images[0]?.imageUrl} name={p.name} className={`aspect-square w-full bg-[#fffaf8] object-contain p-2 ${out?"grayscale opacity-55":""}`}/>{out&&<span className="absolute inset-0 grid place-items-center bg-slate-600/35"><i className="absolute h-1 w-[140%] -rotate-45 rounded-full bg-slate-700/80"/><b className="relative z-10 rounded-full bg-slate-800/90 px-4 py-2 text-sm text-white shadow-lg">نفذت الكمية</b></span>}</span><span className="block p-4"><b className="block">{p.name}</b><small className="text-[#b56d86]">كود {p.sku}</small><strong className="mt-1 block">{money(p.price)}</strong></span></button>})}</div>
          </section>;
        })}
        <section id="products" className="mx-auto max-w-7xl px-4 py-10">
          <p className="font-bold text-[#b3797f]">
            {mode === "offers"
              ? "تخفيضات مختارة"
              : mode === "new"
                ? "وصل حديثاً"
                : category
                  ? categories.find((c) => c.id === category)?.name
                  : "كل المنتجات"}
          </p>
          <h2 className="mb-6 text-3xl font-black">
            {mode === "offers"
              ? "العروض"
              : mode === "new"
                ? "أحدث المنتجات"
                : "اختيارات لصغيرك"}
          </h2>
          {mode === "all" && <div className="mb-6 grid gap-3 rounded-3xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 rounded-2xl border px-3"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث بالاسم أو الكود" className="w-full py-3 outline-none"/></label>
            <select value={filterGender} onChange={e=>setFilterGender(e.target.value)} className="input"><option value="">كل الأنواع</option><option>بناتي</option><option>ولادي</option><option>مشترك</option></select>
            <select value={filterColor} onChange={e=>setFilterColor(e.target.value)} className="input"><option value="">كل الألوان</option>{colors.map(c=><option key={c}>{c}</option>)}</select>
            <select value={filterSize} onChange={e=>setFilterSize(e.target.value)} className="input"><option value="">كل الأعمار والمقاسات</option>{sizes.map(s=><option key={s}>{s}</option>)}</select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="input"><option value="new">الأحدث</option><option value="name">حسب الاسم</option><option value="price-low">السعر الأقل</option><option value="price-high">السعر الأعلى</option></select>
          </div>}
          {shown.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center">
              حالياً ما عدنا منتجات بهذا القسم... ترقبوا الجديد 🤍
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {shown.map((p) => {
                const v = choose(p);
                const soldOut = p.variants.every((x) => x.stock < 1);
                return (
                  <article
                    key={p.id}
                    className="animate-in overflow-hidden rounded-[2rem] border bg-white fade-in slide-in-from-bottom-3 duration-500 transition-transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    <button
                      onClick={() => setDetail(p)}
                      className="relative block w-full overflow-hidden"
                    >
                      <ProductImage
                        src={v?.images[0]?.imageUrl}
                        name={p.name}
                        className={`aspect-square w-full bg-[#fffaf8] object-contain p-2 transition ${soldOut ? "grayscale opacity-55" : ""}`}
                      />
                      {soldOut&&<span className="absolute inset-0 grid place-items-center bg-slate-600/35"><i className="absolute h-1.5 w-[145%] -rotate-45 rounded-full bg-slate-700/85"/><b className="relative z-10 rounded-full bg-slate-800/90 px-5 py-2.5 text-base text-white shadow-xl">نفذت الكمية</b></span>}
                    </button>
                    <div className="p-4">
                      <div>
                        {p.newArrival && (
                          <small className="ml-2 rounded-full bg-[#dff0f8] px-2 py-1">
                            جديد
                          </small>
                        )}
                        {p.offer && (
                          <small className="rounded-full bg-[#f8dce6] px-2 py-1">
                            عرض
                          </small>
                        )}
                      </div>
                      <button
                        onClick={() => setDetail(p)}
                        className="mt-3 text-right font-black hover:text-[#b56d86]"
                      >
                        {p.name}
                      </button>
                      <div>
                        <b>{money(p.price)}</b>{" "}
                        {p.oldPrice && (
                          <del className="text-sm text-gray-400">
                            {money(p.oldPrice)}
                          </del>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.variants.map((x) => (
                          <button
                            key={x.id}
                            disabled={x.stock < 1}
                            onClick={() =>
                              setSelected((s) => ({ ...s, [p.id]: x.id }))
                            }
                            className={`relative size-7 rounded-full border ${v?.id === x.id ? "ring-2 ring-[#b56d86] ring-offset-2" : ""} ${x.stock < 1 ? "opacity-30 after:absolute after:inset-x-0 after:top-1/2 after:h-px after:-rotate-45 after:bg-black" : ""}`}
                            style={{ background: x.colorHex || "#eee" }}
                            title={`${x.colorName}${x.stock < 1 ? " - نفذت" : ""}`}
                          />
                        ))}
                      </div>
                      <button
                        disabled={!v || v.stock < 1}
                        onClick={() => add(p, v)}
                        className={`mt-4 w-full rounded-full py-3 font-bold text-white transition-all duration-300 disabled:opacity-40 ${recentlyAdded===v?.id?"scale-105 bg-emerald-600 shadow-lg":"bg-[#d58fa7] active:scale-95"}`}
                      >
                        {soldOut?"نفذت الكمية":recentlyAdded===v?.id?"✓ تمت الإضافة للسلة":"أضف للسلة"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <section
          id="cart"
          className="mx-auto my-10 grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_360px]"
        >
          <div className="rounded-[2rem] bg-white p-5">
            <h2 className="text-2xl font-black">سلة التسوق</h2>
            {!cart.length ? (
              <p className="py-10 text-center">
                سلتك بعدّها تنتظر اختياراتك الجميلة 🤍
              </p>
            ) : (
              cart.map((x, i) => (
                <div
                  key={x.variant.id}
                  className="flex items-center gap-3 border-b py-4"
                >
                  <ProductImage
                    src={x.variant.images[0]?.imageUrl}
                    name={x.product.name}
                    className="size-20 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <b>{x.product.name}</b>
                    <small className="block text-[#b56d86]">كود المنتج: {x.product.sku}</small>
                    <p>
                      {x.variant.colorName}{" "}
                      {x.variant.size && `• ${x.variant.size}`}{" "}
                      {x.variant.age && `• ${x.variant.age}`}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          setCart((c) =>
                            c.map((y, n) =>
                              n === i
                                ? { ...y, qty: Math.max(1, y.qty - 1) }
                                : y,
                            ),
                          )
                        }
                      >
                        <Minus />
                      </button>
                      {x.qty}
                      <button
                        onClick={() =>
                          setCart((c) =>
                            c.map((y, n) =>
                              n === i
                                ? {
                                    ...y,
                                    qty: Math.min(y.variant.stock, y.qty + 1),
                                  }
                                : y,
                            ),
                          )
                        }
                      >
                        <Plus />
                      </button>
                      <button
                        className="text-red-600"
                        onClick={() =>
                          setCart((c) => c.filter((_, n) => n !== i))
                        }
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                  <b>{money(x.product.price * x.qty)}</b>
                </div>
              ))
            )}
          </div>
          <Checkout
            cart={cart}
            total={total}
            store={store}
            onSuccess={() => {
              setCart([]);
              fetch("/api/products")
                .then((r) => r.json())
                .then((x) => setProducts(x.products || []));
            }}
          />
        </section>
        <OrderTracking />
      </main>
      <footer className="site-footer px-4 py-10 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            {store.logo && (
              <img
                src={store.logo}
                className="mb-3 size-20 rounded-full object-cover"
              />
            )}
            <h2 className="text-xl font-black">{store.storeName}</h2>
          </div>
          <div>
            <p className="flex gap-2">
              <MapPin /> {store.address}
            </p>
            <a
              href={`tel:${(store.phone || "+964 790 506 8803").replace(/\s/g, "")}`}
              className="mt-2 inline-flex items-center rounded-full bg-white/10 px-4 py-2 font-bold hover:bg-white/20"
              dir="ltr"
            >
              +964 790 506 8803
            </a>
          </div>
          <div>
            <div className="flex gap-4">
              <a href={store.instagram} aria-label="Instagram"><InstagramIcon /></a>
              <a href={store.facebook} aria-label="Facebook"><FacebookIcon /></a>
              <a href={store.maps} aria-label="موقعنا على الخريطة"><MapPin /></a>
            </div>
            {payments.length>0&&<div className="mt-5"><b className="text-sm">{store.paymentMethodsTitle||"طرق الدفع المتوفرة"}</b><p className="mt-1 text-xs text-white/65">{store.paymentMethodsSubtitle||"للاستفسار عن الدفع عبر WhatsApp"}</p><div className="mt-3 flex flex-wrap gap-2">{payments.map(method=>{
              const whatsapp=(store.whatsapp||"9647905068803").replace(/\D/g,"");
              const href=method.actionType==='whatsapp'?`https://wa.me/${whatsapp}?text=${encodeURIComponent(method.whatsappMessage||`مرحباً، أريد معرفة تفاصيل الدفع عن طريق ${method.name}.`)}`:method.actionType==='direct'&&method.directUrl?method.directUrl:undefined;
              const content=method.logoUrl?<img src={method.logoUrl} alt={method.name} className="h-9 w-16 object-contain"/>:<span className={`payment-brand ${method.name.toLowerCase().includes('zain')?'zain':'card'}`}>{method.name}</span>;
              return href?<a key={method.id} href={href} target="_blank" rel="noreferrer" title={`استفسار عن ${method.name}`} className="grid h-12 min-w-20 place-items-center rounded-xl bg-white px-2 text-[#55434c] shadow-sm transition hover:-translate-y-0.5">{content}</a>:<span key={method.id} className="grid h-12 min-w-20 place-items-center rounded-xl bg-white px-2 text-[#55434c]">{content}</span>
            })}</div></div>}
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-5 text-center text-sm text-white/75">{store.copyright||"© جميع الحقوق محفوظة للعبيدي لأناقة طفلك 2026."}</p>
      </footer>
      <a
        className="fixed bottom-20 left-4 grid size-14 place-items-center rounded-full bg-[#25d366] text-white md:bottom-5"
        href={`https://wa.me/${store.whatsapp || "9647905068803"}`}
      >
        <MessageCircle />
      </a>
      {recentlyAdded!==null&&<div className="fixed bottom-24 right-1/2 z-[90] flex translate-x-1/2 animate-in items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 font-black text-white shadow-2xl fade-in slide-in-from-bottom-4 md:bottom-8"><CheckCircle2/> تمت إضافة المنتج إلى السلة</div>}
      <ProductDialog
        product={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        selected={detail ? choose(detail) : undefined}
        onSelect={(v) =>
          detail && setSelected((s) => ({ ...s, [detail.id]: v.id }))
        }
        onAdd={add}
      />
      {sizeGuideOpen&&<div className="fixed inset-0 z-[110] grid place-items-center bg-[#3c3035]/65 p-3" onClick={()=>setSizeGuideOpen(false)}>
        <section role="dialog" aria-modal="true" aria-label="دليل المقاسات" onClick={e=>e.stopPropagation()} className="size-guide-modal max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="relative bg-gradient-to-l from-[#f8dce6] to-[#dff0f8] p-5 md:p-7"><button onClick={()=>setSizeGuideOpen(false)} className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-white shadow" aria-label="إغلاق"><X/></button><p className="font-bold text-[#b3797f]">{store.storeName||"العبيدي لأناقة طفلك"}</p><h2 className="mt-1 text-3xl font-black">دليل المقاسات</h2><p className="mt-2">استخدم هذا الدليل لاختيار المقاس المناسب لطفلك حسب العمر والوزن.</p><p className="mt-3 rounded-2xl bg-white/70 p-3 text-sm font-bold">المقاسات تقريبية وقد تختلف حسب الشركة المصنعة. إذا كنت غير متأكد، اختر المقاس الأكبر.</p></div>
          <div className="max-h-[55vh] overflow-auto"><table className="w-full min-w-[620px] border-collapse text-right"><thead className="sticky top-0 bg-[#fff9fb]"><tr><th className="p-4">المقاس</th><th className="p-4">الفئة العمرية</th><th className="p-4">الوزن التقريبي</th></tr></thead><tbody>{sizeGuideRows.map((row,i)=><tr key={`${row[0]}-${i}`} className="border-t transition hover:bg-[#fff9fb]"><td className="p-4 font-black text-[#b56d86]">{row[0]}</td><td className="p-4">{row[1]||"-"}</td><td className="p-4">{row[2]||"-"}</td></tr>)}</tbody></table></div>
        </section>
      </div>}
    </div>
  );
}
function ProductDialog({
  product,
  open,
  onOpenChange,
  selected,
  onSelect,
  onAdd,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected?: Variant;
  onSelect: (v: Variant) => void;
  onAdd: (p: Product, v: Variant) => void;
}) {
  const [imageIndex,setImageIndex]=useState(0),[imageTouch,setImageTouch]=useState<number|null>(null),[imageOpen,setImageOpen]=useState(false);
  const images=selected?.images?.length?selected.images:(product?.variants.find(v=>v.images.length)?.images||[]);
  useEffect(()=>setImageIndex(0),[product?.id,selected?.id,open]);
  if (!product) return null;
  const move=(direction:number)=>images.length>1&&setImageIndex(x=>(x+direction+images.length)%images.length);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-right text-2xl">
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-right">
            {product.shortDescription || "تفاصيل المنتج"}
          </DialogDescription>
        </DialogHeader>
        <div className="relative overflow-hidden rounded-2xl touch-pan-y select-none" onTouchStart={e=>setImageTouch(e.touches[0].clientX)} onTouchEnd={e=>{if(imageTouch===null)return;const d=e.changedTouches[0].clientX-imageTouch;if(Math.abs(d)>40)move(d<0?1:-1);setImageTouch(null)}}>
          <button type="button" onClick={()=>images[imageIndex]?.imageUrl&&setImageOpen(true)} className="block w-full cursor-zoom-in bg-[#fffaf8]" aria-label="تكبير صورة المنتج"><ProductImage key={`${selected?.id}-${imageIndex}`} src={images[imageIndex]?.imageUrl} name={product.name} className="aspect-square w-full animate-in object-contain p-3 fade-in duration-300" /></button>
          {images.length>1&&<><button onClick={()=>move(-1)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow" aria-label="الصورة السابقة"><ChevronLeft className="rotate-180"/></button><button onClick={()=>move(1)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow" aria-label="الصورة التالية"><ChevronLeft/></button><div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">{images.map((_,i)=><button key={i} onClick={()=>setImageIndex(i)} className={`size-2.5 rounded-full ${i===imageIndex?"bg-[#d58fa7]":"bg-white"}`} aria-label={`الصورة ${i+1}`}/>)}</div></>}
        </div>
        {images.length>1&&<div className="flex gap-2 overflow-x-auto pb-1">{images.map((img,i)=><button key={i} onClick={()=>setImageIndex(i)} className={`shrink-0 overflow-hidden rounded-xl border-2 ${i===imageIndex?"border-[#d58fa7]":"border-transparent"}`}><img src={img.imageUrl} alt={`${product.name} ${i+1}`} className="size-16 bg-white object-contain"/></button>)}</div>}
        {imageOpen&&<div className="fixed inset-0 z-[120] grid cursor-zoom-out place-items-center bg-black/85 p-3" onClick={()=>setImageOpen(false)}><img src={images[imageIndex]?.imageUrl} alt={product.name} className="max-h-[94vh] max-w-[96vw] object-contain"/><button type="button" className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-white text-black" aria-label="إغلاق الصورة"><X/></button></div>}
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#fff4f7] p-4">
          <span>
            السعر: <b>{money(product.price)}</b>
          </span>
          <span>
            كود المنتج: <b>{product.sku}</b>
          </span>
          <span>
            الجنس: <b>{product.gender || "مشترك/غير محدد"}</b>
          </span>
          <span>العمر والقياس: <b>{selected?.size || selected?.age || "غير محدد"}</b></span>
          <span>
            اللون: <b>{selected?.colorName || "غير محدد"}</b>
          </span>
          <span><b>{selected?.stock ? "متوفر" : "نفذت الكمية"}</b></span>
        </div>
        <p>{product.description}</p>
        <div>
          <b>اختاري اللون والعمر/القياس:</b>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <button
                key={v.id}
                disabled={v.stock < 1}
                onClick={() => onSelect(v)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 ${selected?.id === v.id ? "ring-2 ring-[#d58fa7]" : ""} ${v.stock < 1 ? "opacity-40" : ""}`}
              >
                <span
                  className="size-6 rounded-full border"
                  style={{ background: v.colorHex || "#eee" }}
                />
                {[v.colorName,v.size||v.age].filter(Boolean).join(" • ") || "اختيار المنتج"}
              </button>
            ))}
          </div>
        </div>
        <button
          disabled={!selected || selected.stock < 1}
          onClick={() => selected && onAdd(product, selected)}
          className="rounded-full bg-[#d58fa7] py-3 font-bold text-white"
        >
          أضف للسلة
        </button>
      </DialogContent>
    </Dialog>
  );
}
type TrackedOrder = {orderNumber:string;status:string;createdAt:number;approvedAt?:number;shippingAt?:number;deliveredAt?:number;governorate?:string;total:number;items:Array<{productName:string;productCode?:string;colorName?:string;size?:string;age?:string;quantity:number;imageUrl?:string;status:string}>};
function OrderTracking(){
  const [orderNumber,setOrderNumber]=useState(""),[phone,setPhone]=useState(""),[order,setOrder]=useState<TrackedOrder|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function track(){setBusy(true);setError("");setOrder(null);const r=await fetch("/api/track-order",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({orderNumber,phone})});const x=await r.json();setBusy(false);if(!r.ok)setError(x.error||"تعذر تتبع الطلب");else setOrder(x.order)}
  const steps=[{id:"pending",label:"الطلب في المخزن",icon:PackageSearch},{id:"shipping",label:"في مكتب شركة الشحن",icon:Truck},{id:"delivered",label:"تم توصيل الطلب",icon:CheckCircle2}];
  const active=order?.status==="delivered"?2:order?.status==="shipping"?1:0;
  return <section id="track-order" className="relative mx-auto my-8 max-w-7xl overflow-hidden px-4 py-10">
    <i className="absolute right-[8%] top-8 size-20 animate-pulse rounded-full bg-[#f8dce6]/70"/><i className="absolute bottom-4 left-[7%] size-28 animate-pulse rounded-full bg-[#dff0f8]/70 [animation-delay:400ms]"/>
    <div className="relative rounded-[2rem] border border-[#eadfd2] bg-white/90 p-5 shadow-sm md:p-8">
      <p className="font-bold text-[#b3797f]">وين وصل طلبك؟</p><h2 className="text-3xl font-black">تتبع الطلب</h2><p className="mt-2">اكتب رقم الطلب الذي وصلك في رسالة WhatsApp مع رقم هاتفك.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} placeholder="رقم الطلب: ALB-..." className="input uppercase"/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="رقم الهاتف" className="input"/><button disabled={busy} onClick={track} className="rounded-2xl bg-[#d58fa7] px-7 py-3 font-black text-white disabled:opacity-50">{busy?"جاري البحث...":"تتبع الآن"}</button></div>
      {error&&<p className="mt-4 rounded-2xl bg-red-50 p-3 text-red-700">{error}</p>}
      {order&&<div className="mt-7 rounded-3xl bg-[#fff9fb] p-5">
        <div className="flex flex-wrap justify-between gap-2"><b>طلب {order.orderNumber}</b><b>{money(order.total)}</b></div>
        <div className="relative mt-7 grid grid-cols-3 gap-2 before:absolute before:right-[16%] before:left-[16%] before:top-6 before:h-1 before:rounded-full before:bg-[#eadfd2]">{steps.map((s,i)=>{const I=s.icon;return <div key={s.id} className="relative z-10 text-center"><span className={`mx-auto grid size-12 place-items-center rounded-full transition-all duration-700 ${i<=active?"scale-110 bg-[#d58fa7] text-white shadow-lg":"bg-white text-gray-400"}`}><I/></span><b className="mt-3 block text-sm">{s.label}</b></div>})}</div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">{order.items.filter(i=>i.status!=="rejected").map((i,n)=><div key={n} className="flex gap-3 rounded-2xl bg-white p-3">{i.imageUrl?<img src={i.imageUrl} className="size-16 rounded-xl object-cover" alt={i.productName}/>:<span className="grid size-16 place-items-center rounded-xl bg-[#dff0f8]"><Baby/></span>}<div><b>{i.productName}</b><small className="block">كود: {i.productCode||"—"} • الكمية: {i.quantity}</small><small>{[i.colorName,i.size,i.age].filter(Boolean).join(" • ")}</small></div></div>)}</div>
      </div>}
    </div>
  </section>
}
function Checkout({
  cart,
  total,
  store,
  onSuccess,
}: {
  cart: Cart[];
  total: number;
  store: Record<string, string>;
  onSuccess: () => void;
}) {
  const [f, setF] = useState({ name: "", phone: "", governorate: "", address: "", landmark: "", notes: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const delivery = !f.governorate ? 0 : f.governorate === "بغداد" ? +(store.baghdadDeliveryFee || 5000) : +(store.provinceDeliveryFee || 6000);
  const grandTotal = total + delivery;
  async function send() {
    if (!f.name || !f.phone || !f.governorate || !f.address)
      return setError("يرجى إكمال الاسم والهاتف والمحافظة والعنوان");
    setBusy(true);
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerName: f.name,
        phone: f.phone,
        governorate: f.governorate,
        address: f.address,
        landmark: f.landmark,
        notes: f.notes,
        items: cart.map((x) => ({ variantId: x.variant.id, quantity: x.qty })),
      }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) return setError(data.error || "تعذر تسجيل الطلب");
    const items = cart
      .map(
        (x, i) =>
          `${i + 1}- ${x.product.name}\nكود المنتج: ${x.product.sku}\nاللون: ${x.variant.colorName || "غير محدد"}\n${x.variant.age ? `العمر: ${x.variant.age}\n` : ""}${x.variant.size ? `المقاس: ${x.variant.size}\n` : ""}الكمية: ${x.qty}\nالمجموع: ${money(x.product.price * x.qty)}`,
      )
      .join("\n━━━━━━━━━━━━━━\n");
    const msg = `طلب جديد - ${store.storeName || "العبيدي لأناقة طفلك"}\nرقم الطلب: ${data.order.orderNumber}\nالاسم: ${f.name}\nالهاتف: ${f.phone}\nالمحافظة: ${f.governorate}\nالعنوان: ${f.address}\nأقرب نقطة دالة: ${f.landmark || "غير محدد"}\n--------------------\n${items}\n--------------------\nمجموع المنتجات: ${money(total)}\nالتوصيل: ${money(delivery)}\nمدة التوصيل: من 12 إلى 48 ساعة\nالمجموع الكلي: ${money(grandTotal)}\nالملاحظات: ${f.notes || "لا توجد ملاحظات"}\n\n${store.shippingTerms || ""}`;
    onSuccess();
    window.open(
      `https://wa.me/${store.whatsapp || "9647905068803"}?text=${encodeURIComponent(msg)}`,
    );
  }
  return (
    <aside className="h-fit rounded-[2rem] bg-[#f1e6dc] p-5">
      <h3 className="text-xl font-black">إكمال الطلب</h3>
      {[
        ["name", "الاسم الكامل"],
        ["phone", "رقم الهاتف"],
      ].map(([k, l]) => (
        <input key={k} placeholder={l} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="input" />
      ))}
      <select value={f.governorate} onChange={(e)=>setF({...f,governorate:e.target.value})} className="input">
        <option value="">اختر المحافظة</option>
        {governorates.map(g=><option key={g}>{g}</option>)}
      </select>
      {[
        ["address", "المنطقة والعنوان"],
        ["landmark", "أقرب نقطة دالة (اختياري)"],
        ["notes", "ملاحظات (اختياري)"],
      ].map(([k, l]) => (
        <input
          key={k}
          placeholder={l}
          onChange={(e) => setF({ ...f, [k]: e.target.value })}
          className="input"
        />
      ))}
      {error && <p className="mt-3 text-red-600">{error}</p>}
      <div className="mt-5 space-y-2 border-t pt-4">
        <div className="flex justify-between"><span>مجموع المنتجات</span><b>{money(total)}</b></div>
        <div className="flex justify-between"><span>التوصيل</span><b>{delivery ? money(delivery) : "اختر المحافظة"}</b></div>
        <p className="text-sm">⏱ مدة التوصيل من 12 إلى 48 ساعة</p>
        <div className="flex justify-between text-xl"><b>المجموع الكلي</b><b>{money(grandTotal)}</b></div>
      </div>
      {store.shippingTerms && <details className="mt-4 rounded-2xl bg-white/60 p-3 text-sm"><summary className="cursor-pointer font-bold">شروط الشحن والاستبدال</summary><p className="mt-2 whitespace-pre-line leading-6">{store.shippingTerms}</p></details>}
      <button
        disabled={!cart.length || busy}
        onClick={send}
        className="mt-5 w-full rounded-full bg-[#25a85a] py-3 font-black text-white disabled:opacity-40"
      >
        {busy ? "جاري تسجيل الطلب..." : "إرسال الطلب عبر WhatsApp"}
      </button>
    </aside>
  );
}
