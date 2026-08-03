"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Power, IndianRupee, History, CheckCircle2, Navigation } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]); 
  const [totalEarnings, setTotalEarnings] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false); 
  const [userId, setUserId] = useState<string | null>(null);

  // For testing, hardcoding the rider ID since we don't have Rider Auth setup yet
  const RIDER_ID = '7754e8bf-5aff-4b44-901b-fdd28f2113cf'; 

  useEffect(() => { setUserId(RIDER_ID); }, []);

  useEffect(() => {
    if (!userId || !isOnline) { setOrders([]); return; }
    fetchMyOrders();
    const channel = supabase
      .channel('rider-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `assigned_rider_id=eq.${userId}` }, () => { fetchMyOrders(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, isOnline]);

  const fetchMyOrders = async () => {
    if (!userId) return;
    setLoading(true);
    const today = new Date(); today.setUTCHours(0, 0, 0, 0); 

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_rider_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data.filter(o => o.status === 'OUT_FOR_DELIVERY'));
      const delivered = data.filter(o => o.status === 'DELIVERED');
      setHistoryOrders(delivered);
      setTotalEarnings(delivered.length * 30); // ₹30 per delivery flat rate
    }
    setLoading(false);
  };

  const markDelivered = async (orderId: string) => {
    if(confirm("Are you at the customer's location?")) {
      await supabase.from('orders').update({ status: 'DELIVERED' }).eq('id', orderId);
      fetchMyOrders();
    }
  };

  const openGoogleMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-slate-900 pt-8 pb-6 px-6 rounded-b-[40px] shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-white text-2xl font-black tracking-wider">ZESHU RIDER</h1>
            <p className="text-slate-400 text-sm font-bold">Live Dispatch</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-slate-800 px-4 py-2 rounded-full flex items-center gap-1"><IndianRupee size={14} className="text-emerald-500"/><span className="text-emerald-500 font-black">Today: ₹{totalEarnings}</span></div>
            <button onClick={() => setShowHistory(true)} className="bg-slate-700 px-4 py-2 rounded-full flex items-center gap-2 text-slate-300 text-xs font-black uppercase"><History size={12}/> History</button>
          </div>
        </div>
        <button onClick={() => setIsOnline(!isOnline)} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-xl uppercase transition-colors ${isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
          <Power size={24}/> {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      <div className="p-6">
        <h2 className="text-slate-500 font-black uppercase tracking-widest text-sm mb-4">{isOnline ? 'Active Deliveries' : 'You are Offline'}</h2>
        
        {!isOnline ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50"><Power size={64} className="text-slate-400 mb-4"/><p className="text-slate-500 font-bold text-lg">Go online to receive orders</p></div>
        ) : loading && orders.length === 0 ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full"></div></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20"><div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4"><MapPin size={40} className="text-slate-400"/></div><p className="text-slate-500 font-bold text-lg">Waiting for orders...</p></div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 mb-4">
              <div className="flex justify-between items-center mb-4"><span className="bg-slate-100 text-slate-600 font-black text-xs px-3 py-1.5 rounded-lg">#{order.id.split('-')[0].toUpperCase()}</span><span className="text-emerald-500 font-black text-xl">₹30</span></div>
              <div className="flex items-start gap-4 mb-6"><MapPin className="text-slate-900 shrink-0" size={24}/><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Drop Location</p><p className="font-bold text-slate-900">{order.delivery_address || 'Address missing'}</p></div></div>
              <div className="flex gap-3">
                <button onClick={() => openGoogleMaps(order.delivery_address)} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Navigation size={18}/> Navigate</button>
                <button onClick={() => markDelivered(order.id)} className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><CheckCircle2 size={18}/> Delivered</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showHistory && (
        <div className="fixed inset-0 bg-slate-50 z-50 animate-in slide-in-from-bottom">
          <div className="bg-white p-6 pt-10 border-b flex justify-between items-center">
            <div><h2 className="text-2xl font-black text-slate-900">Today's History</h2><p className="text-emerald-500 font-bold">Total Earned: ₹{totalEarnings}</p></div>
            <button onClick={() => setShowHistory(false)} className="p-3 bg-slate-100 rounded-full active:scale-90"><History size={24} className="text-slate-500"/></button>
          </div>
          <div className="p-6 overflow-y-auto h-full pb-32">
            {historyOrders.length === 0 ? <p className="text-center text-slate-400 font-bold mt-10">No deliveries completed today.</p> : historyOrders.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border mb-4 flex justify-between items-center">
                <div><p className="text-[10px] font-black text-slate-400 mb-1">#{item.id.split('-')[0].toUpperCase()}</p><p className="font-bold text-sm max-w-[200px] truncate">{item.delivery_address}</p></div>
                <div className="text-right"><p className="text-emerald-500 font-black text-lg">+₹30</p><p className={`text-[9px] font-black mt-1 ${item.payout_status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>{item.payout_status === 'PAID' ? 'PAID OUT' : 'PENDING PAY'}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}