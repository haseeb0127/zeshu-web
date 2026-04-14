/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Mic, MapPin, Search, Coins, User, ChevronRight, Zap, Smartphone, 
  Tv, HeartHandshake, Plus, Minus, ShoppingBag, X, LogOut, CheckCircle2
} from 'lucide-react';

export default function ZeshuSuperApp() {
  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{item: any, qty: number}[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [location, setLocation] = useState("Jagtial, Telangana");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [useZeshuCoins, setUseZeshuCoins] = useState(false);
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [isDonating, setIsDonating] = useState(false);

  // Constants
  const ZESHU_COINS_VAL = 50; 
  const DONATION_VAL = 2; 
  const coinsBalance = 150;

  // Fetch Live Inventory
  useEffect(() => {
    fetch('https://zeshu-backend-api.onrender.com/api/products')
      .then(res => res.json())
      .then(json => setProducts(json.data || []))
      .catch(() => console.log("Backend waking up..."));
  }, []);

  // --- CART LOGIC ---
  const addToCart = (product: any) => {
    const existing = cart.find(c => c.item.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { item: product, qty: 1 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    const existing = cart.find(c => c.item.id === productId);
    if (existing && existing.qty > 1) {
      setCart(cart.map(c => c.item.id === productId ? { ...c, qty: c.qty - 1 } : c));
    } else {
      setCart(cart.filter(c => c.item.id !== productId));
    }
  };

  const itemTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
  const finalTotal = itemTotal 
    - (useZeshuCoins ? ZESHU_COINS_VAL : 0) 
    + deliveryTip 
    + (isDonating ? DONATION_VAL : 0);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-40 font-sans antialiased text-gray-900">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 bg-white p-4 z-40 border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2" onClick={() => setLocation("Detecting...")}>
            <div className="bg-orange-100 p-2 rounded-full"><MapPin size={18} className="text-orange-600" /></div>
            <div className="cursor-pointer">
              <div className="flex items-center gap-1"><span className="text-sm font-black">Delivery in 12 mins</span><ChevronRight size={14} /></div>
              <div className="text-[11px] text-gray-500 font-bold truncate w-40">{location}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-xs font-bold">{coinsBalance}</span>
             </div>
             <button onClick={() => setIsLoggedIn(!isLoggedIn)} className={`p-2 rounded-full transition-all ${isLoggedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {isLoggedIn ? <User size={20} /> : <LogOut size={20} />}
             </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input 
            className="w-full bg-gray-100 p-3.5 rounded-2xl pl-10 text-sm outline-none border border-transparent focus:bg-white focus:border-green-300 transition-all" 
            placeholder="Search 'milk' or 'mobile recharge'..." 
          />
          <Mic className="absolute right-3 top-3.5 text-green-600 cursor-pointer" size={18} />
        </div>
      </header>

      {/* 2. CATEGORIES */}
      <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide">
        {['Summer', 'Electronics', 'Beauty', 'Pharmacy', 'Paan Corner'].map((cat, i) => (
          <div key={i} className="flex flex-col items-center min-w-[70px]">
            <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 mb-1">
              <ShoppingBag size={24} className="text-gray-400" />
            </div>
            <span className="text-[10px] font-black uppercase text-gray-500">{cat}</span>
          </div>
        ))}
      </div>

      {/* 3. BILLS & RECHARGES (PhonePe Style) */}
      <section className="bg-white mx-4 mt-2 p-5 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Bills & Recharges</h2>
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

      {/* 4. PRODUCT GRID */}
      <section className="p-4 mt-2">
        <h2 className="text-xl font-black mb-4 text-gray-900">Grocery & Kitchen</h2>
        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => {
            const inCart = cart.find(c => c.item.id === p.id);
            return (
              <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:border-green-200 transition-colors">
                <div className="bg-gray-50 rounded-xl mb-3 flex items-center justify-center p-2 relative h-32">
                  <img src={p.image_url} className="h-full w-full object-contain mix-blend-multiply" alt={p.name} />
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">12 MINS</div>
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{p.unit}</div>
                <div className="text-sm font-bold text-gray-800 h-10 line-clamp-2 mb-2 leading-tight">{p.name}</div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="font-black text-base text-gray-900">₹{p.price}</span>
                  {inCart ? (
                    <div className="flex items-center bg-green-600 rounded-xl text-white">
                      <button onClick={() => removeFromCart(p.id)} className="p-1.5"><Minus size={14} /></button>
                      <span className="px-2 text-xs font-bold">{inCart.qty}</span>
                      <button onClick={() => addToCart(p)} className="p-1.5"><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button 
                       onClick={() => addToCart(p)}
                       className="px-4 py-1.5 border-2 border-green-600 text-green-600 rounded-xl text-xs font-black uppercase hover:bg-green-600 hover:text-white transition-all active:scale-95"
                    >ADD</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. STICKY FOOTER */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50">
          <div className="max-w-md mx-auto flex justify-between items-center bg-green-700 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-transform cursor-pointer" onClick={() => setIsCartOpen(true)}>
            <div className="flex items-center gap-3">
              <div className="bg-green-800 p-2 rounded-lg"><ShoppingBag size={20} /></div>
              <div>
                <div className="text-xs font-bold opacity-80 uppercase tracking-tighter">{cart.length} Items</div>
                <div className="text-lg font-black">₹{finalTotal}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 font-black uppercase text-sm">View Cart <ChevronRight size={20} /></div>
          </div>
        </div>
      )}

      {/* 6. CART MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end">
          <div className="w-full max-w-md mx-auto bg-gray-50 rounded-t-[40px] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-20">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center rounded-t-[40px]">
              <h3 className="text-xl font-black">My Cart</h3>
              <button onClick={() => setIsCartOpen(false)} className="bg-gray-100 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white rounded-3xl p-4 shadow-sm">
                {cart.map((c, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                        <img src={c.item.image_url} className="w-full h-full object-contain" alt=""/>
                      </div>
                      <div>
                        <div className="text-sm font-bold truncate w-40">{c.item.name}</div>
                        <div className="text-xs text-gray-400 font-bold tracking-tighter">₹{c.item.price} × {c.qty}</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-100 rounded-lg">
                      <button onClick={() => removeFromCart(c.item.id)} className="p-1"><Minus size={14} /></button>
                      <span className="px-2 text-xs font-bold">{c.qty}</span>
                      <button onClick={() => addToCart(c.item)} className="p-1"><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-4 rounded-3xl flex justify-between items-center border-2 transition-all cursor-pointer ${useZeshuCoins ? 'bg-black text-white border-black' : 'bg-white border-gray-100'}`} onClick={() => setUseZeshuCoins(!useZeshuCoins)}>
                <div className="flex items-center gap-3">
                  <Coins className={useZeshuCoins ? "text-yellow-400" : "text-gray-400"} />
                  <div>
                    <div className="text-xs font-black uppercase">Use Zeshu Coins</div>
                    <div className="text-[10px] opacity-70">Save ₹50 on this order</div>
                  </div>
                </div>
                {useZeshuCoins ? <CheckCircle2 className="text-green-400" /> : <div className="w-6 h-6 border-2 border-gray-100 rounded-full" />}
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Delivery Partner Tip</div>
                <div className="flex gap-2">
                  {[10, 20, 30, 50].map(tip => (
                    <button key={tip} onClick={() => setDeliveryTip(tip)} className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${deliveryTip === tip ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>₹{tip}</button>
                  ))}
                  <button onClick={() => setDeliveryTip(0)} className="px-3 bg-gray-100 rounded-xl"><X size={14}/></button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <HeartHandshake className="text-pink-500" />
                  <div>
                    <div className="text-xs font-bold uppercase">Feed a needy child</div>
                    <div className="text-[10px] text-gray-400">Add ₹2 to your order</div>
                  </div>
                </div>
                <input type="checkbox" checked={isDonating} onChange={() => setIsDonating(!isDonating)} className="w-5 h-5 accent-pink-500" />
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500 font-bold">Item Total</span><span className="font-black">₹{itemTotal}</span></div>
                {useZeshuCoins && <div className="flex justify-between text-sm text-green-600"><span className="font-bold tracking-tighter">Zeshu Coins Discount</span><span className="font-black">-₹50</span></div>}
                <div className="flex justify-between text-sm"><span className="text-gray-500 font-bold">Handling Fee</span><span className="font-black">₹5</span></div>
                {deliveryTip > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 font-bold">Tip</span><span className="font-black">₹{deliveryTip}</span></div>}
                <div className="flex justify-between pt-4 border-t border-gray-100"><span className="text-lg font-black uppercase">Grand Total</span><span className="text-lg font-black">₹{finalTotal + 5}</span></div>
              </div>

              <button className="w-full bg-green-700 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-green-900/20 active:scale-95 transition-transform mb-10">
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}