"use client";

import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from '@/app/components/DocumentLink';
import {customerSupabase} from '@/app/lib/browser-supabase';
import {CalendarDays,Clock,ChefHat,UtensilsCrossed,ShieldCheck,MapPin,ArrowRight,Store,RefreshCw} from 'lucide-react';

type Restaurant={id:string;name:string;city:string;area:string;address:string;fssai_registration:string;
 opens_at:string;closes_at:string;min_notice_minutes:number;preorder_enabled:boolean;max_party_size:number};
type Dish={id:string;restaurant_id:string;name:string;category:string;price_paise:number;prep_minutes:number;available:boolean};
type Booking={id:string;restaurant_id:string;arrival_at:string;requested_serve_at:string;confirmed_serve_at:string|null;prep_start_at:string|null;
 party_size:number;status:string;kitchen_status:string;preordered_items:Array<{name:string;quantity:number}>;
 estimated_total_paise:number};
const rupees=(paise:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(paise/100);
const when=(iso:string)=>new Date(iso).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'});
const todayInput=()=>{
 const d=new Date(Date.now()+2*60*60*1000);
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
 const val=(name:string)=>parts.find(p=>p.type===name)?.value||'';
 return val('year')+'-'+val('month')+'-'+val('day')+'T'+val('hour')+':'+val('minute');
};

export default function DinePage(){
 const [restaurants,setRestaurants]=useState<Restaurant[]>([]);
 const [menu,setMenu]=useState<Dish[]>([]);
 const [restaurantId,setRestaurantId]=useState('');
 const [quantities,setQuantities]=useState<Record<string,number>>({});
 const [partySize,setPartySize]=useState(2);
 const [arrival,setArrival]=useState('');
 const [serveOffset,setServeOffset]=useState(5);
 const [contactName,setContactName]=useState('');
 const [contactPhone,setContactPhone]=useState('');
 const [notes,setNotes]=useState('');
 const [bookings,setBookings]=useState<Booking[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [partner,setPartner]=useState({restaurantName:'',city:'Jagtial',contactName:'',phone:'',fssaiNumber:'',notes:'',consent:false,website:''});
 const [partnerBusy,setPartnerBusy]=useState(false);
 const [partnerMessage,setPartnerMessage]=useState('');
 const [partnerError,setPartnerError]=useState('');
 const chosen=restaurants.find(r=>r.id===restaurantId)||null;
 const dishes=useMemo(()=>menu.filter(x=>x.restaurant_id===restaurantId),[menu,restaurantId]);
 const selected=useMemo(()=>dishes.filter(d=>(quantities[d.id]||0)>0),[dishes,quantities]);
 const estimatedTotal=selected.reduce((sum,d)=>sum+d.price_paise*(quantities[d.id]||0),0);
 const longestPrep=selected.reduce((best,d)=>Math.max(best,d.prep_minutes),0);
 const auth=async()=>{
  const {data}=await customerSupabase().auth.getSession();
  return data.session?.access_token||'';
 };
 const refreshMine=useCallback(async()=>{
  const token=await auth();
  if(!token){setBookings([]);return;}
  const res=await fetch('/api/dine/bookings',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  const p=await res.json().catch(()=>({}));
  if(res.ok)setBookings(Array.isArray(p.bookings)?p.bookings:[]);
 },[]);
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const res=await fetch('/api/dine',{cache:'no-store'});
   const p=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(p.error||'Restaurants are temporarily unavailable.');
   const rows:Restaurant[]=Array.isArray(p.restaurants)?p.restaurants:[];
   setRestaurants(rows);setMenu(Array.isArray(p.menu)?p.menu:[]);
   setRestaurantId(current=>rows.some(x=>x.id===current)?current:(rows[0]?.id||''));
   setError('');
   await refreshMine().catch(()=>{});
  }catch(e){setError(e instanceof Error?e.message:'Unable to load dining partners.');}
  finally{setLoading(false);}
 },[refreshMine]);
 useEffect(()=>{setArrival(todayInput());void refresh();},[refresh]);
 // In-page status refresh only; no WhatsApp, SMS or customer notification sends.
 useEffect(()=>{const timer=window.setInterval(()=>void refreshMine().catch(()=>{}),30_000);return()=>window.clearInterval(timer);},[refreshMine]);

 async function reserve(event:React.FormEvent){
  event.preventDefault();
  setMessage('');setError('');
  if(!chosen)return;
  const token=await auth();
  if(!token){setError('Please sign in to your Zeshu customer account first.');return;}
  const iso=new Date(arrival).toISOString();
  setBusy(true);
  try{
   const res=await fetch('/api/dine/bookings',{
    method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({restaurantId:chosen.id,partySize,arrivalAt:iso,serveOffsetMinutes:serveOffset,
     contactName,contactPhone,notes,items:selected.map(d=>({id:d.id,quantity:quantities[d.id]}))}),
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(data.error||'Request was not accepted.');
   setMessage('Your request has been received—not confirmed yet. The restaurant must confirm the table and estimated serving time. No payment was taken.');
   await refreshMine();
  }catch(e){setError(e instanceof Error?e.message:'Unable to submit your dining request.');}
  finally{setBusy(false);}
 }
 async function cancelBooking(id:string){
  const token=await auth();if(!token)return;
  setBusy(true);setError('');setMessage('');
  try{
   const r=await fetch('/api/dine/bookings',{method:'PATCH',
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    body:JSON.stringify({action:'cancel',bookingId:id})});
   const p=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(p.error||'Cancellation could not be saved.');
   setMessage('Reservation request cancelled.');await refreshMine();
  }catch(e){setError(e instanceof Error?e.message:'Cancellation unavailable.');}
  finally{setBusy(false);}
 }
 async function applyPartner(event:React.FormEvent){
  event.preventDefault();setPartnerBusy(true);setPartnerMessage('');setPartnerError('');
  try{
   const res=await fetch('/api/dine/partner',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(partner)});
   const p=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(p.error||'Could not submit restaurant details.');
   setPartnerMessage(p.note||'Your restaurant enquiry has been received.');
  }catch(e){setPartnerError(e instanceof Error?e.message:'Unable to submit details.');}
  finally{setPartnerBusy(false);}
 }
 const input='w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-emerald-700 focus:outline-none';
 return <main data-zeshu-experience="glossy" className="zeshu-experience min-h-screen bg-[#f4f8f5] text-slate-900">
  <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
   <Link href="/" className="text-sm font-bold text-[#075E45]">← Back to Zeshu</Link>
   <section className="mt-5 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#054532,#0d8056)] px-6 py-9 text-white shadow-xl md:px-10">
    <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-black tracking-wide"><UtensilsCrossed size={17}/> ZESHU DINE • JAGTIAL FIRST</p>
    <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight md:text-5xl">Your table. Your meal. Your arrival time.</h1>
    <p className="mt-4 max-w-3xl text-base leading-7 text-emerald-50">Request a restaurant table and optionally choose your food before you travel. The restaurant confirms the seat and schedules cooking close to your arrival—so your meal can be served fresh with less waiting.</p>
    <p className="mt-3 text-sm font-semibold text-emerald-100">No fake open tables, no guessed kitchen promises and no payment before restaurant confirmation.</p>
   </section>
   <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
    {[
     {icon:CalendarDays,title:'1. Choose a real table',body:'Select your restaurant, guests and arrival time. You send a request, not an instant guarantee.'},
     {icon:ChefHat,title:'2. Pre-order your meal',body:'Select dishes from that restaurant’s verified menu. The kitchen confirms the estimated serving time.'},
     {icon:Clock,title:'3. Arrive at the right time',body:'Check your live booking status. Cooking starts near serving time—not too early.'},
    ].map(x=><section key={x.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><x.icon size={26} className="text-[#075E45]"/><h2 className="mt-3 font-black">{x.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{x.body}</p></section>)}
   </div>
   <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-black">Reserve & pre-order</h2><p className="mt-1 text-sm text-slate-600">Only restaurants that pass onboarding and provide actual table capacity appear below.</p></div>
     <button type="button" onClick={()=>void refresh()} className="rounded-xl border p-3" aria-label="Refresh dining partners"><RefreshCw size={19}/></button></div>
    {loading?<p className="mt-6 text-sm text-slate-600">Checking verified restaurants…</p>:
     restaurants.length===0?<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
       <h3 className="text-lg font-black text-amber-950">Restaurant bookings are opening soon</h3>
       <p className="mt-2 text-sm leading-6 text-amber-900">No restaurant has an active, verified Zeshu table inventory yet. We are inviting restaurants in Jagtial first. You cannot book or pre-pay until a real partner is ready.</p>
       <a href="#join" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-900 underline">Own a restaurant? Apply here <ArrowRight size={16}/></a>
      </div>:
      <form onSubmit={reserve} className="mt-5 space-y-4">
       <label className="block text-sm font-bold">Restaurant
        <select className={input+' mt-2'} value={restaurantId} onChange={e=>{setRestaurantId(e.target.value);setQuantities({});}}>
         {restaurants.map(r=><option key={r.id} value={r.id}>{r.name} · {r.city}</option>)}</select></label>
       {chosen&&<div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6">
        <p className="flex items-center gap-1 font-bold text-emerald-950"><MapPin size={16}/>{chosen.address}, {chosen.city}</p>
        <p className="text-slate-700">Hours {chosen.opens_at.slice(0,5)}–{chosen.closes_at.slice(0,5)} IST · FSSAI registration: {chosen.fssai_registration}</p>
        <p className="text-slate-600">Table capacity verified by Zeshu, but a booking is confirmed only after staff accept it.</p>
       </div>}
       <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">Guests
         <input className={input+' mt-2'} type="number" min="1" max={chosen?.max_party_size||24} value={partySize} onChange={e=>setPartySize(Number(e.target.value))} required/></label>
        <label className="text-sm font-bold">Arrive at the restaurant (IST)
         <input className={input+' mt-2'} type="datetime-local" value={arrival} onChange={e=>setArrival(e.target.value)} required/></label>
       </div>
       {chosen?.preorder_enabled&&<section className="rounded-2xl border border-slate-200 p-4">
        <h3 className="font-black">Pre-order dishes (optional)</h3><p className="mt-1 text-xs text-slate-600">Restaurant confirms preparation and final availability. Prices below are estimates payable directly at the restaurant.</p>
        {dishes.length===0?<p className="mt-3 text-sm text-slate-600">Menu not available yet. You can still request just the table.</p>:<div className="mt-3 space-y-2">
        {dishes.map(d=><div key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
         <div className="min-w-0"><p className="font-bold">{d.name}</p><p className="text-xs text-slate-500">{rupees(d.price_paise)} · kitchen estimates about {d.prep_minutes} min for this dish</p></div>
         <input type="number" aria-label={'Quantity of '+d.name} min="0" max="12" className="w-16 rounded-lg border bg-white p-2 text-center" value={quantities[d.id]||0}
          onChange={e=>setQuantities(old=>({...old,[d.id]:Math.max(0,Math.min(12,Number(e.target.value)||0))}))}/>
        </div>)}</div>}
        <p className="mt-4 font-black">Estimated food total: {rupees(estimatedTotal)} · Pay at restaurant</p>
        {longestPrep>0&&<p className="mt-1 text-xs text-slate-600">Longest individual dish prep estimate: {longestPrep} min. Final timing depends on kitchen capacity.</p>}
       </section>}
       <label className="block text-sm font-bold">Preferred meal serving time
        <select className={input+' mt-2'} value={serveOffset} onChange={e=>setServeOffset(Number(e.target.value))}>
         {[0,5,10,15,20,30].map(m=><option key={m} value={m}>{m===0?'When I arrive':m+' minutes after I arrive'}</option>)}</select>
        <span className="mt-1 block text-xs font-normal text-slate-500">For food quality, choose 5–10 minutes after arrival. It is a preference until the restaurant confirms.</span></label>
       <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">Your name<input className={input+' mt-2'} value={contactName} maxLength={100} onChange={e=>setContactName(e.target.value)} required/></label>
        <label className="text-sm font-bold">Mobile number<input className={input+' mt-2'} type="tel" inputMode="tel" value={contactPhone} maxLength={16} placeholder="10-digit mobile number" onChange={e=>setContactPhone(e.target.value.replace(/[\s-]/g,''))} required/></label>
       </div>
       <label className="block text-sm font-bold">Dietary needs / allergies or seating notes (optional)
        <textarea className={input+' mt-2'} maxLength={500} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Tell staff about allergies; always reconfirm them with restaurant staff."/></label>
       <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">This submits a request only. Do not travel assuming a table is secured until the restaurant accepts. Serving times are estimates, not guarantees. No Zeshu payment is collected.</p>
       <button disabled={busy} className="min-h-12 w-full rounded-xl bg-[#075E45] px-5 py-3 text-sm font-black text-white disabled:opacity-50">
        {busy?'Requesting…':'Request table + chosen meal'}</button>
      </form>}
    {message&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{message}</p>}
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
   </section>
   <section className="mt-5 rounded-3xl border bg-white p-5 shadow-sm md:p-7">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">My dining requests</h2><p className="text-sm text-slate-500">Sign in to see your status and restaurant-confirmed arrival and kitchen timings.</p></div>
     <button onClick={()=>void refreshMine()} className="rounded-xl border p-3" aria-label="Refresh my dining requests"><RefreshCw size={18}/></button></div>
    {bookings.length===0?<p className="mt-4 text-sm text-slate-600">No dining requests found for this signed-in customer account.</p>:
      <div className="mt-4 space-y-3">{bookings.map(b=><article key={b.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
       <p className="font-black">{restaurants.find(r=>r.id===b.restaurant_id)?.name||'Restaurant booking'} · {b.status}</p>
       <p className="mt-1 text-sm text-slate-700">Guests {b.party_size} · Arrive {when(b.arrival_at)}</p>
       {b.status==='CONFIRMED'&&b.confirmed_serve_at?
        <p className="mt-1 text-sm font-bold text-emerald-800">Table confirmed · Estimated meal service {when(b.confirmed_serve_at)} · Kitchen: {b.kitchen_status.replaceAll('_',' ').toLowerCase()}</p>:
        <p className="mt-1 text-sm font-semibold text-amber-900">{b.status==='REQUESTED'?'Waiting for restaurant confirmation. Do not assume your table is booked.':'Restaurant booking is not currently active.'}</p>}
       {b.status==='CONFIRMED'&&b.preordered_items?.length>0&&<p className="mt-1 text-xs text-slate-500">Pay at restaurant: {rupees(b.estimated_total_paise)}. Food is prepared only when staff mark its kitchen stage.</p>}
       {['REQUESTED','CONFIRMED'].includes(b.status)&&new Date(b.arrival_at).getTime()>Date.now()&&
        <button type="button" disabled={busy} onClick={()=>void cancelBooking(b.id)} className="mt-3 rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-800">Cancel request</button>}
      </article>)}</div>}
   </section>
   <section id="join" className="mt-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm md:p-7">
    <div className="flex items-center gap-3"><Store className="text-[#075E45]"/><div><h2 className="text-2xl font-black">Restaurants: join Zeshu Dine</h2><p className="text-sm text-slate-600">Keep your tables, kitchen and menu under your control. No inventory purchase or guaranteed volume.</p></div></div>
    <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={applyPartner}>
     {([['restaurantName','Restaurant name'],['city','City'],['contactName','Owner or manager name'],['phone','Business contact number'],['fssaiNumber','14-digit FSSAI registration / licence number']] as const).map(([key,label])=>
      <label key={key} className="text-sm font-bold">{label}<input className={input+' mt-2'} value={partner[key]} maxLength={key==='fssaiNumber'?14:120}
       onChange={e=>setPartner(p=>({...p,[key]:e.target.value}))} required/></label>)}
     <label className="text-sm font-bold md:col-span-2">Additional details (optional)<textarea className={input+' mt-2'} rows={2} maxLength={500} value={partner.notes} onChange={e=>setPartner(p=>({...p,notes:e.target.value}))}/></label>
     <label className="flex items-start gap-2 text-xs leading-5 md:col-span-2"><input type="checkbox" checked={partner.consent} onChange={e=>setPartner(p=>({...p,consent:e.target.checked}))} required/>
      I confirm I represent this restaurant and agree to be contacted by Zeshu about onboarding. Restaurant details remain private until verified.</label>
     <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} value={partner.website} onChange={e=>setPartner(p=>({...p,website:e.target.value}))}/></label></div>
     <button disabled={partnerBusy} className="min-h-12 rounded-xl bg-[#075E45] px-5 py-3 text-sm font-black text-white disabled:opacity-50 md:col-span-2">{partnerBusy?'Submitting…':'Apply to join Zeshu Dine'}</button>
     {partnerMessage&&<p role="status" className="text-sm font-semibold text-emerald-900 md:col-span-2">{partnerMessage}</p>}
     {partnerError&&<p role="alert" className="text-sm font-semibold text-red-700 md:col-span-2">{partnerError}</p>}
    </form>
   </section>
   <footer className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-600"><ShieldCheck size={18} className="shrink-0 text-[#075E45]"/>Only independently checked restaurants can be listed. Menus and times require partner approval; allergies must be reconfirmed directly. Dining payments are not enabled on Zeshu.</footer>
  </div>
 </main>;
}
