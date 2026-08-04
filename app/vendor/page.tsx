export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftStarted, setShiftStarted] = useState(false); // <-- ADD THIS
  // "use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Package, Truck, CheckCircle, Clock, MapPin, BellRing, Phone, IndianRupee } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const playNotificationSound = () => {
    if (!shiftStarted) return; // Don't play if shift hasn't started
    try {
      const audio = new Audio('https://assets.mixkit.co/active-storage/sfx/2869/2869-preview.mp3');
      audio.play().catch((e) => console.log("Audio play blocked:", e));
    } catch (e) {
      console.log("Audio error:", e);
    }
  };
export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
// --- ADD THIS BLOCK ---
  if (!shiftStarted) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center">
        <BellRing size={64} className="text-indigo-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black text-white mb-2">Vendor Terminal</h1>
        <p className="text-slate-400 mb-8 max-w-md">You must start your shift to enable loud audio notifications for incoming orders.</p>
        <button 
          onClick={() => {
            // This silent audio play unlocks the browser's audio engine
            new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA').play().catch(()=>{});
            setShiftStarted(true);
          }} 
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xl py-5 px-10 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          Start Shift & Enable Audio
        </button>
      </div>
    );
  }
  // --- END ADDED BLOCK ---

  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-100 font-sans selection:bg-indigo-500/30">
    // ... rest of your existing return code ...
  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active-storage/sfx/2869/2869-preview.mp3');
      audio.play();
    } catch (e) {
      console.log("Audio play blocked by browser policy");
    }
  };

  useEffect(() => {
    fetchOrders();
    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((currentOrders) => [payload.new, ...currentOrders]);
        playNotificationSound();
      })
      .subscribe();

    return () => { supabase.removeChannel(orderSubscription); };
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setOrders(data);
    setIsLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-100 font-sans selection:bg-indigo-500/30">
      <header className="bg-[#1E293B] border-b border-slate-700/50 sticky top-0 z-50 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black p-2 md:p-2.5 rounded-xl text-xl md:text-2xl tracking-tighter shadow-lg shadow-indigo-500/20">Z</div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none">Vendor Terminal</h1>
              <p className="text-[9px] md:text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">Live Network <span className="hidden md:inline">• Active</span></p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold">
              <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-emerald-500"></span></span>
              <span className="hidden sm:inline">Accepting Orders</span>
              <span className="sm:hidden">Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-[#1E293B] border border-slate-700/50 p-4 md:p-6 rounded-2xl">
            <h3 className="text-slate-400 font-bold text-[9px] md:text-sm uppercase tracking-wider mb-1 md:mb-2 line-clamp-1">Today's Orders</h3>
            <p className="text-2xl md:text-4xl font-black text-white">{orders.length}</p>
          </div>
          <div className="bg-[#1E293B] border border-slate-700/50 p-4 md:p-6 rounded-2xl">
            <h3 className="text-slate-400 font-bold text-[9px] md:text-sm uppercase tracking-wider mb-1 md:mb-2 line-clamp-1">Pending Pack</h3>
            <p className="text-2xl md:text-4xl font-black text-amber-400">{orders.filter(o => o.status === 'pending' || !o.status).length}</p>
          </div>
          <div className="bg-[#1E293B] border border-slate-700/50 p-4 md:p-6 rounded-2xl">
            <h3 className="text-slate-400 font-bold text-[9px] md:text-sm uppercase tracking-wider mb-1 md:mb-2 line-clamp-1">Out For Delivery</h3>
            <p className="text-2xl md:text-4xl font-black text-indigo-400">{orders.filter(o => o.status === 'picked_up').length}</p>
          </div>
          <div className="bg-[#1E293B] border border-slate-700/50 p-4 md:p-6 rounded-2xl">
            <h3 className="text-slate-400 font-bold text-[9px] md:text-sm uppercase tracking-wider mb-1 md:mb-2 line-clamp-1">Total Revenue</h3>
            <p className="text-2xl md:text-4xl font-black text-emerald-400 flex items-center"><IndianRupee size={18} className="mr-1 md:w-7 md:h-7"/>{orders.reduce((acc, o) => acc + (o.total_amount || 0), 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-4">
               <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
               Loading live network...
            </div>
          ) : orders.length === 0 ? (
            <div className="col-span-full bg-[#1E293B] border border-slate-700/50 rounded-3xl p-12 md:p-20 text-center flex flex-col items-center mt-4">
              <BellRing size={40} className="text-slate-600 mb-4"/>
              <h2 className="text-xl md:text-2xl font-black text-slate-300">No orders yet</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-2">Waiting for customers to checkout...</p>
            </div>
          ) : (
            orders.map((order) => {
              const status = order.status || 'pending';
              let items = [];
              try { items = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : order.cart_items || []; } catch(e) {}

              return (
                <div key={order.id} className="bg-[#1E293B] border border-slate-700/50 rounded-3xl overflow-hidden shadow-lg flex flex-col">
                  <div className={`p-4 md:p-5 flex justify-between items-start border-b border-slate-700/50 ${status === 'pending' ? 'bg-amber-500/10' : status === 'picked_up' ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}>
                    <div>
                      <span className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider inline-block mb-2 ${status === 'pending' ? 'bg-amber-500/20 text-amber-400' : status === 'picked_up' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {status === 'pending' ? 'New Order' : status === 'picked_up' ? 'Out for Delivery' : 'Delivered'}
                      </span>
                      <h3 className="font-bold text-slate-300 text-xs md:text-sm">ID: {order.id?.split('-')[0].toUpperCase()}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-black text-white">₹{order.total_amount}</p>
                      <p className="text-[10px] md:text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0"/>
                      <div>
                        <p className="text-xs md:text-sm font-bold text-white mb-1">Delivery Address</p>
                        <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed">{order.delivery_address || 'Address not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 flex-1 bg-[#1E293B]">
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4">Items to Pack ({items.length})</p>
                    <div className="space-y-2 md:space-y-3">
                      {items.map((cartItem: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-2.5 md:p-3 rounded-xl border border-slate-700/50">
                          <div className="flex items-center gap-2 md:gap-3">
                            <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-[10px] md:text-xs">{cartItem.qty}x</span>
                            <span className="font-bold text-xs md:text-sm text-slate-200 line-clamp-1">{cartItem.item?.name || 'Unknown Item'}</span>
                          </div>
                          <span className="font-bold text-slate-400 text-xs md:text-sm">₹{cartItem.item?.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 md:p-5 border-t border-slate-700/50 bg-slate-900/50">
                    {status === 'pending' && (
                      <button onClick={() => updateOrderStatus(order.id, 'picked_up')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 md:py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 text-sm md:text-base">
                        <Package size={18}/> Accept & Pack Order
                      </button>
                    )}
                    {status === 'picked_up' && (
                      <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-3.5 md:py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/20 text-sm md:text-base">
                        <Truck size={18}/> Hand to Delivery Rider
                      </button>
                    )}
                    {status === 'delivered' && (
                      <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black py-3.5 md:py-4 rounded-xl flex items-center justify-center gap-2 text-sm md:text-base">
                        <CheckCircle size={18}/> Order Complete
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}