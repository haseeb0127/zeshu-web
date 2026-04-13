 'use client';
import MobileRecharge from '@/components/MobileRecharge';
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Wallet, User, Mic, Smartphone, Tv, Car, Lightbulb, Flame, Phone, ShieldCheck, Gamepad2, Grid, Plus, ShoppingCart, X } from 'lucide-react';

const GROCERY_PROFIT_MARGIN = 0.15;
const A1_USERNAME = '505811';
// Cleaned up the URL!
const API_URL = 'https://zeshu-backend-api.onrender.com';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(150);
  const [locationName, setLocationName] = useState('Jagtial, Telangana, India');
  const [activeCategory, setActiveCategory] = useState('All');

  // Math Logic (Identical to your mobile app)
  const itemsTotal = Object.values(cart).reduce((s: any, i: any) => s + (i.price * i.quantity), 0);
  const cartItemCount = Object.values(cart).reduce((s: any, i: any) => s + i.quantity, 0);
  const mrpTotal = Object.values(cart).reduce((s: any, i: any) => s + ((i.price + 33) * i.quantity), 0); 
  const totalSavings = itemsTotal > 0 ? mrpTotal - itemsTotal : 0;
  
  const deliveryCharge = itemsTotal >= 200 || itemsTotal === 0 ? 0 : 30;
  const smallCartFee = itemsTotal > 0 && itemsTotal < 100 ? 20 : 0;
  const handlingCharge = itemsTotal > 0 ? 5 : 0;
  const grandTotal = itemsTotal === 0 ? 0 : itemsTotal + deliveryCharge + smallCartFee + handlingCharge;
  const earnedCoinsGrocery = Math.floor((itemsTotal * GROCERY_PROFIT_MARGIN) * 0.60);

  useEffect(() => {
    // Mock Data for Web
    setProducts([
      { id: 1, name: "Vegetables & Fruits", price: 149, image_url: "https://cdn-icons-png.flaticon.com/512/3194/3194591.png", unit: "1 kg" },
      { id: 2, name: "Atta, Rice & Dal", price: 299, image_url: "https://cdn-icons-png.flaticon.com/512/5753/5753696.png", unit: "5 kg" },
      { id: 3, name: "Oil, Ghee & Masala", price: 180, image_url: "https://cdn-icons-png.flaticon.com/512/9944/9944111.png", unit: "1 L" },
      { id: 4, name: "Dairy, Bread & Eggs", price: 66, image_url: "https://cdn-icons-png.flaticon.com/512/869/869474.png", unit: "1 L" },
      { id: 5, name: "Cold Coffee", price: 50, image_url: "https://cdn-icons-png.flaticon.com/512/924/924514.png", unit: "250 ml" },
      { id: 6, name: "Power Bank 10000mAh", price: 899, image_url: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png", unit: "1 unit" }
    ] as any);
  }, []);

  const addToCart = (p: any) => setCart((prev: any) => ({ ...prev, [p.id]: prev[p.id] ? { ...p, quantity: prev[p.id].quantity + 1 } : { ...p, quantity: 1 } }));
  const removeFromCart = (p: any) => setCart((prev: any) => {
    const newCart = { ...prev };
    if (newCart[p.id].quantity > 1) newCart[p.id].quantity -= 1;
    else delete newCart[p.id];
    return newCart;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* 1. WEB HEADER (Blinkit Style Desktop/Mobile) */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-black text-pink-600 tracking-tighter cursor-pointer">Zeshu</h1>
            <div className="hidden md:flex flex-col border-l-2 border-gray-200 pl-6 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <span className="text-xs font-bold text-gray-800">Delivery in 22 minutes</span>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin size={14} className="mr-1 text-pink-600" />
                <span className="truncate max-w-[200px]">{locationName}</span>
              </div>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 bg-gray-100 rounded-xl items-center px-4 py-3 border border-gray-200 focus-within:border-pink-500 focus-within:bg-white transition-all">
            <Search size={20} className="text-gray-500" />
            <input type="text" placeholder='Search "power bank" or ask AI...' className="bg-transparent border-none outline-none w-full ml-3 text-sm" />
            <div className="w-[1px] h-5 bg-gray-300 mx-3"></div>
            <Mic size={20} className="text-gray-500 cursor-pointer hover:text-pink-600" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-900 text-white px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-800">
              <Wallet size={16} className="text-yellow-400 mr-2" />
              <span className="font-bold text-sm">₹{coinBalance}</span>
            </div>
            <User size={28} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>
      </header>

      {/* Search Bar (Mobile only) */}
      <div className="md:hidden bg-white p-4">
        <div className="flex bg-gray-100 rounded-xl items-center px-4 py-3 border border-gray-200">
            <Search size={20} className="text-gray-500" />
            <input type="text" placeholder='Search...' className="bg-transparent border-none outline-none w-full ml-3 text-sm" />
            <Mic size={20} className="text-gray-500" />
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 mt-6">
        
        {/* Categories */}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {['All', 'Summer', 'Electronics', 'Beauty', 'Pharmacy'].map(cat => (
            <div key={cat} onClick={() => setActiveCategory(cat)} className="flex flex-col items-center cursor-pointer group min-w-[70px]">
              <div className={`w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center transition-all ${activeCategory === cat ? 'border-2 border-pink-500' : 'group-hover:shadow-md'}`}>
                <Grid size={24} className={activeCategory === cat ? 'text-pink-600' : 'text-gray-600'} />
              </div>
              <span className={`text-xs mt-2 ${activeCategory === cat ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{cat}</span>
            </div>
          ))}
        </div>

{/* Bills & Recharges Web Layout */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bills & Recharges</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {/* ... your existing icon code ... */}
          </div>
        </div>

        {/* --- NEW: MOBILE RECHARGE WIDGET --- */}
        <div className="mt-8">
           <MobileRecharge />
        </div>

        {/* Groceries Grid */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Grocery & Kitchen</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center p-4">
                  <img src={item.image_url} alt={item.name} className="object-contain w-full h-full" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 h-10">{item.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.unit}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-gray-900">₹{item.price}</span>
                  <button onClick={() => addToCart(item)} className="bg-pink-50 text-pink-600 border border-pink-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-pink-100 transition-colors">
                    ADD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Web Cart Summary */}
      {cartItemCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
          <div onClick={() => setIsCartOpen(true)} className="bg-green-700 w-full max-w-screen-md rounded-xl p-4 flex items-center justify-between cursor-pointer shadow-2xl pointer-events-auto hover:bg-green-800 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold">{cartItemCount} items</p>
                <p className="text-green-100 text-xs">₹{itemsTotal} plus taxes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white font-bold">
              View Cart <ShoppingCart size={18} />
            </div>
          </div>
        </div>
      )}

      {/* Sliding Cart Side Panel (Web Standard for Blinkit/Swiggy) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
          <div className="bg-gray-50 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Cart Header */}
            <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">My Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} className="text-gray-600" /></button>
            </div>

            {/* Cart Items Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4">
              
              {/* Delivery Time Banner */}
              <div className="bg-white rounded-xl p-4 flex items-center gap-4 mb-4 shadow-sm border border-gray-100">
                <div className="bg-green-50 p-3 rounded-lg"><ShoppingCart size={24} className="text-green-700" /></div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Delivery in 22 minutes</h3>
                  <p className="text-sm text-gray-500">Shipment of {cartItemCount} items</p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                {Object.values(cart).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-pink-50 border border-pink-500 rounded-lg">
                        <button onClick={() => removeFromCart(item)} className="px-3 py-1 text-pink-600 font-bold hover:bg-pink-100 rounded-l-lg">-</button>
                        <span className="px-2 text-sm font-bold text-pink-600">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="px-3 py-1 text-pink-600 font-bold hover:bg-pink-100 rounded-r-lg">+</button>
                      </div>
                      <p className="font-bold text-gray-900 w-16 text-right">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 mb-4">Bill Details</h3>
                <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Items total</span><span>₹{itemsTotal}</span></div>
                <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Delivery charge</span><span className="text-green-600">FREE</span></div>
                {handlingCharge > 0 && <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Handling charge</span><span>₹{handlingCharge}</span></div>}
                {smallCartFee > 0 && <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Small cart fee</span><span>₹{smallCartFee}</span></div>}
                <div className="flex justify-between font-bold text-lg text-gray-900 mt-4 pt-4 border-t border-gray-100">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Checkout Footer */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <MapPin size={20} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-bold">Delivering to Home</p>
                  <p className="text-sm text-gray-800 truncate">{locationName}</p>
                </div>
              </div>
              <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg py-4 rounded-xl transition-colors shadow-lg">
                Proceed To Pay ₹{grandTotal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}