import React, { useState, useEffect } from 'react';
import { Mic, MapPin, ShoppingCart, Search, Wallet, Heart, Coins } from 'lucide-react';

export default function ZeshuSuperApp() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [coins, setCoins] = useState(150); // Zeshu Coins

  // 1. Fetch live data from your Render Backend
  useEffect(() => {
    fetch('https://zeshu-backend-api.onrender.com/api/products')
      .then(res => res.json())
      .then(json => setProducts(json.data));
  }, []);

  const addToCart = (p) => setCart([...cart, p]);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24 font-sans">
      
      {/* --- BLINKIT STYLE HEADER --- */}
      <header className="sticky top-0 bg-white p-4 shadow-sm z-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <MapPin size={20} className="text-orange-500" />
            <div>
              <div className="text-xs font-bold text-gray-500">Delivery to Jagtial</div>
              <div className="text-sm font-bold truncate w-32">Main Road, Sector 4...</div>
            </div>
          </div>
          <button onClick={() => setIsLoggedIn(!isLoggedIn)} className="text-sm font-bold text-purple-700">
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>
        
        <div className="relative">
          <input className="w-full bg-gray-100 p-3 rounded-xl pl-10 text-sm" placeholder="Search 'Milk' or 'Recharge'" />
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <Mic className="absolute right-3 top-3 text-purple-600 cursor-pointer" size={18} />
        </div>
      </header>

      {/* --- ZESHU COINS & WALLET --- */}
      <div className="p-4 flex gap-2">
        <div className="bg-yellow-100 flex-1 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="text-yellow-600" size={20} />
            <span className="text-xs font-bold">Zeshu Coins</span>
          </div>
          <span className="font-bold text-yellow-700">{coins}</span>
        </div>
      </div>

      {/* --- PHONEPE STYLE: BILLS & RECHARGE --- */}
      <section className="p-4 bg-white mx-4 rounded-2xl shadow-sm mb-4">
        <h2 className="text-sm font-bold mb-4 text-gray-800 uppercase tracking-wider">Recharge & Pay Bills</h2>
        <div className="grid grid-cols-4 gap-y-6">
          {[
            { n: 'Mobile', i: '📱', c: '#e8f5e9' },
            { n: 'DTH', i: '📡', c: '#fff3e0' },
            { n: 'Electricity', i: '💡', c: '#e3f2fd' },
            { n: 'Donate', i: '🙏', c: '#fce4ec' }
          ].map((item) => (
            <div key={item.n} className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-sm" style={{backgroundColor: item.c}}>
                {item.i}
              </div>
              <span className="text-[10px] mt-2 font-semibold text-gray-600">{item.n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- BLINKIT STYLE: GROCERIES --- */}
      <section className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Groceries & Essentials</h2>
          <span className="text-xs text-green-600 font-bold">10 MINS</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <img src={p.image_url} className="h-24 w-full object-contain mb-2" alt={p.name} />
              <div className="text-[11px] text-gray-400">{p.unit}</div>
              <div className="text-sm font-bold leading-tight h-8 mb-2">{p.name}</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">₹{p.price}</span>
                <button 
                  onClick={() => addToCart(p)}
                  className="px-4 py-1 border border-green-600 text-green-600 rounded-lg text-xs font-bold hover:bg-green-50"
                >
                  ADD
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- CHECKOUT BAR (Sticky Bottom) --- */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 bg-green-700 p-4 rounded-2xl flex justify-between items-center text-white shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold opacity-80">{cart.length} Item{cart.length > 1 ? 's' : ''}</span>
            <span className="font-bold">₹{cart.reduce((acc, curr) => acc + curr.price, 0)} + Tip</span>
          </div>
          <button className="flex items-center gap-2 font-bold uppercase text-sm">
            View Cart <ShoppingCart size={18} />
          </button>
        </div>
      )}
    </div>
  );
}