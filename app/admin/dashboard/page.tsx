"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { BellRing, CheckCircle, Clock, Search, LogOut } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchInitialOrders();

    // 📡 THE WEBSOCKET LISTENER (Real-time updates)
    const channel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        console.log('NEW ORDER RECEIVED!', payload.new);
        
        // 🔔 Play a notification sound
        const audio = new Audio('/alert.mp3'); // Add an alert.mp3 file to your /public folder!
        audio.play().catch(e => console.log("Audio play blocked by browser interaction rules"));
        
        // Add the new order to the top of the list instantly
        setOrders(current => [payload.new, ...current]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push('/admin/login');
  };

  const fetchInitialOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Fetch latest 50 orders
    
    if (data) setOrders(data);
    setLoading(false);
  };

  const markAsDelivered = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({ status: 'DELIVERED' }).eq('id', orderId);
    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o));
    } else {
      alert("Failed to update status");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Admin Navbar */}
      <header className="bg-black text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg"><BellRing size={20} className="animate-pulse" /></div>
          <h1 className="font-black text-xl tracking-widest uppercase">Zeshu HQ</h1>
        </div>
        <button onClick={handleLogout} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition"><LogOut size={20} /></button>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">Live Operations</h2>
          <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Socket Connected</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Time</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Address</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Items</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-gray-500">#{order.id.split('-')[0]}</td>
                    <td className="p-4 text-sm font-bold text-gray-700">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-4 text-sm font-bold max-w-[200px] truncate">{order.delivery_address}</td>
                    <td className="p-4 text-xs text-gray-600">
                      {order.items?.map((i: any, idx: number) => <div key={idx}>{i.qty}x {i.item.name}</div>)}
                    </td>
                    <td className="p-4 font-black text-lg text-purple-600">₹{order.total_paid}</td>
                    <td className="p-4">
                      {order.status === 'PENDING' ? (
                        <button onClick={() => markAsDelivered(order.id)} className="bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all">
                          <Clock size={14} /> Mark Delivered
                        </button>
                      ) : (
                        <div className="text-gray-400 flex items-center gap-1 font-bold text-sm">
                          <CheckCircle size={16} className="text-green-500" /> Delivered
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-bold">Waiting for incoming orders...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}