"use client";
import React, { useState, useEffect } from 'react';
import { Mic, MapPin, ShoppingCart, Search, Coins, Heart, User, ChevronRight, Zap, Smartphone, Tv, HeartHandshake, MoreHorizontal } from 'lucide-react';

export default function ZeshuSuperApp() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch products from your Render API
  useEffect(() => {
    fetch('https://zeshu-backend-api.onrender.com/api/products')
      .then(res => res.json())
      .then(json => setProducts(json.data || []))
      .catch(() => console.log("API waking up..."));
  }, []);

  const totalAmount = cart.reduce((acc, curr) => acc + curr.price, 0) + deliveryTip;

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-32 font-sans">
      
      {/* --- HEADER (Blinkit Style) --- */}
      <header className="sticky top-0 bg-white p-4 z-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-full"><MapPin size={18} className="text-orange-600" /></div>
            <div>
              <div className="flex items-center gap-1"><span className="text-sm font-black">Delivery in 12 mins</span><ChevronRight size={14} /></div>
              <div className="text-[10px] text-gray-500 font-bold truncate w-40">Jagtial, Telangana, India</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-2">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-xs font-bold">150</span>
             </div>
             <button onClick={() => setIsLoggedIn(!isLoggedIn)} className="bg-gray-100 p-2 rounded-full border border-gray-200">
                <User size={18} className="text-gray-600" />
             </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input className="w-full bg-gray-100 p-3.5 rounded-2xl pl-10 text-sm outline-none border border-transparent focus:border-purple-200" placeholder="Search 'recharge' or 'atta'" />
          <Mic className="absolute right-3 top-3.5 text-purple-600" size={18} />
        </div>
      </header>

      {/* --- PHONEPE GRID: BILLS & RECHARGES --- */}
      <section className="bg-white m-4 p-5 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Recharge & Pay Bills</h2>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">VIEW ALL</span>
        </div>
        <div className="grid grid-cols-4 gap-y-6">
          {[
            { n: 'Mobile', i: <Smartphone size={24}/>, c: '#f3e8ff', tc: '#7e22ce' },
            { n: 'DTH', i: <Tv size={24}/>, c: '#fff7ed', tc: '#ea580c' },
            { n: 'Electricity', i: <Zap size={24}/>, c: '#eff6ff', tc: '#2563eb' },
            { n: 'Donation', i: <HeartHandshake size={24}/>, c: '#fdf2f8', tc: '#db2777' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm" style={{backgroundColor: item.c, color: item.tc}}>
                {item.i}
              </div>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{item.n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- BLINKIT STOREFRONT: GROCERIES --- */}
      <section className="px-4">
        <h2 className="text-xl font-black mb-4">Grocery & Kitchen</h2>
        <div className="grid grid-cols-2 gap-4">
          {products.map((p: any) => (
            <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex flex-col">
              <img src={p.image_url} className="h-28 w-full object-contain mb-3" alt={p.name} />
              <div className="text-[10px] text-gray-400 font-bold uppercase">{p.unit}</div>
              <div className="text-sm font-bold text-gray-800 h-10 line-clamp-2 mb-2">{p.name}</div>
              <div className="flex justify-between items-center mt-auto">
                <span className="font-black text-base">₹{p.price}</span>
                <button 
                   onClick={() => setCart([...cart, p] as any)}
                   className="px-4 py-1.5 border-2 border-green-600 text-green-600 rounded-xl text-xs font-black uppercase hover:bg-green-600 hover:text-white transition-all"
                >
                  ADD
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- STICKY FOOTER: CART & TIP --- */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 bg-green-700 p-4 rounded-3xl flex justify-between items-center text-white shadow-2xl z-[100]">
          <div>
            <div className="text-[9px] font-black uppercase opacity-70">{cart.length} Item{cart.length > 1 ? 's' : ''}</div>
            <div className="text-lg font-black">₹{totalAmount}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[8px] font-black uppercase opacity-70">Add Tip?</div>
              <div className="flex gap-1 mt-1">
                {[10, 20].map(t => (
                  <button key={t} onClick={() => setDeliveryTip(t)} className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${deliveryTip === t ? 'bg-white text-green-700' : 'bg-green-800'}`}>₹{t}</button>
                ))}
              </div>
            </div>
            <button className="bg-white text-green-700 px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}