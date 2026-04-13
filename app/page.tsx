"use client";
import React, { useState, useEffect } from 'react';
import { Mic, MapPin, ShoppingCart, Search, Coins, Heart, User, ChevronRight, X } from 'lucide-react';

export default function ZeshuSuperApp() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deliveryTip, setDeliveryTip] = useState(0);

  // Fetch products from your Render API
  useEffect(() => {
    fetch('https://zeshu-backend-api.onrender.com/api/products')
      .then(res => res.json())
      .then(json => setProducts(json.data || []))
      .catch(() => console.log("API not ready yet, using offline mode"));
  }, []);

  const totalAmount = cart.reduce((acc, curr) => acc + curr.price, 0) + deliveryTip;

  return (
    <div className="max-w-md mx-auto bg-[#f3f4f6] min-h-screen pb-24 font-sans antialiased">
      
      {/* --- BLINKIT HEADER: Location & Profile --- */}
      <header className="sticky top-0 bg-white px-4 pt-4 pb-2 z-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <MapPin size={18} className="text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-gray-900">Delivery in 12 mins</span>
                <ChevronRight size={14} />
              </div>
              <div className="text-[11px] text-gray-500 font-medium truncate w-40">Jagtial, Telangana, India</div>
            </div>
          </div>
          <button 
            onClick={() => setIsLoggedIn(!isLoggedIn)}
            className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200"
          >
            <User size={20} className="text-gray-600" />
          </button>
        </div>
        
        {/* --- SEARCH BAR WITH MIC --- */}
        <div className="relative group">
          <input 
            className="w-full bg-gray-100 p-3.5 rounded-2xl pl-11 text-sm border border-transparent focus:border-purple-300 focus:bg-white transition-all outline-none" 
            placeholder="Search for 'Milk' or 'Recharge'" 
          />
          <Search className="absolute left-4 top-4 text-gray-400" size={18} />
          <div className="absolute right-3 top-2.5 p-1.5 hover:bg-purple-50 rounded-lg cursor-pointer">
            <Mic className="text-purple-600" size={20} />
          </div>
        </div>
      </header>

      {/* --- ZESHU COINS & REWARDS --- */}
      <div className="px-4 py-3 flex gap-3">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 flex-1 p-3 rounded-2xl border border-yellow-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-1.5 rounded-full">
              <Coins className="text-white" size={16} />
            </div>
            <div>
              <p className="text-[10px] text-yellow-800 font-bold uppercase">Zeshu Coins</p>
              <p className="text-sm font-black text-yellow-900">150</p>
            </div>
          </div>
          <button className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg text-yellow-700 border border-yellow-200">REDEEM</button>
        </div>
      </div>

      {/* --- PHONEPE STYLE: RECHARGE & BILLS GRID --- */}
      <section className="mx-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6 mt-2">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Bills & Recharges</h2>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase">Offers</span>
        </div>
        <div className="grid grid-cols-4 gap-y-6">
          {[
            { n: 'Mobile', i: '📱', c: '#f3e8ff', tc: '#7e22ce' },
            { n: 'DTH', i: '📡', c: '#fff7ed', tc: '#ea580c' },
            { n: 'Electricity', i: '💡', c: '#eff6ff', tc: '#2563eb' },
            { n: 'Donation', i: '🙏', c: '#fdf2f8', tc: '#db2777' },
            { n: 'Credit Card', i: '💳', c: '#ecfdf5', tc: '#059669' },
            { n: 'Insurance', i: '🛡️', c: '#f5f3ff', tc: '#6d28d9' },
            { n: 'Water', i: '💧', c: '#f0f9ff', tc: '#0284c7' },
            { n: 'More', i: '➕', c: '#f9fafb', tc: '#4b5563' }
          ].map((item) => (
            <div key={item.n} className="flex flex-col items-center group cursor-pointer">
              <div 
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-active:scale-90 transition-transform"
                style={{backgroundColor: item.c, color: item.tc}}
              >
                {item.i}
              </div>
              <span className="text-[10px] mt-2 font-bold text-gray-600 text-center">{item.n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- BLINKIT STYLE: GROCERIES --- */}
      <section className="px-4 pb-10">
        <div className="flex justify-between items-end mb-4 px-1">
          <div>
            <h2 className="text-xl font-black text-gray-900">Grocery & Kitchen</h2>
            <p className="text-xs text-gray-500 font-medium">Bestsellers from Jagtial Market</p>
          </div>
          <span className="text-xs text-green-600 font-black bg-green-50 px-2 py-1 rounded-md">10-15 MINS</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {products.length > 0 ? products.map((p: any) => (
            <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="bg-gray-50 rounded-xl mb-3 flex items-center justify-center p-2 relative">
                 <img src={p.image_url} className="h-28 w-full object-contain" alt={p.name} />
                 <div className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">Fresh</div>
              </div>
              <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-tight">{p.unit}</div>
              <div className="text-sm font-bold leading-tight text-gray-800 mb-4 h-10 overflow-hidden line-clamp-2">{p.name}</div>
              <div className="flex justify-between items-center mt-auto">
                <span className="font-black text-base text-gray-900 italic">₹{p.price}</span>
                <button 
                  onClick={() => setCart([...cart, p])}
                  className="px-5 py-1.5 border-2 border-green-600 text-green-600 rounded-xl text-xs font-black hover:bg-green-600 hover:text-white transition-colors uppercase"
                >
                  ADD
                </button>
              </div>
            </div>
          )) : <div className="col-span-2 text-center py-10 text-gray-400 font-medium italic">Opening Zeshu shop...</div>}
        </div>
      </section>

      {/* --- CART BAR WITH TIP OPTION --- */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 bg-[#1a1c1e] p-4 rounded-3xl flex justify-between items-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-800 z-[100]">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black tracking-widest text-green-400">{cart.length} ITEM{cart.length > 1 ? 'S' : ''} IN CART</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">₹{totalAmount}</span>
              <span className="text-[10px] text-gray-400 line-through">₹{totalAmount + 40}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
               <span className="text-[8px] font-bold text-gray-400 uppercase">Add Delivery Tip?</span>
               <div className="flex gap-1">
                 {[10, 20, 50].map(tip => (
                   <button 
                    key={tip}
                    onClick={() => setDeliveryTip(tip)}
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${deliveryTip === tip ? 'bg-green-600' : 'bg-gray-700'}`}
                   >₹{tip}</button>
                 ))}
               </div>
            </div>
            <button className="bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 shadow-lg shadow-green-900/20">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}