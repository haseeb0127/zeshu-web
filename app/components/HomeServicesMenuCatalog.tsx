'use client';

import {useEffect,useState} from 'react';
import { HOME_SERVICE_CATEGORIES } from '@/app/lib/home-services-categories';
import { HOME_SERVICE_MENUS } from '@/app/lib/home-services-menu';
import { ClipboardList, MapPin, ReceiptText, ShieldCheck } from 'lucide-react';

export default function HomeServicesMenuCatalog() {
  const [searchTerm,setSearchTerm]=useState('');
  useEffect(()=>{setSearchTerm((new URLSearchParams(window.location.search).get('q')||'').slice(0,120));},[]);
  const categories=HOME_SERVICE_CATEGORIES.filter(category=>!searchTerm.trim() ||
    [category.label,category.detail,...HOME_SERVICE_MENUS[category.code].map(x=>x.name+' '+x.scope)]
    .join(' ').toLowerCase().includes(searchTerm.trim().toLowerCase()));
  return <section id="service-menus" className="mt-7 scroll-mt-36" aria-label="Standardised home-service menu cards">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#075E45]">Compare services clearly</p>
        <h2 className="mt-1 text-2xl font-black">Standard service menu cards</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Every professional will set their own rates for the same defined work. Listed units are a preview of the future comparison format, not live provider offers or fixed Zeshu prices.</p>
      </div>
      <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">Pricing &amp; verified listings not yet live</span>
    </div>
    {searchTerm && <div className="mt-3 flex items-center justify-between gap-2 text-xs"><span>{categories.length} service categories for <strong>{searchTerm}</strong></span><button type="button" onClick={()=>setSearchTerm('')} className="font-bold text-[#087e72] underline">Show all</button></div>}
    {categories.length===0 && <p className="mt-3 rounded-xl bg-white p-4 text-sm text-slate-600">No standard service menu matches this search. You can still describe the job in a free quote enquiry.</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {categories.map(category => <article id={`service-${category.code.toLowerCase()}`} key={category.code} className="scroll-mt-36 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-[#075E45]"><ClipboardList size={21}/></span><div><h3 className="font-black">{category.label}</h3><p className="mt-1 text-xs text-slate-500">{category.visit ? 'Home-visit enquiry' : 'Salon appointment enquiry'} · Jagtial only</p></div></div>
        <ul className="mt-4 divide-y divide-slate-100">
          {HOME_SERVICE_MENUS[category.code].map(item => <li key={item.name} className="flex items-start justify-between gap-3 py-3 text-xs">
            <div className="min-w-0"><p className="font-black text-slate-800">{item.name}</p><p className="mt-1 leading-5 text-slate-500">{item.scope}</p></div>
            <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-black ${item.pricing === 'UPFRONT' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{item.pricing === 'UPFRONT' ? 'Pro-set rate' : 'Written quote'}</span>
          </li>)}
        </ul>
      </article>)}
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><MapPin className="text-[#075E45]" size={21}/><h3 className="mt-2 text-sm font-black">Travel price disclosed</h3><p className="mt-1 text-xs leading-5 text-slate-600">Professionals declare their free travel radius and any extra charges in advance.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><ReceiptText className="text-[#075E45]" size={21}/><h3 className="mt-2 text-sm font-black">No surprise parts bills</h3><p className="mt-1 text-xs leading-5 text-slate-600">Materials, product brands, visit charges and taxes must be itemised and approved before extra work.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><ShieldCheck className="text-[#075E45]" size={21}/><h3 className="mt-2 text-sm font-black">Real verification only</h3><p className="mt-1 text-xs leading-5 text-slate-600">Provider photos, prices, ratings and availability will appear only after verification and data review.</p></div>
    </div>
  </section>;
}
