"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {customerSupabase} from "@/app/lib/browser-supabase";
import {qrcodegen} from "@/app/lib/dine-qr-code";
import {ChefHat,Printer,RefreshCw,ShieldCheck,Volume2} from "lucide-react";

type Venue={id:string;name:string;role:string;qr_order_enabled:boolean};
type Table={id:string;label:string;seats:number;enabled:boolean;qr_token:string};
type Dish={id:string;name:string;price_paise:number;available:boolean};
type Item={id:string;name:string;quantity:number;unit_price_paise:number};
type Order={id:string;table_id:string;source:string;customer_label:string;notes:string;items:Item[];subtotal_paise:number;status:string;created_at:string};
type Booking={id:string;table_id:string|null;contact_name:string;party_size:number;arrival_at:string;requested_serve_at:string;confirmed_serve_at:string|null;prep_start_at:string|null;status:string;kitchen_status:string;preordered_items:{name:string;quantity:number}[];estimated_total_paise:number};
type Snapshot={restaurants:Venue[];restaurant:Venue|null;tables:Table[];menu:Dish[];orders:Order[];bookings:Booking[]};
const empty:Snapshot={restaurants:[],restaurant:null,tables:[],menu:[],orders:[],bookings:[]};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n/100);
const when=(v:string|null)=>v?new Date(v).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}):"Not assigned";
function Qr({url}:{url:string}){
 const qr=useMemo(()=>{
  try{const q=qrcodegen.QrCode.encodeText(url,qrcodegen.QrCode.Ecc.MEDIUM);const bits:string[]=[];
   for(let y=0;y<q.size;y++)for(let x=0;x<q.size;x++)if(q.getModule(x,y))bits.push("M"+(x+4)+","+(y+4)+"h1v1h-1z");
   return {size:q.size+8,path:bits.join("")};
  }catch{return null;}
 },[url]);
 return qr?<svg viewBox={"0 0 "+qr.size+" "+qr.size} role="img" aria-label="Zeshu table QR code" className="mx-auto aspect-square w-full max-w-64 bg-white">
  <rect width={qr.size} height={qr.size} fill="#fff"/><path d={qr.path} fill="#052e24"/>
 </svg>:<p>Unable to create QR code</p>;
}
export default function DineKitchen(){
 const [data,setData]=useState<Snapshot>(empty),[venue,setVenue]=useState("");
 const [userId,setUserId]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [tab,setTab]=useState<"orders"|"bookings"|"delivery"|"standees"|"staff">("orders");
 const [alerts,setAlerts]=useState(false),[print,setPrint]=useState<{kind:"table"|"kot";id:string}|null>(null);
 const [staffTable,setStaffTable]=useState(""),[counts,setCounts]=useState<Record<string,number>>({});
 const [notes,setNotes]=useState(""),[guest,setGuest]=useState(""),[serve,setServe]=useState<Record<string,string>>({});
 const seen=useRef<Set<string>|null>(null);
 const sound=useRef<AudioContext|null>(null);
 const selected=data.restaurant;
 const tableMap=useMemo(()=>new Map(data.tables.map(t=>[t.id,t])),[data.tables]);
 const chosen=data.menu.filter(d=>d.available&&(counts[d.id]||0)>0);
 const subtotal=chosen.reduce((sum,d)=>sum+d.price_paise*(counts[d.id]||0),0);
 const canKitchen=["OWNER","MANAGER","KITCHEN"].includes(selected?.role||"");
 const canBookings=["OWNER","MANAGER","WAITER"].includes(selected?.role||"");
 const token=async()=>{
  const {data:{session}}=await customerSupabase().auth.getSession();
  if(!session?.access_token)throw Error("Sign in with your Zeshu mobile OTP first.");
  setUserId(session.user.id);return session.access_token;
 };
 const bell=useCallback(()=>{if(!sound.current)return;const a=sound.current;const o=a.createOscillator(),g=a.createGain();
  o.frequency.value=740;g.gain.value=0.12;o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+0.3);},[]);
 const load=useCallback(async(target:string,quiet=false)=>{
  if(!quiet)setLoading(true);
  try{
   const access=await token(),query=target?"?restaurant="+encodeURIComponent(target):"";
   const res=await fetch("/api/dine/staff"+query,{headers:{Authorization:"Bearer "+access},cache:"no-store"});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(body.error||"Restaurant workspace unavailable.");
   const snapshot=body as Snapshot;
   setData(snapshot);if(snapshot.restaurant)setVenue(snapshot.restaurant.id);
   const pending=new Set(snapshot.orders.filter(o=>o.status==="PENDING_APPROVAL").map(o=>o.id));
   if(alerts&&seen.current&&[...pending].some(k=>!seen.current?.has(k)))bell();
   seen.current=pending;if(!quiet)setError("");
  }catch(e){setError(e instanceof Error?e.message:"Connection unavailable.");}
  finally{if(!quiet)setLoading(false);}
 },[alerts,bell]);
 useEffect(()=>{void load("");},[]);
 useEffect(()=>{if(!venue)return;const t=window.setInterval(()=>void load(venue,true),10_000);return()=>window.clearInterval(t);},[venue,load]);
 async function update(payload:Record<string,unknown>){
  if(!venue||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const access=await token();
   const res=await fetch("/api/dine/staff",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+access},
    body:JSON.stringify({restaurantId:venue,...payload})});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(body.error||"Update failed.");
   setNotice(body.note||"Saved");await load(venue,true);
  }catch(e){setError(e instanceof Error?e.message:"Update failed.");}
  finally{setBusy(false);}
 }
 async function staffOrder(){
  if(!staffTable||!chosen.length)return;setBusy(true);setNotice("");setError("");
  try{
   const access=await token();
   const r=await fetch("/api/dine/table",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+access},
    body:JSON.stringify({restaurantId:venue,tableId:staffTable,source:"STAFF_TABLE",
     idempotencyKey:crypto.randomUUID(),name:guest,notes,items:chosen.map(d=>({id:d.id,quantity:counts[d.id]}))})});
   const b=await r.json().catch(()=>({}));if(!r.ok)throw Error(b.error||"Could not enter staff order.");
   setNotice("Staff order sent to the kitchen; no payment was collected.");setCounts({});setNotes("");setGuest("");await load(venue,true);
  }catch(e){setError(e instanceof Error?e.message:"Staff order failed.");}finally{setBusy(false);}
 }
 const qrUrl=(t:Table)=>"https://zeshu.in/dine/table?"+new URLSearchParams({restaurant:venue,table:t.id,key:t.qr_token}).toString();
 const printTable=data.tables.find(t=>t.id===print?.id),printOrder=data.orders.find(o=>o.id===print?.id);
 function printNow(kind:"table"|"kot",id:string){setPrint({kind,id});window.setTimeout(()=>window.print(),200);}
 async function enableSound(){
  try{sound.current??=new window.AudioContext();await sound.current.resume();setAlerts(true);bell();}
  catch{setError("Allow sound in your browser settings. Visible new-order counts still work.");}
 }
 const pending=data.orders.filter(o=>o.status==="PENDING_APPROVAL").length;
 const active=data.orders.filter(o=>["PENDING_APPROVAL","ACCEPTED","PREPARING","READY"].includes(o.status));
 return <main className="min-h-screen bg-[#f2f7f3] px-4 py-6 text-slate-900">
  <style>{"@media print{body *{visibility:hidden!important}.dine-print,.dine-print *{visibility:visible!important}.dine-print{display:block!important;position:absolute;top:0;left:0;width:100%;padding:12mm;background:white;color:black}.dine-print svg{max-width:70mm}@page{margin:5mm}}"}</style>
  <div className="mx-auto max-w-6xl">
   <Link href="/dine" className="text-sm font-black text-emerald-800">← Zeshu Dine</Link>
   <header className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-[#083e2e] p-6 text-white">
    <div><p className="text-xs uppercase tracking-widest text-emerald-200">Zeshu Dine · Lite POS pilot</p>
     <h1 className="mt-2 text-2xl font-black">{selected?.name||"Restaurant Kitchen"}</h1>
     <p className="mt-1 text-sm text-emerald-100">Table QR · KOT · Pre-booked tables · Waiter mode</p></div>
    <div className="flex gap-2">
     <button onClick={()=>void enableSound()} disabled={alerts} className="rounded-xl border border-white/30 px-3 py-2 text-sm font-bold disabled:opacity-60"><Volume2 size={16} className="mr-1 inline"/>{alerts?"Alerts on":"Enable alerts"}</button>
     <button onClick={()=>void load(venue)} className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-900"><RefreshCw size={15} className="mr-1 inline"/>Refresh</button>
    </div>
   </header>
   {userId&&<p className="mt-3 text-xs text-slate-500">Your Zeshu user ID (share privately with Zeshu admin for restaurant onboarding): <code>{userId}</code></p>}
   {error&&<p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error} {!userId&&<Link href="/" className="underline">Sign in →</Link>}</p>}
   {notice&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{notice}</p>}
   {loading&&<p className="mt-5 text-sm">Loading approved restaurant…</p>}
   {!loading&&!selected&&<div className="mt-5 rounded-2xl bg-white p-6">
    <h2 className="text-xl font-black">Not assigned to a restaurant yet</h2>
    <p className="mt-2 text-sm text-slate-600">Sign in using the normal Zeshu OTP, then ask Zeshu admin to assign your account to an FSSAI-verified restaurant. Guest customers cannot enter the kitchen board.</p>
    <Link href="/" className="mt-4 inline-block rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Open Zeshu login</Link>
   </div>}
   {selected&&<>
    {data.restaurants.length>1&&<select value={venue} onChange={e=>{setVenue(e.target.value);seen.current=null;void load(e.target.value);}} className="mt-4 rounded-xl border bg-white p-3">{data.restaurants.map(r=><option key={r.id} value={r.id}>{r.name} · {r.role}</option>)}</select>}
    {!selected.qr_order_enabled&&<p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"><ShieldCheck size={16} className="mr-2 inline"/> QR orders are not active. Zeshu must approve the pilot, verified kitchen staff, real tables and menu first.</p>}
    <nav aria-label="Restaurant kitchen sections" className="mt-4 flex flex-wrap gap-2">
     {([["orders","Table orders"],["bookings","Pre-bookings"],["delivery","Delivery"],["standees","Print QR"],["staff","Waiter & stock"]] as const).map(([k,label])=>
      <button key={k} onClick={()=>setTab(k)} className={"rounded-xl px-4 py-3 text-xs font-black "+(tab===k?"bg-emerald-800 text-white":"border bg-white")}>
       {label}{k==="orders"&&pending>0?" · "+pending+" NEW":""}
      </button>)}
    </nav>
    {tab==="orders"&&<section className="mt-5 space-y-3">
     <h2 className="text-xl font-black">Live table orders</h2><p className="text-xs text-slate-500">Refreshes every 10 seconds. Public QR requests must be approved before entering kitchen preparation.</p>
     {active.length===0?<p className="rounded-2xl bg-white p-6 text-sm text-slate-600">No active orders. Kitchen tickets appear only after valid restaurant orders.</p>:
      active.map(o=><article key={o.id} className="rounded-2xl border bg-white p-5">
       <div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-black">Table {tableMap.get(o.table_id)?.label||"?"} · {o.source==="TABLE_QR"?"QR request":"Waiter order"}</h3>
        <span className={"rounded-full px-3 py-2 text-xs font-black "+(o.status==="PENDING_APPROVAL"?"bg-amber-100 text-amber-900":"bg-emerald-100 text-emerald-900")}>{o.status.replaceAll("_"," ")}</span></div>
       <p className="mt-1 text-xs text-slate-500">{when(o.created_at)} · #{o.id.slice(0,8).toUpperCase()} {o.customer_label?"· "+o.customer_label:""}</p>
       <div className="mt-3 space-y-1 text-sm">{o.items.map(i=><p key={i.id}>{i.quantity} × {i.name}</p>)}</div>
       {o.notes&&<p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">Kitchen note: {o.notes}</p>}
       <p className="mt-3 font-bold">Items subtotal: {money(o.subtotal_paise)} <span className="text-xs font-normal text-slate-500">(not paid; not tax invoice)</span></p>
       <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        {o.status==="PENDING_APPROVAL"&&<>
         <button disabled={busy} onClick={()=>void update({action:"orderStatus",orderId:o.id,status:"REJECTED"})} className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-800">Reject</button>
         <button disabled={busy} onClick={()=>void update({action:"orderStatus",orderId:o.id,status:"ACCEPTED"})} className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white">Accept request</button>
        </>}
        {o.status==="ACCEPTED"&&<>
         <button onClick={()=>printNow("kot",o.id)} className="rounded-lg border px-4 py-2 text-xs font-bold"><Printer size={14} className="mr-1 inline"/>Print KOT</button>
         <button disabled={busy||selected.role==="WAITER"} onClick={()=>void update({action:"orderStatus",orderId:o.id,status:"PREPARING"})} className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Start cooking</button>
        </>}
        {o.status==="PREPARING"&&<button disabled={busy} onClick={()=>void update({action:"orderStatus",orderId:o.id,status:"READY"})} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Ready</button>}
        {o.status==="READY"&&<button disabled={busy} onClick={()=>void update({action:"orderStatus",orderId:o.id,status:"SERVED"})} className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white">Served</button>}
       </div>
      </article>)}
    </section>}
    {tab==="bookings"&&<section className="mt-5 space-y-3">
     <h2 className="text-xl font-black">Table & food pre-bookings</h2>
     {data.bookings.length===0?<p className="rounded-xl bg-white p-5 text-sm">No active restaurant booking requests.</p>:
      data.bookings.map(b=><article key={b.id} className="rounded-2xl border bg-white p-5">
       <h3 className="font-black">{b.contact_name} · {b.party_size} guests · {b.status}</h3>
       <p className="mt-2 text-sm">Arrival: {when(b.arrival_at)} · Estimated serving: {when(b.confirmed_serve_at||b.requested_serve_at)}</p>
       {b.preordered_items.map((x,i)=><p className="mt-1 text-sm" key={i}>{x.quantity} × {x.name}</p>)}
       {b.status==="REQUESTED"&&canBookings&&<div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold">Estimated serving (local)<input type="datetime-local" value={serve[b.id]||""} onChange={e=>setServe(s=>({...s,[b.id]:e.target.value}))} className="mt-1 block rounded-lg border p-2"/></label>
        <button disabled={busy||!serve[b.id]} onClick={()=>void update({action:"confirmBooking",bookingId:b.id,serveAt:new Date(serve[b.id]).toISOString()})} className="rounded-lg bg-emerald-800 px-4 py-3 text-xs font-bold text-white disabled:opacity-40">Confirm actual table</button>
        <button disabled={busy} onClick={()=>void update({action:"declineBooking",bookingId:b.id})} className="rounded-lg border px-4 py-3 text-xs font-bold">Decline</button>
       </div>}
       {b.status==="CONFIRMED"&&b.preordered_items.length>0&&<div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold">Kitchen {b.kitchen_status} · planned prep around {when(b.prep_start_at)}</p>
        {canKitchen&&b.kitchen_status==="NOT_STARTED"&&<button disabled={busy} onClick={()=>void update({action:"bookingKitchen",bookingId:b.id,status:"PREPARING"})} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white">Preparing</button>}
        {canKitchen&&b.kitchen_status==="PREPARING"&&<button disabled={busy} onClick={()=>void update({action:"bookingKitchen",bookingId:b.id,status:"READY"})} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Ready</button>}
        {canKitchen&&b.kitchen_status==="READY"&&<button disabled={busy} onClick={()=>void update({action:"bookingKitchen",bookingId:b.id,status:"SERVED"})} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white">Served</button>}
       </div>}
      </article>)}
    </section>}
    {tab==="delivery"&&<section className="mt-5 rounded-2xl border bg-white p-6">
     <h2 className="text-xl font-black">Delivery is held pending partner readiness</h2>
     <p className="mt-3 text-sm text-slate-600">The future Delivery board will use the same menu and kitchen statuses. No driver is assigned and no delivery order is accepted until Zeshu verifies food compliance, delivery partners, payments, charges and service coverage.</p>
    </section>}
    {tab==="standees"&&<section className="mt-5">
     <h2 className="text-xl font-black">Restaurant table QR standees</h2>
     <p className="mt-2 text-sm text-slate-600">QRs are generated locally with no third-party image API. Use Print / Save as PDF after Zeshu approves your table-order pilot.</p>
     <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.tables.map(t=><article key={t.id} className="rounded-2xl border bg-white p-5 text-center">
      <h3 className="text-xl font-black">Table {t.label}</h3><p className="text-xs text-slate-500">{t.seats} seats · {t.enabled?"Active":"Paused"}</p>
      <div className="mx-auto mt-4 max-w-44"><Qr url={qrUrl(t)}/></div><p className="mt-2 text-xs font-bold">Scan to order · ZESHU.IN</p>
      <div className="mt-3 flex justify-center gap-2">
       <button disabled={!t.enabled||!selected.qr_order_enabled} onClick={()=>printNow("table",t.id)} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><Printer size={14} className="mr-1 inline"/>Print/PDF</button>
       <a href={qrUrl(t)} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-3 py-2 text-xs font-bold">Preview</a>
      </div>
      {["OWNER","MANAGER"].includes(selected.role)&&<button disabled={busy} onClick={()=>void update({action:"tableAvailability",tableId:t.id,enabled:!t.enabled})} className="mt-3 text-xs font-bold underline">{t.enabled?"Pause table":"Enable table"}</button>}
     </article>)}</div>
    </section>}
    {tab==="staff"&&<section className="mt-5 grid gap-4 lg:grid-cols-2">
     <div className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Quick stock toggles</h2>
      {data.menu.map(d=><div key={d.id} className="flex items-center justify-between gap-2 border-b py-3">
       <div><p className="text-sm font-bold">{d.name}</p><p className="text-xs">{money(d.price_paise)}</p></div>
       <button disabled={!canKitchen||busy} onClick={()=>void update({action:"menuAvailability",menuItemId:d.id,available:!d.available})} className={"rounded-full px-3 py-2 text-xs font-black disabled:opacity-40 "+(d.available?"bg-emerald-100 text-emerald-900":"bg-red-100 text-red-800")}>{d.available?"Available":"Sold out"}</button>
      </div>)}
     </div>
     <div className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Waiter-assisted order</h2><p className="mt-1 text-xs text-slate-600">For guests who prefer a waiter. This uses the real menu and staff account.</p>
      <select value={staffTable} onChange={e=>setStaffTable(e.target.value)} className="mt-3 w-full rounded-xl border p-3"><option value="">Choose actual table</option>{data.tables.filter(t=>t.enabled).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select>
      <div className="mt-3 max-h-64 space-y-2 overflow-auto">{data.menu.filter(d=>d.available).map(d=><div key={d.id} className="flex items-center gap-2 text-sm"><p className="flex-1">{d.name} · {money(d.price_paise)}</p>
       <button className="rounded border px-3 py-1" onClick={()=>setCounts(c=>({...c,[d.id]:Math.max(0,(c[d.id]||0)-1)}))}>−</button><span>{counts[d.id]||0}</span>
       <button className="rounded border px-3 py-1" onClick={()=>setCounts(c=>({...c,[d.id]:Math.min(10,(c[d.id]||0)+1)}))}>+</button>
      </div>)}</div>
      <input value={guest} maxLength={80} onChange={e=>setGuest(e.target.value)} placeholder="Guest nickname (optional)" className="mt-3 w-full rounded-xl border p-3 text-sm"/>
      <textarea value={notes} maxLength={350} onChange={e=>setNotes(e.target.value)} placeholder="Kitchen notes (optional)" className="mt-3 w-full rounded-xl border p-3 text-sm"/>
      <p className="mt-3 font-black">Subtotal {money(subtotal)}</p>
      <button disabled={busy||!selected.qr_order_enabled||!staffTable||!chosen.length} onClick={()=>void staffOrder()} className="mt-3 w-full rounded-xl bg-emerald-800 p-3 text-sm font-bold text-white disabled:opacity-40">Send verified staff order</button>
     </div>
    </section>}
   </>}
  </div>
  <div className="dine-print hidden" aria-hidden="true">
   {print?.kind==="table"&&printTable&&<div className="text-center">
    <h1 className="text-4xl font-black">ZESHU DINE</h1><h2 className="mt-4 text-2xl font-bold">{selected?.name}</h2>
    <h3 className="mt-5 text-4xl font-black">Table {printTable.label}</h3>
    <div className="mx-auto mt-6 max-w-64"><Qr url={qrUrl(printTable)}/></div>
    <p className="mt-4 text-xl font-black">Scan to request your order</p>
    <p>Restaurant staff approve requests. Pay at counter.</p>
    <p className="mt-8 text-2xl font-black">Need it? Zeshu it. · ZESHU.IN</p>
   </div>}
   {print?.kind==="kot"&&printOrder&&<div><h1 className="text-2xl font-black">KITCHEN ORDER TICKET</h1>
    <p className="mt-2">{selected?.name} · Zeshu Dine</p>
    <h2 className="mt-4 text-3xl font-black">TABLE {tableMap.get(printOrder.table_id)?.label}</h2>
    <p>{when(printOrder.created_at)} · #{printOrder.id.slice(0,8).toUpperCase()}</p><hr className="my-4"/>
    {printOrder.items.map(i=><p key={i.id} className="mt-2 text-xl font-bold">{i.quantity} × {i.name}</p>)}
    {printOrder.notes&&<p className="mt-3">NOTE: {printOrder.notes}</p>}<hr className="my-4"/>
    <p>Subtotal {money(printOrder.subtotal_paise)}</p>
    <p className="mt-4 text-sm">Kitchen-use ticket only. NOT a GST invoice or payment receipt.</p>
   </div>}
  </div>
 </main>;
}
