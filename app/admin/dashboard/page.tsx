"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  BellRing, CheckCircle, Clock, LogOut, 
  ShoppingBag, MapPin, IndianRupee, Hash, Motorbike, Send
} from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// 🚨 ACTION REQUIRED: Paste your Rider's Supabase UID here!
const MY_RIDERS = [
  { name: 'Rider 1 (My Phone)', id: '7754e8bf-5aff-4b44-901b-fdd28f2113cf' }, 
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedRiders, setSelectedRiders] = useState<{[key: string]: string}>({});
  const router = useRouter();

  const fetchInitialOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialOrders();

    const channel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          const audio = new Audio('/alert.mp3');
          audio.play().catch(err => console.log("Audio blocked. Click the page first."));
          fetchInitialOrders(); 
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // 🚀 THE NEW DISPATCH FUNCTION
  const assignToRider = async (orderId: string) => {
    const riderId = selectedRiders[orderId];
    if (!riderId) return alert("Please select a rider from the dropdown first!");

    const { error } = await supabase
      .from('orders')
      .update({ status: 'OUT_FOR_DELIVERY', assigned_rider_id: riderId })
      .eq('id', orderId);

    if (error) alert("Failed to assign rider: " + error.message);
    // Realtime listener will automatically update the UI!
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Top Navigation */}
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-500/20">
            <BellRing size={24} className={orders.some(o => o.status === 'PENDING') ? "animate-bounce" : ""} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase">Zeshu HQ</h1>
            <p className="text-[10px] font-bold text-purple-400 tracking-[0.2em] uppercase leading-none">Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!audioEnabled && <button onClick={() => setAudioEnabled(true)} className="bg-amber-500 text-black text-[10px] font-black px-3 py-1.5 rounded-lg animate-pulse">CLICK TO ENABLE AUDIO</button>}
          <button onClick={() => { supabase.auth.signOut(); router.push('/admin/login'); }} className="bg-zinc-800 p-2.5 rounded-xl hover:bg-zinc-700 transition-all border border-zinc-700"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div><h2 className="text-3xl font-black tracking-tight">Live Operations</h2><p className="text-slate-500 font-medium">Monitoring and Dispatching</p></div>
          <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3"><div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></div><span className="text-xs font-black text-slate-600 uppercase tracking-widest">Socket Connected</span></div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><Hash size={14}/> Order</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><MapPin size={14}/> Address</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><ShoppingBag size={14}/> Items</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><IndianRupee size={14}/> Amount</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Action / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className={`transition-colors ${order.status === 'PENDING' ? 'bg-purple-50/30' : 'hover:bg-slate-50'}`}>
                    <td className="p-5"><span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{order.id.split('-')[0].toUpperCase()}</span></td>
                    <td className="p-5 text-sm font-bold text-slate-800 max-w-[200px]"><div className="truncate">{order.delivery_address}</div></td>
                    <td className="p-5"><div className="space-y-1">{order.items?.map((i: any, idx: number) => (<div key={idx} className="text-[11px] font-medium text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-lg inline-block mr-1">{i.qty}x {i.item.name}</div>))}</div></td>
                    <td className="p-5"><span className="text-xl font-black text-purple-600">₹{order.total_paid}</span></td>
                    
                    {/* 🚀 DYNAMIC ACTION COLUMN */}
                    <td className="p-5">
                      {order.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <select 
                            onChange={(e) => setSelectedRiders({...selectedRiders, [order.id]: e.target.value})}
                            className="bg-white border border-slate-200 text-xs font-bold p-2.5 rounded-xl outline-none focus:border-purple-500"
                          >
                            <option value="">Assign to...</option>
                            {MY_RIDERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          <button onClick={() => assignToRider(order.id)} className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl shadow-md transition-all active:scale-95">
                            <Send size={16} />
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-widest bg-orange-50 px-3 py-2 rounded-xl inline-flex border border-orange-100">
                          {/* Note: I couldn't use <Motorbike /> here since Lucide React doesn't have it, using MapPin as fallback if needed, but text is fine */}
                          <MapPin size={14} /> Out For Delivery
                        </div>
                      )}

                      {order.status === 'DELIVERED' && (
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-2 rounded-xl inline-flex border border-emerald-100">
                          <CheckCircle size={14} /> Delivered
                        </div>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}