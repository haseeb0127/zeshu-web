/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Mic, MapPin, Search, Coins, User, ChevronRight, Zap, Smartphone, 
  Tv, HeartHandshake, Plus, Minus, ShoppingBag, X, LogOut, CheckCircle2, Home
} from 'lucide-react';

// A1Topup Commission Rates mapping (Backend values)
const OPERATOR_RATES: Record<string, number> = {
  'Airtel': 1.00,
  'Jio': 0.65,
  'Vodafone': 3.70,
  'Idea': 3.70,
  'BSNL': 3.00,
  'TataSky DTH': 3.20,
  'Airtel DTH': 4.20,
  'Electricity': 0.50 
};

export default function ZeshuSuperApp() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'recharge'
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{item: any, qty: number}[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [useZeshuCoins, setUseZeshuCoins] = useState(false);
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [isDonating, setIsDonating] = useState(false);
  const [coinsBalance, setCoinsBalance] = useState(150);

  // Recharge State
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('Jio');
  const [rechargeNumber, setRechargeNumber] = useState('');

  // Constants
  const ZESHU_COINS_VAL = 50; 
  const DONATION_VAL = 1; 

  useEffect(() => {
    fetch('https://zeshu-backend-api.onrender.com/api/products')
      .then(res => res.json())
      .then(json => setProducts(json.data || []))
      .catch(() => console.log("Backend waking up..."));
  }, []);

  // --- LOGIC ---
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
  const finalTotal = itemTotal - (useZeshuCoins ? ZESHU_COINS_VAL : 0) + deliveryTip + (isDonating ? DONATION_VAL : 0);

  // Calculate 80% profit for user as Zeshu Coins
  const calculatePotentialCoins = () => {
    const amt = parseFloat(rechargeAmount) || 0;
    const rate = OPERATOR_RATES[selectedOperator] || 0;
    const commission = amt * (rate / 100);
    return (commission * 0.80).toFixed(2); 
  };

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-pink-50 via-purple-50 to-white min-h-screen pb-40 font-sans antialiased text-gray-900 shadow-2xl overflow-hidden relative">
      
      {/* HEADER */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md p-4 z-40 border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          
          {/* Logo routing to home */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
             <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black p-2 rounded-xl text-xl shadow-lg">Z</div>
             <div className="flex flex-col">
               <span className="text-sm font-black tracking-tight leading-none">ZESHU</span>
               <span className="text-[9px] font-bold text-purple-600 tracking-widest uppercase">Super App</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md border border-gray-800">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-xs font-bold">{coinsBalance}</span>
             </div>
             <button onClick={() => setIsLoggedIn(!isLoggedIn)} className="p-2 rounded-full bg-purple-100 text-purple-700">
                {isLoggedIn ? <User size={20} /> : <LogOut size={20} />}
             </button>
          </div>
        </div>

        {isLoggedIn && (
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-right">
            Welcome, MOHD HASEEB RAFIQUE
          </div>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input 
            className="w-full bg-white p-3.5 rounded-2xl pl-10 text-sm outline-none border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all shadow-sm" 
            placeholder="Search 'sugar' or 'butter'..." 
          />
          <Mic className="absolute right-3 top-3.5 text-purple-600 cursor-pointer" size={18} />
        </div>
      </header>

      {/* LOCATION BAR */}
      <div className="bg-white p-3 mx-4 mt-4 rounded-2xl shadow-sm border border-pink-100 flex items-center gap-3">
        <div className="bg-pink-100 p-2 rounded-full"><MapPin size={16} className="text-pink-600" /></div>
        <div className="flex-1">
          <div className="text-[10px] font-black text-pink-600 uppercase tracking-widest">Delivering To</div>
          <div className="text-xs font-bold text-gray-700 truncate">HotelRoom 205, Shree Amardeep Hotel, Hyderabad...</div>
        </div>
        <ChevronRight size={16} className="text-gray-400" />
      </div>

      {activeTab === 'home' ? (
        <>
          {/* CATEGORIES */}
          <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide mt-2">
            {['Summer', 'Electronics', 'Beauty', 'Pharmacy', 'Paan Corner'].map((cat, i) => (
              <div key={i} className="flex flex-col items-center min-w-[70px]">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm mb-1">
                  <ShoppingBag size={24} className="text-purple-400" />
                </div>
                <span className="text-[10px] font-black uppercase text-gray-600">{cat}</span>
              </div>
            ))}
          </div>

          {/* SERVICES GRID */}
          <section className="bg-white mx-4 mt-2 p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase">Earn Zeshu Coins</div>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Bills & Recharges</h2>
            <div className="grid grid-cols-4 gap-y-6">
              {[
                { n: 'Mobile', i: <Smartphone size={24}/>, c: '#f3e8ff', tc: '#7e22ce', a: () => setActiveTab('recharge') },
                { n: 'DTH', i: <Tv size={24}/>, c: '#fff7ed', tc: '#ea580c', a: () => setActiveTab('recharge') },
                { n: 'Electricity', i: <Zap size={24}/>, c: '#eff6ff', tc: '#2563eb', a: () => setActiveTab('recharge') },
                { n: 'Donation', i: <HeartHandshake size={24}/>, c: '#fdf2f8', tc: '#db2777', a: () => {} },
              ].map((item, idx) => (
                <div key={idx} onClick={item.a} className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm" style={{backgroundColor: item.c, color: item.tc}}>
                    {item.i}
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tighter">{item.n}</span>
                </div>
              ))}
            </div>
          </section>

          {/* GROCERY GRID */}
          <section className="p-4 mt-2">
            <div className="flex justify-between items-end mb-4">
               <h2 className="text-xl font-black text-gray-900">Grocery & Kitchen</h2>
               <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">UPTO 60% COIN REWARDS</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {products.map((p) => {
                const inCart = cart.find(c => c.item.id === p.id);
                return (
                  <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:border-purple-200 transition-colors">
                    <div className="bg-gray-50 rounded-xl mb-3 flex items-center justify-center p-2 relative h-32">
                      <img src={p.image_url} className="h-full w-full object-contain mix-blend-multiply" alt={p.name} />
                      <div className="absolute top-2 left-2 bg-purple-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">14 MINS</div>
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{p.unit}</div>
                    <div className="text-sm font-bold text-gray-800 h-10 line-clamp-2 mb-2 leading-tight">{p.name}</div>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="font-black text-base text-gray-900">₹{p.price}</span>
                      {inCart ? (
                        <div className="flex items-center bg-purple-600 rounded-xl text-white">
                          <button onClick={() => removeFromCart(p.id)} className="p-1.5"><Minus size={14} /></button>
                          <span className="px-2 text-xs font-bold">{inCart.qty}</span>
                          <button onClick={() => addToCart(p)} className="p-1.5"><Plus size={14} /></button>
                        </div>
                      ) : (
                        <button 
                           onClick={() => addToCart(p)}
                           className="px-4 py-1.5 border-2 border-purple-600 text-purple-600 rounded-xl text-xs font-black uppercase hover:bg-purple-600 hover:text-white transition-all active:scale-95"
                        >ADD</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        /* RECHARGE UI SECTION */
        <section className="p-4 animate-in fade-in zoom-in duration-300">
           <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
              
              <h2 className="text-lg font-black mb-1">Prepaid Recharge</h2>
              <p className="text-xs text-gray-500 font-bold mb-6">Earn assured Zeshu Coins on every recharge!</p>

              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Operator</label>
                    <select 
                       className="w-full mt-1 p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-gray-700"
                       value={selectedOperator}
                       onChange={(e) => setSelectedOperator(e.target.value)}
                    >
                       {Object.keys(OPERATOR_RATES).map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mobile Number</label>
                    <input 
                       type="tel" 
                       placeholder="9167048985"
                       className="w-full mt-1 p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-xl tracking-wider"
                       value={rechargeNumber}
                       onChange={(e) => setRechargeNumber(e.target.value)}
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Amount</label>
                    <div className="relative">
                       <span className="absolute left-4 top-4 text-xl font-bold text-gray-400">₹</span>
                       <input 
                          type="number" 
                          placeholder="0"
                          className="w-full mt-1 p-4 pl-10 bg-gray-50 rounded-2xl border-none outline-none font-black text-2xl"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                       />
                    </div>
                 </div>

                 {rechargeAmount && (
                    <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 p-4 rounded-2xl border border-yellow-200 flex items-center justify-between">
                       <div>
                          <div className="text-[10px] font-black uppercase text-yellow-700 tracking-widest">R-Offer Applied</div>
                          <div className="text-sm font-bold text-yellow-900">You will earn</div>
                       </div>
                       <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm">
                          <Coins size={14} className="text-yellow-500" />
                          <span className="font-black text-yellow-600">{calculatePotentialCoins()} Coins</span>
                       </div>
                    </div>
                 )}

                 <button className="w-full bg-purple-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-900/20 active:scale-95 transition-transform mt-4">
                    Recharge Now
                 </button>
              </div>
           </div>
        </section>
      )}

      {/* STICKY CART FOOTER */}
      {cart.length > 0 && activeTab === 'home' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50">
          <div className="max-w-md mx-auto flex justify-between items-center bg-purple-700 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-transform cursor-pointer" onClick={() => setIsCartOpen(true)}>
            <div className="flex items-center gap-3">
              <div className="bg-purple-800 p-2 rounded-lg"><ShoppingBag size={20} /></div>
              <div>
                <div className="text-xs font-bold opacity-80 uppercase tracking-tighter">{cart.length} Items</div>
                <div className="text-lg font-black">₹{finalTotal}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 font-black uppercase text-sm">View Cart <ChevronRight size={20} /></div>
          </div>
        </div>
      )}

      {/* CART MODAL (BLINKIT STYLE) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end">
          <div className="w-full max-w-md mx-auto bg-gray-50 rounded-t-[30px] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 shadow-2xl">
            
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center rounded-t-[30px] z-10">
              <h3 className="text-xl font-black">Shipment of {cart.length} item{cart.length > 1 ? 's' : ''}</h3>
              <button onClick={() => setIsCartOpen(false)} className="bg-gray-100 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="p-4 space-y-4">
              
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                {cart.map((c, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center p-1">
                        <img src={c.item.image_url} className="w-full h-full object-contain mix-blend-multiply" alt=""/>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-sm font-bold truncate w-36 text-gray-800">{c.item.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold tracking-widest">{c.item.unit}</div>
                        <div className="text-sm font-black mt-1">₹{c.item.price}</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-purple-50 rounded-xl border border-purple-100">
                      <button onClick={() => removeFromCart(c.item.id)} className="p-2 text-purple-600"><Minus size={14} /></button>
                      <span className="px-1 text-sm font-black text-purple-800">{c.qty}</span>
                      <button onClick={() => addToCart(c.item)} className="p-2 text-purple-600"><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Zeshu Coins System */}
              <div className={`p-4 rounded-2xl flex justify-between items-center border-2 transition-all cursor-pointer ${useZeshuCoins ? 'bg-gradient-to-r from-purple-900 to-black text-white border-black' : 'bg-white border-purple-100 shadow-sm'}`} onClick={() => setUseZeshuCoins(!useZeshuCoins)}>
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-400/20 p-2 rounded-full">
                     <Coins className={useZeshuCoins ? "text-yellow-400" : "text-yellow-500"} size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase">Apply Zeshu Coins</div>
                    <div className={`text-[10px] font-bold ${useZeshuCoins ? 'text-gray-300' : 'text-gray-500'}`}>Your total savings ₹{ZESHU_COINS_VAL}</div>
                  </div>
                </div>
                {useZeshuCoins ? <CheckCircle2 className="text-green-400" size={24} /> : <div className="w-6 h-6 border-2 border-gray-200 rounded-full" />}
              </div>

              {/* Feeding India */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-50 p-2 rounded-full"><HeartHandshake className="text-pink-500" size={20} /></div>
                  <div>
                    <div className="text-sm font-black">Feeding India donation</div>
                    <div className="text-[10px] text-gray-500 font-bold w-48 leading-tight">Working towards a malnutrition free India.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-black text-sm">₹1</span>
                   <input type="checkbox" checked={isDonating} onChange={() => setIsDonating(!isDonating)} className="w-5 h-5 accent-pink-500 rounded" />
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-sm font-black mb-1">Tip your delivery partner</div>
                <div className="text-[10px] font-bold text-gray-500 mb-4 leading-tight">Your kindness means a lot! 100% of your tip will go directly to your delivery partner.</div>
                <div className="flex gap-2">
                  {[20, 30, 50].map(tip => (
                    <button key={tip} onClick={() => setDeliveryTip(tip)} className={`flex-1 py-2 rounded-xl font-black text-sm transition-all border ${deliveryTip === tip ? 'bg-purple-50 border-purple-600 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'}`}>₹{tip}</button>
                  ))}
                  <button onClick={() => setDeliveryTip(0)} className="flex-1 py-2 rounded-xl font-black text-sm bg-white border border-gray-200 text-gray-600">Clear</button>
                </div>
              </div>

              {/* Bill Details */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                <h4 className="font-black text-sm mb-2">Bill details</h4>
                <div className="flex justify-between text-xs font-bold text-gray-600"><span>Items total</span><span>₹{itemTotal}</span></div>
                {useZeshuCoins && <div className="flex justify-between text-xs font-black text-purple-600"><span>Zeshu Coins Saved</span><span>-₹{ZESHU_COINS_VAL}</span></div>}
                <div className="flex justify-between text-xs font-bold text-gray-600"><span>Delivery charge</span><span>₹30</span></div>
                <div className="flex justify-between text-xs font-bold text-gray-600"><span>Handling charge</span><span>₹5</span></div>
                {deliveryTip > 0 && <div className="flex justify-between text-xs font-bold text-gray-600"><span>Delivery Tip</span><span>₹{deliveryTip}</span></div>}
                {isDonating && <div className="flex justify-between text-xs font-bold text-gray-600"><span>Feeding India</span><span>₹{DONATION_VAL}</span></div>}
                
                <div className="flex justify-between pt-3 border-t border-dashed border-gray-200 mt-2">
                   <span className="text-sm font-black uppercase">Grand Total</span>
                   <span className="text-sm font-black">₹{finalTotal + 35}</span>
                </div>
                {useZeshuCoins && <div className="text-[10px] font-black text-purple-600 text-right uppercase tracking-widest bg-purple-50 p-2 rounded-lg mt-2">Your total savings ₹{ZESHU_COINS_VAL}</div>}
              </div>

              {/* Delivery Address */}
              <div className="bg-gray-100 rounded-2xl p-4 flex justify-between items-center border border-gray-200">
                 <div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Delivering To Home</div>
                    <div className="text-xs font-bold text-gray-700 w-48 truncate mt-1">HotelRoom 205, 2nd floor Shree Amardeep Hotel, Mahatma Gandhi Rd, Nallagutta, Ramgopalpet, Hyderabad</div>
                 </div>
                 <span className="text-xs font-black text-purple-600 cursor-pointer">Change</span>
              </div>

              <button className="w-full bg-purple-700 text-white py-4 rounded-[20px] font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-900/20 active:scale-95 transition-transform mb-6 flex justify-between px-6 items-center">
                <div className="flex flex-col items-start">
                   <span className="text-lg">₹{finalTotal + 35}</span>
                   <span className="text-[9px] text-purple-200">TOTAL</span>
                </div>
                <span className="flex items-center gap-2">Proceed To Pay <ChevronRight size={16}/></span>
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}