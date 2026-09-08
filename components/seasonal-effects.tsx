"use client";
import { useMemo } from "react";

export type SeasonalEffect={id:number;name:string;preset:string;active:boolean;startDate:string|null;endDate:string|null;speed:string;density:number;opacity:number;elementSize:number;motion:string;desktopEnabled:boolean;mobileEnabled:boolean;pages:string;customSymbols:string|null;barEnabled:boolean;barText:string|null;barTextColor:string;barBackground:string;barLink:string|null;sortOrder:number};
const presetSymbols:Record<string,string[]>={
  ramadan:["🏮","☾","✦","⭐"],eid:["☾","✨","🎉","✦"],autumn:["🍂","🍁","🍃"],spring:["🌸","🌼","❀","🦋"],winter:["❄","❅","❆"],rain:["💧","﹨","·"],summer:["☀","✦","🌤️"],night:["☾","✦","⭐","·"],christmas:["❄","⭐","✨","🎄"],custom:["✨"]
};
function isScheduled(x:SeasonalEffect){const today=new Date().toISOString().slice(0,10);return x.active&&(!x.startDate||x.startDate<=today)&&(!x.endDate||x.endDate>=today)}
export function SeasonalEffects({effects,disabled=false,suppress=false,preview=false}:{effects:SeasonalEffect[];disabled?:boolean;suppress?:boolean;preview?:boolean}){
  const active=useMemo(()=>effects.filter(x=>(preview?x.active:isScheduled(x))),[effects,preview]);
  if(disabled||suppress||!active.length)return null;
  const bar=active.find(x=>x.barEnabled&&x.barText);
  return <>
    {bar&&(bar.barLink?<a href={bar.barLink} className="relative z-50 block px-4 py-2 text-center text-sm font-black" style={{color:bar.barTextColor,background:bar.barBackground}}>{bar.barText}</a>:<div className="relative z-50 px-4 py-2 text-center text-sm font-black" style={{color:bar.barTextColor,background:bar.barBackground}}>{bar.barText}</div>)}
    <div aria-hidden="true" className="seasonal-effects-layer pointer-events-none fixed inset-0 z-[35] overflow-hidden">
      {active.map(effect=>{
        const symbols=effect.preset==="custom"&&effect.customSymbols?.trim()?Array.from(effect.customSymbols.replace(/\s+/g,"")):presetSymbols[effect.preset]||presetSymbols.custom;
        const count=Math.max(3,Math.min(42,Math.round(effect.density*.42)));
        return <div key={effect.id} className={`seasonal-preset-${effect.preset} ${effect.mobileEnabled?"":"hidden md:block"} ${effect.desktopEnabled?"":"md:hidden"}`}>
          {Array.from({length:count},(_,i)=><span key={i} className={`seasonal-particle seasonal-${effect.motion} speed-${effect.speed} ${i>=Math.ceil(count*.55)?"seasonal-mobile-extra":""}`} style={{left:`${(i*37+11)%101}%`,top:`${-12-(i*19)%75}px`,fontSize:`${effect.elementSize*(.78+(i%4)*.09)}px`,opacity:effect.opacity/100,animationDelay:`-${(i*0.73)%8}s`,animationDuration:`${7+(i%6)}s`}}>{symbols[i%symbols.length]}</span>)}
        </div>
      })}
    </div>
  </>;
}
