'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, MapPin, Truck } from 'lucide-react';
import { MOVE_QUOTE_TOWNS, MOVE_QUOTE_SERVICES } from '@/app/lib/move-quote-enquiry';

const options=['OUTSTATION_CAB','RETURN_CAB','MINI_TRUCK','LARGE_TRUCK','CHARTER_BUS'] as const;

export default function MoveQuickQuote() {
  const [pickup,setPickup]=useState<string>('Jagtial');
  const [destination,setDestination]=useState('');
  const [service,setService]=useState<typeof options[number]>('OUTSTATION_CAB');

  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const dest=destination.trim();
    if(dest.length<3 || dest.length>200)return;
    const query=new URLSearchParams({service,pickup_town:pickup,destination:dest});
    // This opens the existing manual enquiry: NO driver assignment, map API,
    // live ride matching, fare or payment is started here.
    window.location.assign('/move/quote?'+query.toString());
  };

  return <section id="move-journey" className="mt-6 scroll-mt-36 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm md:p-7">
    <p className="text-xs font-black uppercase tracking-widest text-[#6b4c00]">Start with your pickup and drop</p>
    <h2 className="mt-2 text-2xl font-black text-slate-900">Where would you like to go?</h2>
    <p className="mt-2 text-sm text-slate-600">Plan a cab or goods journey and continue to a free operator quote. Instant matching, live prices and maps are not active for unverified services.</p>
    <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[1fr_1.5fr_1fr_auto] md:items-end">
      <label className="text-xs font-black text-slate-700">Pickup town
        <span className="relative mt-1 flex items-center"><MapPin size={17} className="pointer-events-none absolute left-3 text-amber-700"/>
          <select required value={pickup} onChange={e=>setPickup(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-2 text-sm">
            {MOVE_QUOTE_TOWNS.map(town=><option key={town} value={town}>{town}</option>)}
          </select>
        </span>
      </label>
      <label className="text-xs font-black text-slate-700">Destination / drop-off
        <input required minLength={3} maxLength={200} value={destination} onChange={e=>setDestination(e.target.value)}
          placeholder="Enter city, landmark or venue" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"/>
      </label>
      <label className="text-xs font-black text-slate-700">Vehicle / job
        <span className="relative mt-1 flex items-center"><Truck size={17} className="pointer-events-none absolute left-3 text-amber-700"/>
          <select value={service} onChange={e=>setService(e.target.value as typeof options[number])} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-2 text-sm">
            {options.map(code=><option key={code} value={code}>{MOVE_QUOTE_SERVICES[code].label}</option>)}
          </select>
        </span>
      </label>
      <button type="submit" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#242a35] px-4 py-3 text-sm font-black text-white">Get quote <ArrowRight size={16}/></button>
    </form>
    <p className="mt-3 text-xs text-slate-500">You review date, passenger/load details and consent on the next screen. No advance is collected.</p>
  </section>;
}
