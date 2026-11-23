"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {ChefHat,Clock3,Minus,Plus,ShieldCheck,UtensilsCrossed,ArrowLeft,RefreshCw} from "lucide-react";

type Dish={id:string;name:string;category:string;price_paise:number;prep_minutes:number};
type Venue={id:string;name:string;city:string;area:string};
type Table={id:string;label:string;seats:number};
type Menu={restaurant:Venue;table:Table;menu:Dish[];note:string};
const rupees=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);
export default function DineTablePage(){
 const [location,setLocation]=useState<{restaurant:string;table:string;key:string}|null>(null);
 const [menu,setMenu]=useState<Menu|null>(null);
 const [quantities,setQuantities]=useState<Record<string,number>>({});
 const [name,setName]=useState("");
 const [notes,setNotes]=useState("");
 const [loading,setLoading]=useState(true);
 const [sending,setSending]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState<{orderId:string;status:string;note:string}|null>(null);
 const requestKey=useRef("");
 const selected=useMemo(()=>menu?.menu.filter(x=>(quantities[x.id]||0)>0)||[],[menu,quantities]);
 const subtotal=selected.reduce((sum,d)=>sum+d.price_paise*(quantities[d.id]||0),0);
 const selectedQty=selected.reduce((sum,d)=>sum+(quantities[d.id]||0),0);
 const groups=useMemo(()=>[...new Set((menu?.menu||[]).map(x=>x.category))],[menu]);
 const refresh=async(loc:{restaurant:string;table:string;key:string})=>{
  setLoading(true);setError("");
  try{
   const qs=new URLSearchParams(loc);
   const response=await fetch("/api/dine/table?"+qs.toString(),{cache:"no-store"});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(body.error||"This restaurant menu is unavailable.");
   setMenu(body as Menu);
  }catch(e){setMenu(null);setError(e instanceof Error?e.message:"Unable to open this table.");}
  finally{setLoading(false);}
 };
 useEffect(()=>{
  const p=new URLSearchParams(window.location.search);
  const loc={restaurant:p.get("restaurant")||"",table:p.get("table")||"",key:p.get("key")||""};
  setLocation(loc);void refresh(loc);
 },[]);
 useEffect(()=>{
  if(!success?.orderId||!requestKey.current)return;
  const poll=async()=>{
   try{
    const url="/api/dine/table/order?"+new URLSearchParams({order:success.orderId,key:requestKey.current}).toString();
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)return;
    const body=await response.json();
    if(typeof body.status==="string")setSuccess(prev=>prev?{...prev,status:body.status}:prev);
   }catch{/* Keep the receipt visible even when temporary network access fails. */}
  };
  const timer=window.setInterval(()=>void poll(),12_000);
  return ()=>window.clearInterval(timer);
 },[success?.orderId]);
 function setQuantity(id:string,change:number){
  setQuantities(q=>({...q,[id]:Math.max(0,Math.min(10,(q[id]||0)+change))}));
  requestKey.current="";
 }
 async function submit(){
  if(!location||!menu||!selected.length||sending||success)return;
  if(!requestKey.current)requestKey.current=crypto.randomUUID();
  setSending(true);setError("");
  try{
   const response=await fetch("/api/dine/table",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({restaurantId:location.restaurant,tableId:location.table,key:location.key,
     idempotencyKey:requestKey.current,source:"TABLE_QR",name,notes,
     items:selected.map(d=>({id:d.id,quantity:quantities[d.id]}))})});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(body.error||"We could not send the request.");
   setSuccess(body);
  }catch(e){setError(e instanceof Error?e.message:"Request unavailable. Please ask staff.");}
  finally{setSending(false);}
 }
 return <main className="zeshu-experience min-h-screen bg-[#f6f8f3] text-slate-900">
  <div className="mx-auto max-w-3xl px-4 pb-32 pt-6">
   <Link href="/dine" className="inline-flex items-center gap-2 text-sm font-bold text-[#075e45]"><ArrowLeft size={16}/> Zeshu Dine</Link>
   <header className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#094c37] via-[#075e45] to-[#138053] p-6 text-white shadow-lg">
    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-100"><UtensilsCrossed size={16}/> Dine at your table</p>
    <h1 className="mt-2 text-3xl font-black">{menu?.restaurant.name||"Scan to order"}</h1>
    <p className="mt-2 text-sm text-emerald-100">{menu?menu.restaurant.city+" · "+menu.restaurant.area:"Table ordering by Zeshu.in"}</p>
    {menu&&<span className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-black text-[#075e45]">Table {menu.table.label}</span>}
   </header>
   <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-900">
    <ShieldCheck size={16} className="mr-2 inline"/> Your request goes to restaurant staff first. Food starts only after approval. Pay at the restaurant; no online payment is taken.
   </div>
   {loading&&<div className="mt-8 text-center text-sm text-slate-600">Loading the verified restaurant menu…</div>}
   {error&&<p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
   {menu&&success?
    <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm" role="status">
      <ChefHat size={42} className="mx-auto text-[#075e45]"/>
      <h2 className="mt-4 text-2xl font-black">Request sent to the counter</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{success.status==="PENDING_APPROVAL"?"Waiting for restaurant staff to approve your order. Cooking has not started.":success.status==="REJECTED"?"The restaurant could not accept your request. Please speak to staff.":success.status==="ACCEPTED"?"Staff accepted your order; the kitchen has not marked it preparing yet.":success.status==="PREPARING"?"The kitchen has started preparing your order.":success.status==="READY"?"Your food has been marked ready. Please check with restaurant staff.":success.status==="SERVED"?"Your order was marked served. Thank you!":"Please check with restaurant staff."}</p>
      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold">Reference: {success.orderId.slice(0,8).toUpperCase()}</p>
      <p className="mt-4 font-black">Items subtotal: {rupees(subtotal)}</p>
      <p className="mt-2 text-xs text-slate-500">Taxes, discounts and final restaurant bill are determined at the counter. No online charge was taken.</p>
    </section>:
    menu&&<>
     <div className="mt-6 flex items-center justify-between gap-3">
      <h2 className="text-2xl font-black">Menu</h2>
      <button type="button" onClick={()=>location&&void refresh(location)} className="inline-flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-xs font-bold"><RefreshCw size={14}/> Refresh stock</button>
     </div>
     {menu.menu.length===0?<p className="mt-4 rounded-xl bg-white p-6 text-sm text-slate-600">The restaurant is updating its menu. Ask a staff member to help you order.</p>:
     groups.map(group=><section key={group} className="mt-5">
      <h3 className="mb-3 text-lg font-black">{group}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
       {menu.menu.filter(d=>d.category===group).map(d=><div key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-0">
         <p className="font-bold">{d.name}</p><p className="mt-1 text-sm font-black text-[#075e45]">{rupees(d.price_paise)}</p>
         <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 size={12}/> Prep estimate: {d.prep_minutes} min</p>
        </div>
        <div className="flex shrink-0 items-center gap-2" aria-label={"Quantity for "+d.name}>
         <button type="button" aria-label={"Remove "+d.name} onClick={()=>setQuantity(d.id,-1)} disabled={!quantities[d.id]} className="rounded-full border p-2 disabled:opacity-30"><Minus size={15}/></button>
         <span className="w-5 text-center text-sm font-black">{quantities[d.id]||0}</span>
         <button type="button" aria-label={"Add "+d.name} onClick={()=>setQuantity(d.id,1)} disabled={(quantities[d.id]||0)>=10} className="rounded-full bg-[#075e45] p-2 text-white disabled:opacity-40"><Plus size={15}/></button>
        </div>
       </div>)}
      </div>
     </section>)}
     <section className="mt-6 space-y-3 rounded-2xl border bg-white p-5">
      <h3 className="font-black">Order notes (optional)</h3>
      <label className="block text-sm font-semibold">Name or table nickname
       <input value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="e.g. Family at Table 5" className="mt-2 w-full rounded-xl border p-3"/>
      </label>
      <label className="block text-sm font-semibold">Instructions for staff
       <textarea value={notes} maxLength={350} rows={2} onChange={e=>setNotes(e.target.value)} placeholder="e.g. less spicy" className="mt-2 w-full rounded-xl border p-3"/>
      </label>
     </section>
    </>}
  </div>
  {menu&&!success&&<div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 p-4 shadow-xl backdrop-blur">
   <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
    <div><p className="text-xs text-slate-500">{selectedQty} item(s) · subtotal</p><p className="text-xl font-black">{rupees(subtotal)}</p><p className="text-[10px] text-slate-500">Pay at restaurant</p></div>
    <button onClick={()=>void submit()} disabled={!selected.length||sending} className="rounded-xl bg-[#075e45] px-5 py-4 text-sm font-black text-white disabled:opacity-40">{sending?"Sending…":"Request order"}</button>
   </div>
  </div>}
 </main>;
}
