"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  BellRing, CheckCircle, Clock, LogOut, 
  ShoppingBag, MapPin, IndianRupee, Hash 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const router = useRouter();

  const fetchInitialOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }
      // Security Check: Only allow our specific admin email
      if (session.user.email !== "admin@zeshu.in") {
        await supabase.auth.signOut();
        router.push('/admin/login');
      }
    };

    checkAdmin();
    fetchInitialOrders();

    // 📡 AGGRESSIVE REAL-TIME LISTENER
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          console.log('Change detected in Database:', payload);
          
          // 🔔 Trigger Sound
          const audio = new Audio('/alert.mp3');
          audio.play().catch(err => {
            console.log("Audio blocked. Dashboard needs a user click to enable sound.");
          });
          
          // 🔄 Refresh the UI instantly
          fetchInitialOrders(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const markAsDelivered = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'DELIVERED' })
      .eq('id', orderId);

    if (error) alert("Update failed: " + error.message);
    // Real-time listener will handle the UI update automatically!
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
          {!audioEnabled && (
            <button 
              onClick={() => setAudioEnabled(true)} 
              className="bg-amber-500 text-black text-[10px] font-black px-3 py-1.5 rounded-lg animate-pulse"
            >
              CLICK TO ENABLE AUDIO
            </button>
          )}
          <button onClick={handleLogout} className="bg-zinc-800 p-2.5 rounded-xl hover:bg-zinc-700 transition-all border border-zinc-700">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Connection Status Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Live Operations</h2>
            <p className="text-slate-500 font-medium">Monitoring real-time grocery orders</p>
          </div>
          
          <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Socket Connected</span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><Hash size={14}/> Order</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><Clock size={14}/> Time</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><MapPin size={14}/> Address</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><ShoppingBag size={14}/> Items</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><div className="flex items-center gap-2"><IndianRupee size={14}/> Amount</div></th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className={`transition-colors ${order.status === 'PENDING' ? 'bg-purple-50/30' : 'hover:bg-slate-50'}`}>
                    <td className="p-5">
                      <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                        {order.id.split('-')[0].toUpperCase()}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-700">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-800 max-w-[220px]">
                      <div className="truncate">{order.delivery_address}</div>
                    </td>
                    <td className="p-5">
                      <div className="space-y-1">
                        {order.items?.map((i: any, idx: number) => (
                          <div key={idx} className="text-[11px] font-medium text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-lg inline-block mr-1">
                            {i.qty}x {i.item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-xl font-black text-purple-600">₹{order.total_paid}</span>
                    </td>
                    <td className="p-5">
                      {order.status === 'PENDING' ? (
                        <button 
                          onClick={() => markAsDelivered(order.id)} 
                          className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-green-200 transition-all active:scale-95"
                        >
                          <CheckCircle size={14} /> Mark Delivered
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                          <CheckCircle size={16} /> Delivered
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ShoppingBag size={48} className="text-slate-200" />
                        <p className="text-slate-400 font-bold">Waiting for your first Zeshu order...</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}