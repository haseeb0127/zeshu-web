"use client";
import {useCallback,useEffect,useState} from 'react';
import Link from '@/app/components/DocumentLink';
import {adminSupabase} from '@/app/lib/browser-supabase';
import {CalendarClock,ChefHat,ShieldCheck,RefreshCw,Store} from 'lucide-react';

const supabase=adminSupabase();
type Restaurant={id:string;name:string;city:string;address:string;fssai_registration:string;fssai_verified:boolean;booking_enabled:boolean;preorder_enabled:boolean};
type Table={id:string;restaurant_id:string;label:string;seats:number;enabled:boolean};
type Dish={id:string;restaurant_id:string;name:string;price_paise:number;prep_minutes:number;available:boolean};
type Lead={id:string;restaurant_name:string;city:string;contact_name:string;contact_phone:string;fssai_registration:string;status:string;created_at:string};
type Booking={id:string;restaurant_id:string;contact_name:string;contact_phone:string;party_size:number;arrival_at:string;
 requested_serve_at:string;confirmed_serve_at:string|null;preordered_items:Array<{name:string;quantity:number}>;
 estimated_total_paise:number;status:string;kitchen_status:string;notes:string;created_at:string};
type Snapshot={restaurants:Restaurant[];tables:Table[];menus:Dish[];bookings:Booking[];leads:Lead[]};
const empty:Snapshot={restaurants:[],tables:[],menus:[],bookings:[],leads:[]};
const when=(iso:string)=>new Date(iso).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'});
const input='mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-emerald-600 focus:outline-none';
export default function AdminDine(){
 const [data,setData]=useState<Snapshot>(empty);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [restaurant,setRestaurant]=useState({name:'',city:'Jagtial',area:'',address:'',fssaiNumber:'',opensAt:'11:00',closesAt:'22:00'});
 const [table,setTable]=useState({restaurantId:'',label:'T1',seats:4});
 const [dish,setDish]=useState({restaurantId:'',name:'',category:'Meals',priceRupees:'',prepMinutes:25});
 const [reviewed,setReviewed]=useState<Record<string,boolean>>({});
 const [preorders,setPreorders]=useState<Record<string,boolean>>({});
 const [serveTimes,setServeTimes]=useState<Record<string,string>>({});
 const session=async()=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw Error('Sign in to Zeshu Admin first.');
  return session.access_token;
 };
 const reload=useCallback(async()=>{
  setLoading(true);
  try{
   const token=await session();
   const res=await fetch('/api/admin/dine',{cache:'no-store',headers:{Authorization:'Bearer '+token}});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(body.error||'Unable to load dining HQ.');
   setData(body as Snapshot);
   setError('');
  }catch(e){setError(e instanceof Error?e.message:'Dining HQ unavailable.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 async function send(method:'POST'|'PATCH',payload:object){
  setBusy(true);setNotice('');setError('');
  try{
   const token=await session();
   const res=await fetch('/api/admin/dine',{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(body.error||'Update was not saved.');
   setNotice(body.note||'Dining management updated.');
   await reload();
  }catch(e){setError(e instanceof Error?e.message:'Update failed.');}
  finally{setBusy(false);}
 }
 const venue=(id:string)=>data.restaurants.find(r=>r.id===id)?.name||'Restaurant';
 return <main className="min-h-screen bg-[#f3f8f5] text-slate-900"><div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
  <Link href="/admin/dashboard" className="text-sm font-bold text-[#075e45]">← Zeshu Admin</Link>
  <header className="rounded-3xl bg-[#075e45] p-6 text-white">
   <h1 className="flex items-center gap-2 text-2xl font-black"><CalendarClock/>Zeshu Dine HQ</h1>
   <p className="mt-2 text-sm leading-6 text-emerald-50">Approve actual restaurant seats, inspect pre-orders and confirm a kitchen serving estimate. Never approve unverified partners or guess meal readiness.</p>
   <button onClick={()=>void reload()} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold"><RefreshCw size={17}/>Refresh</button>
  </header>
  {notice&&<p role="status" className="rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900">{notice}</p>}
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
  {loading?<p>Loading private dining data…</p>:<>
   <section className="rounded-2xl border bg-white p-5">
    <h2 className="flex items-center gap-2 text-xl font-black"><Store size={22}/>Restaurant applications ({data.leads.length})</h2>
    {data.leads.length===0?<p className="mt-3 text-sm text-slate-600">No real restaurant applications yet. Invite FSSAI-registered restaurants in Jagtial.</p>:
     <div className="mt-3 grid gap-3 md:grid-cols-2">{data.leads.map(l=><div key={l.id} className="rounded-xl border p-4 text-sm">
      <p className="font-bold">{l.restaurant_name} · {l.city} · {l.status}</p>
      <p>{l.contact_name} · {l.contact_phone}</p><p>Declared FSSAI: {l.fssai_registration} (not independently verified)</p>
      <p className="text-xs text-slate-500">Received {when(l.created_at)}</p>
     </div>)}</div>}
   </section>
   <section className="rounded-2xl border bg-white p-5">
    <h2 className="text-xl font-black">Add an actual restaurant (starts private)</h2>
    <p className="mt-1 text-sm text-slate-600">Do not copy applications into live inventory until a human verifies FSSAI, address, table layout, menu and service hours.</p>
    <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={e=>{e.preventDefault();void send('POST',{action:'restaurant',...restaurant});}}>
     {([['name','Restaurant'],['city','City'],['area','Area'],['address','Complete address'],['fssaiNumber','14-digit FSSAI number']] as const).map(([k,label])=>
      <label key={k} className="text-sm font-bold">{label}<input className={input} value={restaurant[k]} onChange={e=>setRestaurant(x=>({...x,[k]:e.target.value}))} required={k!=='area'} maxLength={k==='fssaiNumber'?14:400}/></label>)}
     <label className="text-sm font-bold">Opening time<input className={input} type="time" value={restaurant.opensAt} onChange={e=>setRestaurant(x=>({...x,opensAt:e.target.value}))}/></label>
     <label className="text-sm font-bold">Closing time<input className={input} type="time" value={restaurant.closesAt} onChange={e=>setRestaurant(x=>({...x,closesAt:e.target.value}))}/></label>
     <button disabled={busy} className="rounded-xl bg-[#075e45] px-5 py-3 text-sm font-black text-white disabled:opacity-50">Save private restaurant</button>
    </form>
   </section>
   <section className="grid gap-4 md:grid-cols-2">
    <form onSubmit={e=>{e.preventDefault();void send('POST',{action:'table',...table});}} className="rounded-2xl border bg-white p-5">
     <h2 className="text-lg font-black">Add real table inventory</h2>
     <label className="mt-3 block text-sm font-bold">Restaurant<select className={input} value={table.restaurantId} onChange={e=>setTable(x=>({...x,restaurantId:e.target.value}))}>
      <option value="">Select a restaurant</option>{data.restaurants.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
     <label className="mt-3 block text-sm font-bold">Table label<input className={input} value={table.label} onChange={e=>setTable(x=>({...x,label:e.target.value}))}/></label>
     <label className="mt-3 block text-sm font-bold">Seats<input className={input} type="number" min="1" max="24" value={table.seats} onChange={e=>setTable(x=>({...x,seats:Number(e.target.value)}))}/></label>
     <button disabled={busy||!table.restaurantId} className="mt-4 rounded-xl bg-[#075e45] px-4 py-3 text-sm font-black text-white disabled:opacity-50">Add table</button>
    </form>
    <form onSubmit={e=>{e.preventDefault();void send('POST',{action:'menu',restaurantId:dish.restaurantId,name:dish.name,category:dish.category,
     pricePaise:Math.round(Number(dish.priceRupees)*100),prepMinutes:dish.prepMinutes});}} className="rounded-2xl border bg-white p-5">
     <h2 className="flex items-center gap-2 text-lg font-black"><ChefHat size={20}/>Add confirmed menu dish</h2>
     <label className="mt-3 block text-sm font-bold">Restaurant<select className={input} value={dish.restaurantId} onChange={e=>setDish(x=>({...x,restaurantId:e.target.value}))}>
      <option value="">Select a restaurant</option>{data.restaurants.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
     <label className="mt-3 block text-sm font-bold">Dish<input className={input} value={dish.name} onChange={e=>setDish(x=>({...x,name:e.target.value}))} required/></label>
     <label className="mt-3 block text-sm font-bold">Menu price (₹)<input className={input} type="number" min="1" step=".01" value={dish.priceRupees} onChange={e=>setDish(x=>({...x,priceRupees:e.target.value}))} required/></label>
     <label className="mt-3 block text-sm font-bold">Kitchen prep estimate (minutes)<input className={input} type="number" min="5" max="180" value={dish.prepMinutes} onChange={e=>setDish(x=>({...x,prepMinutes:Number(e.target.value)}))}/></label>
     <button disabled={busy||!dish.restaurantId} className="mt-4 rounded-xl bg-[#075e45] px-4 py-3 text-sm font-black text-white disabled:opacity-50">Add actual dish</button>
    </form>
   </section>
   <section className="grid gap-4 md:grid-cols-2">
    <div className="rounded-2xl border bg-white p-5">
      <h2 className="text-lg font-black">Live kitchen menu availability</h2>
      <p className="mt-1 text-xs text-slate-600">Remove unavailable dishes from new pre-orders. Do not silently cancel existing pre-orders.</p>
      <div className="mt-3 space-y-2">{data.menus.map(m=><div key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
        <div><p className="font-bold">{m.name}</p><p className="text-xs text-slate-500">{venue(m.restaurant_id)} · ₹{(m.price_paise/100).toFixed(2)} · {m.available?'Available':'Unavailable'}</p></div>
        <button type="button" disabled={busy} onClick={()=>void send('PATCH',{action:'menuAvailability',menuItemId:m.id,available:!m.available})}
          className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-[#075e45]">{m.available?'Mark sold out':'Make available'}</button>
      </div>)}</div>
    </div>
    <div className="rounded-2xl border bg-white p-5">
      <h2 className="text-lg font-black">Real table inventory</h2>
      <p className="mt-1 text-xs text-slate-600">Disable an out-of-service table without pretending existing reservations are cancelled.</p>
      <div className="mt-3 space-y-2">{data.tables.map(t=><div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
        <div><p className="font-bold">{t.label} · {t.seats} seats</p><p className="text-xs text-slate-500">{venue(t.restaurant_id)} · {t.enabled?'Enabled':'Disabled'}</p></div>
        <button type="button" disabled={busy} onClick={()=>void send('PATCH',{action:'tableAvailability',tableId:t.id,enabled:!t.enabled})}
          className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-[#075e45]">{t.enabled?'Disable':'Enable'}</button>
      </div>)}</div>
    </div>
   </section>
   <section className="rounded-2xl border bg-white p-5">
    <h2 className="flex items-center gap-2 text-xl font-black"><ShieldCheck size={21}/>Verified restaurant switches ({data.restaurants.length})</h2>
    <div className="mt-3 grid gap-3 md:grid-cols-2">{data.restaurants.map(r=><div key={r.id} className="rounded-xl border bg-slate-50 p-4 text-sm">
     <p className="font-black">{r.name} · {r.city}</p>
     <p>FSSAI: {r.fssai_registration} · Verified {r.fssai_verified?'YES':'NO'} · Bookings {r.booking_enabled?'ON':'OFF'}</p>
     <p className="text-xs text-slate-500">{data.tables.filter(t=>t.restaurant_id===r.id).length} tables · {data.menus.filter(m=>m.restaurant_id===r.id).length} menu items</p>
     {!r.booking_enabled?<>
      <label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={Boolean(reviewed[r.id])} onChange={e=>setReviewed(x=>({...x,[r.id]:e.target.checked}))}/>
       I independently reviewed its FSSAI licence/registration, premises and table inventory. Details are genuine.</label>
      <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(preorders[r.id])} onChange={e=>setPreorders(x=>({...x,[r.id]:e.target.checked}))}/> Enable meal pre-orders (only with verified menu and kitchen readiness)</label>
      <button type="button" disabled={busy||!reviewed[r.id]||data.tables.filter(t=>t.restaurant_id===r.id&&t.enabled).length===0}
       onClick={()=>void send('PATCH',{action:'activate',restaurantId:r.id,documentsChecked:true,preorderEnabled:preorders[r.id]===true})}
       className="mt-3 rounded-xl bg-[#075e45] px-4 py-2 font-bold text-white disabled:opacity-50">Activate after verification</button>
      </>:<button type="button" disabled={busy} onClick={()=>void send('PATCH',{action:'pause',restaurantId:r.id})}
        className="mt-3 rounded-xl border border-red-200 px-4 py-2 font-bold text-red-700">Pause new booking requests</button>}
    </div>)}</div>
   </section>
   <section className="rounded-2xl border bg-white p-5">
    <h2 className="text-xl font-black">Incoming table and food requests ({data.bookings.length})</h2>
    <p className="mt-1 text-sm text-slate-600">A customer cannot rely on a request until a real table and fresh-serving estimate are confirmed. This dashboard does not send WhatsApp messages.</p>
    {data.bookings.length===0?<p className="mt-4 text-sm text-slate-600">No dining requests have been submitted yet.</p>:
     <div className="mt-4 space-y-3">{data.bookings.map(b=><article key={b.id} className="rounded-2xl border bg-slate-50 p-4">
      <p className="font-black">{venue(b.restaurant_id)} · {b.status} · {b.kitchen_status}</p>
      <p className="mt-1 text-sm">{b.contact_name} · {b.contact_phone} · {b.party_size} guests</p>
      <p className="text-sm">Arrival {when(b.arrival_at)} · Requested serve {when(b.requested_serve_at)} · {b.confirmed_serve_at?'Confirmed serve '+when(b.confirmed_serve_at):'Not confirmed'}</p>
      <p className="mt-2 text-sm">{b.preordered_items?.length?b.preordered_items.map(d=>d.name+' ×'+d.quantity).join(', '):'Table only, no food pre-order'}</p>
      {b.notes&&<p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs">Customer notes/allergies: {b.notes} — reconfirm with kitchen</p>}
      {b.status==='REQUESTED'&&<div className="mt-3 flex flex-wrap items-end gap-2">
       <label className="text-xs font-bold">Estimated serve time (IST)
        <input className={input} type="datetime-local" value={serveTimes[b.id]??''}
         placeholder="Serve time" onChange={e=>setServeTimes(x=>({...x,[b.id]:e.target.value}))}/></label>
       <button type="button" disabled={busy} className="rounded-xl bg-[#075e45] px-4 py-3 text-sm font-black text-white"
        onClick={()=>{const selected=serveTimes[b.id];const serveAt=selected?new Date(selected).toISOString():b.requested_serve_at;
         void send('PATCH',{action:'confirm',bookingId:b.id,serveAt});}}>Confirm actual free table + kitchen time</button>
       <button type="button" disabled={busy} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-800"
        onClick={()=>void send('PATCH',{action:'decline',bookingId:b.id})}>Decline</button>
      </div>}
      {b.status==='CONFIRMED'&&<div className="mt-3 flex flex-wrap gap-2">
       {(b.kitchen_status==='NOT_STARTED'&&b.preordered_items?.length>0?['PREPARING']:
        b.kitchen_status==='PREPARING'?['READY']:b.kitchen_status==='READY'?['SERVED']:[]).map(s=>
        <button key={s} type="button" disabled={busy} className="rounded-xl bg-[#075e45] px-4 py-2 text-xs font-black text-white"
          onClick={()=>void send('PATCH',{action:'kitchen',bookingId:b.id,kitchenStatus:s})}>Mark {s.toLowerCase()}</button>)}
       <button type="button" disabled={busy} className="rounded-xl border px-4 py-2 text-xs font-bold"
        onClick={()=>void send('PATCH',{action:'complete',bookingId:b.id})}>Complete visit</button>
      </div>}
     </article>)}</div>}
   </section>
  </>}
  <Link href="/dine" className="inline-flex items-center gap-2 text-sm font-black text-[#075e45]">View customer dining page →</Link>
 </div></main>;
}
