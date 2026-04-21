/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mic, MapPin, Search, Coins, User, ChevronRight, Zap, Smartphone, 
  Tv, HeartHandshake, Plus, Minus, ShoppingBag, X, LogOut, Ticket, QrCode,
  Droplets, Wifi, Car, Landmark, ShieldCheck, PhoneCall, Phone, Package, Flame, BadgeCheck,
  History, ChevronDown, CheckSquare, Square, Clock, CheckCircle, Menu, Info, AlertCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SERVICES = [
  { id: 'mobile', label: 'Prepaid', icon: <Smartphone size={28} strokeWidth={1.5}/>, color: 'bg-blue-50/80 text-blue-600 group-hover:bg-blue-600 group-hover:text-white', inputLabel: 'Mobile Number' },
  { id: 'electricity', label: 'Electricity', icon: <Zap size={28} strokeWidth={1.5}/>, color: 'bg-yellow-50/80 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white', inputLabel: 'Consumer Number' },
  { id: 'dth', label: 'DTH', icon: <Tv size={28} strokeWidth={1.5}/>, color: 'bg-orange-50/80 text-orange-600 group-hover:bg-orange-500 group-hover:text-white', inputLabel: 'DTH / VC Number' },
  { id: 'upi', label: 'UPI Tools', icon: <BadgeCheck size={28} strokeWidth={1.5}/>, color: 'bg-sky-50/80 text-sky-600 group-hover:bg-sky-500 group-hover:text-white', inputLabel: 'UPI ID or Mobile No.' },
  { id: 'fastag', label: 'FASTag', icon: <Car size={28} strokeWidth={1.5}/>, color: 'bg-emerald-50/80 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white', inputLabel: 'Vehicle Registration No.' },
  { id: 'gas', label: 'Piped Gas', icon: <Flame size={28} strokeWidth={1.5}/>, color: 'bg-red-50/80 text-red-600 group-hover:bg-red-500 group-hover:text-white', inputLabel: 'Consumer Number' },
  { id: 'water', label: 'Water Bill', icon: <Droplets size={28} strokeWidth={1.5}/>, color: 'bg-cyan-50/80 text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white', inputLabel: 'Account / Consumer No.' },
  { id: 'broadband', label: 'Broadband', icon: <Wifi size={28} strokeWidth={1.5}/>, color: 'bg-fuchsia-50/80 text-fuchsia-600 group-hover:bg-fuchsia-500 group-hover:text-white', inputLabel: 'Subscriber / User ID' },
];

const OPERATORS_DATA: any = {
  mobile: { 'JIO': '11', 'Airtel': '2', 'Vodafone': '23', 'Idea': '6', 'BSNL': '4' },
  electricity: { 'TSSPDCL - Telangana Southern': '474', 'TSNPDCL - Telangana Northern': '475', 'Adani Electricity - MUMBAI': '50', 'Tata Power': '116', 'B.E.S.T Mumbai': '495', 'BSES Rajdhani': '449' },
};

const BANNERS = [
  "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1440/layout-engine/2022-05/Group-33704.jpg",
  "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1440/layout-engine/2022-05/Group-33703.jpg",
];

export default function ZeshuSuperApp() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [activeService, setActiveService] = useState('mobile');
  const [products, setProducts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [cart, setCart] = useState<{item: any, qty: number}[]>([]);
  const [user, setUser] = useState<any>(null);
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All'); 
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [useZeshuCoins, setUseZeshuCoins] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Fetching precise location...');
  const [isDetectingLoc, setIsDetectingLoc] = useState(true);
  
  const [rechargeNumber, setRechargeNumber] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [fetchedBill, setFetchedBill] = useState<any>(null);
  const [upiResult, setUpiResult] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedPlanCategory, setSelectedPlanCategory] = useState("All");
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const currentServiceObj = SERVICES.find(s => s.id === activeService) || SERVICES[0];
  const isPlanBased = activeService === 'mobile' || activeService === 'dth'; 

  const ZESHU_COINS_VAL = 50;
  const HANDLING_FEE = 5;

  const productCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'General'));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || (p.category || 'General') === activeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    
    const fetchProducts = async () => {
      const cachedProducts = localStorage.getItem('zeshu_products');
      if (cachedProducts) setProducts(JSON.parse(cachedProducts));
      const { data, error } = await supabase.from('products').select('*');
      if (data) { setProducts(data); localStorage.setItem('zeshu_products', JSON.stringify(data)); }
    };

    fetchProducts();
    checkUser();
    
    setTimeout(() => { setCurrentAddress('HotelRoom 205, 2nd floor Shree Amardeep...'); setIsDetectingLoc(false); }, 1500);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchMyOrders = async () => {
        const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
        if (data) setMyOrders(data);
      };
      fetchMyOrders();
      const orderChannel = supabase.channel('customer-orders').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => { setMyOrders([payload.new]); }).subscribe();
      return () => { supabase.removeChannel(orderChannel); };
    }
  }, [user]);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };

  const handleAutoDetectLocation = () => {
    setIsDetectingLoc(true);
    setCurrentAddress('Locating securely...');
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setTimeout(() => { setCurrentAddress("Current GPS Location Synced"); setIsDetectingLoc(false); showToast("Location updated!"); }, 1000); },
        () => { alert("Location access denied."); setIsDetectingLoc(false); setCurrentAddress('HotelRoom 205, 2nd floor...'); }
      );
    } else { setIsDetectingLoc(false); }
  };

  useEffect(() => {
    if (rechargeNumber.length === 10 && activeService === 'mobile') { autoDetectAndFetchPlans(rechargeNumber); }
    setFetchedBill(null); setUpiResult(null);
  }, [rechargeNumber, activeService]);

  const planCategories = useMemo(() => {
    if (!plans || plans.length === 0) return ["All"];
    return ["All", ...Array.from(new Set(plans.map((p: any) => p.categoryName).filter(Boolean)))];
  }, [plans]);

  const filteredPlans = useMemo(() => {
    if (selectedPlanCategory === "All") return plans;
    return plans.filter((p: any) => p.categoryName === selectedPlanCategory);
  }, [plans, selectedPlanCategory]);

  const autoDetectAndFetchPlans = async (num: string) => {
    setIsDetecting(true); setPlans([]);
    try {
      const opRes = await fetch(`/api/fetch-operator?number=${num}`);
      const opText = await opRes.text();
      let opData: any = {};
      try { opData = JSON.parse(opText); } catch(e) {}
      if (opData && opData.operator) {
        const foundOpKey = Object.keys(OPERATORS_DATA['mobile'] || {}).find(k => k.toLowerCase() === opData.operator.toLowerCase() || k.toLowerCase().includes(opData.operator.toLowerCase()));
        const finalOperator = foundOpKey || opData.operator;
        setSelectedOperator(finalOperator); 
        const opCode = OPERATORS_DATA['mobile'][finalOperator];
        if (opCode) {
          const planRes = await fetch(`/api/fetch-plans?number=${num}&operator=${opCode}`);
          const planText = await planRes.text();
          try { const planData = JSON.parse(planText); if(planData.plans) { setPlans(planData.plans); setSelectedPlanCategory("All"); } } catch(e) {}
        }
      }
    } catch (err) {}
    setIsDetecting(false);
  };

  const checkUser = async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) { setUser(session.user); fetchCoinBalance(session.user.id); } };
  const fetchCoinBalance = async (userId: string) => { const { data } = await supabase.from('wallets').select('coins').eq('user_id', userId).single(); if (data) setCoinsBalance(data.coins); };
  const handleSendOtp = async () => { setIsLoading(true); const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phoneNumber}` }); setIsLoading(false); if (!error) setOtpSent(true); else alert(error.message); };
  const handleVerifyOtp = async () => { setIsLoading(true); const { data, error } = await supabase.auth.verifyOtp({ phone: `+91${phoneNumber}`, token: otp, type: 'sms' }); setIsLoading(false); if (data.session) { setUser(data.session.user); setIsAuthModalOpen(false); fetchCoinBalance(data.session.user.id); showToast("Welcome back!"); } else alert(error?.message); };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setCoinsBalance(0); setIsAccountOpen(false); showToast("Logged out securely."); };
  
  const addToCart = (product: any) => {
    setCart(prev => { 
      const existing = prev.find(c => c.item.id === product.id); 
      return existing ? prev.map(c => c.item.id === product.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { item: product, qty: 1 }]; 
    });
    showToast(`${product.name} added to cart`);
  };
  
  const removeFromCart = (productId: any) => { 
    setCart(prev => { 
      const existing = prev.find(c => c.item.id === productId); 
      if (existing && existing.qty > 1) { return prev.map(c => c.item.id === productId ? { ...c, qty: c.qty - 1 } : c); } 
      else { const newCart = prev.filter(c => c.item.id !== productId); if (newCart.length === 0) setIsCartOpen(false); return newCart; } 
    }); 
  };

  const itemTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
  const smallCartFee = (itemTotal > 0 && itemTotal < 100) ? 20 : 0;
  const deliveryCharge = (itemTotal > 0 && itemTotal < 200) ? 30 : 0; 
  const zeshuDiscount = useZeshuCoins ? Math.min(ZESHU_COINS_VAL, itemTotal) : 0; 
  const finalCartTotal = itemTotal > 0 ? (itemTotal + deliveryCharge + smallCartFee + HANDLING_FEE - zeshuDiscount) : 0;

  const handleCartCheckout = async () => {
    if (finalCartTotal === 0) return;
    if (!user) return setIsAuthModalOpen(true);
    setIsLoading(true);
    try {
      const orderResponse = await fetch('/api/create-razorpay-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: finalCartTotal }) });
      const orderData = await orderResponse.json();
      const orderId = orderData.id || (orderData.order && orderData.order.id);
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: orderData.amount || (finalCartTotal * 100), currency: orderData.currency || 'INR', name: "Zeshu Super App", order_id: orderId,
        handler: async function (response: any) { 
          try { await fetch('/api/confirm-grocery-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, cartItems: cart, totalAmount: finalCartTotal, paymentId: response.razorpay_payment_id, address: currentAddress }) }); } catch(e) { console.error(e) }
          showToast("Payment Successful! Order placed."); 
          setCart([]); setIsCartOpen(false); 
        },
        theme: { color: "#9333ea" },
      };
      const rzp = new (window as any).Razorpay(options); rzp.open();
    } catch (error) { alert("Gateway Error"); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-sans antialiased text-gray-900 overflow-x-hidden selection:bg-purple-200 selection:text-purple-900">
      
      {/* --- LIVE TOAST NOTIFICATION --- */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${toastMessage ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
        <div className="bg-gray-900/95 backdrop-blur-xl text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-center gap-2.5 border border-white/10">
          <CheckCircle size={18} className="text-[#00FF7F]"/>
          {toastMessage}
        </div>
      </div>

      {/* --- WORLD CLASS STICKY HEADER --- */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-2xl shadow-[0_4px_30px_-10px_rgba(0,0,0,0.05)] border-b border-gray-100/50' : 'bg-white border-b border-gray-100/80'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-[88px] flex items-center justify-between gap-4 md:gap-8">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer border-r border-gray-200/60 pr-6 active:scale-[0.97] transition-transform" onClick={() => setActiveTab('home')}>
              <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white font-black p-2.5 rounded-2xl text-2xl tracking-tighter shadow-[0_8px_20px_-6px_rgba(147,51,234,0.4)]">Z</div>
              <div className="hidden md:flex flex-col">
                <span className="text-[22px] font-black tracking-tighter leading-none text-gray-900">ZESHU</span>
                <span className="text-[10px] font-extrabold text-purple-600 tracking-[0.2em] uppercase mt-0.5">Super App</span>
              </div>
            </div>
            
            <div className="hidden md:flex flex-col cursor-pointer max-w-[220px] group active:scale-[0.97] transition-transform" onClick={handleAutoDetectLocation}>
              <div className="font-black text-[15px] text-gray-900 flex items-center gap-1.5 tracking-tight">
                Delivery in 12 min <Zap size={14} className="text-yellow-500 fill-yellow-500 drop-shadow-sm"/>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-0.5 font-medium">
                {isDetectingLoc ? <div className="h-1.5 w-20 bg-gray-200 animate-pulse rounded-full"></div> : <span className="truncate">{currentAddress}</span>}
                <ChevronDown size={14} className="ml-1 group-hover:text-gray-900 group-hover:translate-y-0.5 transition-all"/>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-3xl">
            <div className="bg-[#f1f3f5] hover:bg-[#e9ecef] transition-all duration-300 rounded-[20px] flex items-center px-5 py-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:shadow-[0_8px_30px_-10px_rgba(147,51,234,0.15)]">
              <Search size={22} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search 'milk', 'recharge', 'chips'..." 
                className="bg-transparent border-none outline-none flex-1 ml-3 text-[16px] font-medium text-gray-800 placeholder-gray-400" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors active:scale-90"><X size={14} className="text-gray-600"/></button>}
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <button onClick={() => user ? setIsAccountOpen(true) : setIsAuthModalOpen(true)} className="hidden md:flex items-center gap-2.5 text-gray-600 hover:text-gray-900 font-extrabold px-4 py-2.5 rounded-2xl hover:bg-gray-50 transition-colors active:scale-95 text-sm">
              <User size={20} className={user ? "text-purple-600" : ""}/>
              {user ? 'Account' : 'Login'}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="bg-gradient-to-b from-[#0c831f] to-[#0a6d1a] hover:from-[#0a6d1a] hover:to-[#085a15] transition-all text-white px-5 py-3.5 rounded-[20px] flex items-center gap-3 shadow-[0_8px_20px_-6px_rgba(12,131,31,0.4)] font-bold text-sm min-w-[120px] justify-center active:scale-[0.96]">
              <ShoppingBag size={22} className="drop-shadow-sm"/>
              {cart.length > 0 ? (
                <div className="flex flex-col text-left leading-none justify-center">
                  <span className="text-[10px] font-extrabold text-green-100 uppercase tracking-wider mb-0.5">{cart.length} items</span>
                  <span className="text-[15px] font-black tracking-tight">₹{finalCartTotal}</span>
                </div>
              ) : <span className="text-[15px] font-black tracking-tight">My Cart</span>}
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-[1400px] mx-auto w-full md:px-8 py-8 pt-[120px] flex gap-8">
        
        {/* DESKTOP SIDEBAR */}
        {activeTab === 'home' && searchQuery === '' && (
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pr-4">
            <h3 className="font-black text-gray-900 mb-5 px-3 tracking-tight text-lg">Categories</h3>
            <div className="flex flex-col gap-1.5">
              {productCategories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`text-left px-4 py-3.5 rounded-[18px] font-extrabold text-sm transition-all duration-300 flex items-center justify-between group active:scale-[0.97] ${activeCategory === cat ? 'bg-purple-50 text-purple-700 shadow-[inset_4px_0_0_0_#9333ea]' : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-transparent hover:border-gray-200/60'}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${activeCategory === cat ? 'bg-purple-200/50 shadow-inner' : 'bg-gray-100/80 group-hover:bg-purple-50'}`}>
                       <Package size={16} className={activeCategory === cat ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500'}/>
                    </div>
                    <span className="tracking-tight">{cat}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0 pb-32">
          
          {/* HOME TAB: BANNERS & CATEGORIES */}
          {activeTab === 'home' && searchQuery === '' && (
            <div className="mb-12 space-y-10 animate-in fade-in duration-700">
              
              {/* Hero Banners */}
              <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 px-4 md:px-0 snap-x">
                {BANNERS.map((img, idx) => (
                  <img key={idx} src={img} alt="Promo" className="h-[180px] md:h-[240px] rounded-[28px] object-cover min-w-[320px] md:min-w-[480px] cursor-pointer shadow-[0_8px_20px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1.5 transition-all duration-400 snap-center border border-gray-100/50" />
                ))}
              </div>

              {/* Ultra-Premium Services Grid */}
              <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.04)] border border-gray-100/80 mx-4 md:mx-0">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Utility & Recharges</h2>
                  <span className="text-purple-600 font-extrabold text-sm cursor-pointer hover:bg-purple-100 bg-purple-50 px-4 py-2 rounded-xl active:scale-95 transition-all">Explore All</span>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-y-10 gap-x-4">
                  {SERVICES.slice(0, 8).map((s) => (
                    <div key={s.id} onClick={() => { setActiveTab('recharge'); setActiveService(s.id); }} className="flex flex-col items-center gap-3.5 cursor-pointer group active:scale-95 transition-transform">
                      <div className={`h-[76px] w-[76px] rounded-[24px] flex items-center justify-center transition-all duration-400 group-hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] group-hover:-translate-y-1 border border-transparent ${s.color}`}>
                        {s.icon}
                      </div>
                      <span className="text-[12px] font-black text-gray-500 text-center leading-tight group-hover:text-gray-900 transition-colors tracking-tight">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS SECTION (OR SEARCH) */}
          {activeTab === 'home' && (
            <div className="px-4 md:px-0">
              <div className="flex justify-between items-end mb-8 border-b border-gray-200/60 pb-5">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{searchQuery ? `Search results for "${searchQuery}"` : activeCategory === 'All' ? 'Bestsellers' : activeCategory}</h2>
                <span className="text-gray-500 font-bold text-sm bg-gray-100/80 px-3.5 py-1.5 rounded-xl">{filteredProducts.length} items</span>
              </div>
              
              {products.length === 0 && searchQuery === '' ? (
                <div className="flex justify-center py-32"><div className="animate-spin h-12 w-12 border-4 border-[#0c831f] border-t-transparent rounded-full shadow-lg"></div></div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-gray-200 text-center flex flex-col items-center justify-center gap-5">
                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-2"><Search size={40} className="text-gray-300"/></div>
                   <h3 className="text-gray-900 font-black text-2xl tracking-tight">No exact matches found</h3>
                   <p className="text-gray-500 font-medium">Try searching for something else or check your spelling.</p>
                   <button onClick={() => setSearchQuery('')} className="mt-4 bg-purple-50 text-purple-700 font-bold px-6 py-3 rounded-xl hover:bg-purple-100 transition-colors active:scale-95">Clear Search</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                  {filteredProducts.map((p) => {
                    const inCart = cart.find(c => c.item.id === p.id);
                    return (
                      <div key={p.id} className="bg-white p-4 rounded-[28px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-purple-100 hover:-translate-y-1.5 transition-all duration-400 group relative">
                        
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm z-10 flex items-center gap-1.5 border border-gray-50">
                          <Clock size={10} className="text-purple-600"/>
                          <span className="text-[10px] font-black text-gray-800 tracking-tight">12 MINS</span>
                        </div>
                        
                        <div className="bg-[#f8f9fa] rounded-[20px] mb-4 flex items-center justify-center p-5 aspect-square relative overflow-hidden group-hover:bg-[#f1f3f5] transition-colors">
                          <img src={p.image_url} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out" alt={p.name} />
                        </div>
                        
                        <div className="text-[11px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">{p.category || 'General'}</div>
                        <div className="text-[15px] font-bold text-gray-800 line-clamp-2 min-h-[44px] mb-1.5 leading-snug tracking-tight group-hover:text-purple-700 transition-colors">{p.name}</div>
                        <div className="text-[13px] text-gray-500 mb-5 font-semibold">{p.weight || '1 unit'}</div>
                        
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50/80">
                          <span className="font-black text-lg text-gray-900 tracking-tight">₹{p.price}</span>
                          {inCart ? (
                            <div className="flex items-center bg-[#0c831f] text-white rounded-[14px] shadow-[0_4px_10px_-4px_rgba(12,131,31,0.5)] min-w-[84px] justify-between overflow-hidden transition-all h-[36px]">
                              <button onClick={() => removeFromCart(p.id)} className="flex-1 h-full flex items-center justify-center font-black active:bg-black/20 transition-colors">-</button>
                              <span className="font-black text-sm px-1">{inCart.qty}</span>
                              <button onClick={() => addToCart(p)} className="flex-1 h-full flex items-center justify-center font-black active:bg-black/20 transition-colors">+</button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(p)} className="px-6 h-[36px] border border-[#0c831f] text-[#0c831f] bg-green-50/30 hover:bg-green-50 rounded-[14px] text-[13px] font-black transition-colors active:scale-95 shadow-sm min-w-[84px]">ADD</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* --- WORLD-CLASS CART DRAWER --- */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] transition-opacity animate-in fade-in duration-400" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full md:w-[440px] bg-[#f8f9fa] z-[70] shadow-[0_0_60px_rgba(0,0,0,0.2)] animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col">
            
            <div className="bg-white px-6 py-5 flex justify-between items-center shadow-sm z-10 border-b border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter">My Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2.5 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors active:scale-90"><X size={20} className="text-gray-600"/></button>
            </div>

            {cart.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500 delay-100">
                 <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-sm mb-8 border border-gray-100 relative">
                   <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-20"></div>
                   <ShoppingBag size={64} className="text-gray-300"/>
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Your cart is empty</h3>
                 <p className="text-base text-gray-500 font-medium px-4">Looks like you haven't added anything to your cart yet.</p>
                 <button onClick={() => setIsCartOpen(false)} className="mt-10 bg-gray-900 hover:bg-black transition-all active:scale-95 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-gray-900/20 tracking-wide">Start Shopping</button>
               </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                  
                  <div className="bg-white p-5 rounded-[24px] flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-blue-50 p-4 rounded-2xl"><Clock className="text-blue-600" size={26}/></div>
                    <div>
                      <div className="font-black text-gray-900 text-lg tracking-tight">Delivery in 12 minutes</div>
                      <div className="text-sm text-gray-500 font-bold mt-0.5">Shipment of {cart.length} item{cart.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-6 duration-500 delay-75">
                    {cart.map((c, i) => (
                      <div key={i} className="p-5 flex gap-5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <div className="w-[80px] h-[80px] bg-[#f8f9fa] rounded-2xl flex items-center justify-center p-2 border border-gray-100 shrink-0">
                          <img src={c.item.image_url} className="w-full h-full object-contain mix-blend-multiply" alt={c.item.name}/>
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div className="text-[15px] font-bold text-gray-800 leading-snug line-clamp-2 tracking-tight">{c.item.name}</div>
                          <div className="text-xs font-bold text-gray-400">{c.item.weight || c.item.unit}</div>
                          <div className="flex justify-between items-center mt-3">
                            <span className="font-black text-lg text-gray-900 tracking-tight">₹{c.item.price * c.qty}</span>
                            <div className="flex items-center bg-[#0c831f] text-white rounded-xl shadow-md border border-[#0a6d1a] h-[32px]">
                              <button onClick={() => removeFromCart(c.item.id)} className="px-3 h-full font-black active:bg-black/20 rounded-l-xl transition-colors">-</button>
                              <span className="font-bold text-sm px-2">{c.qty}</span>
                              <button onClick={() => addToCart(c.item)} className="px-3 h-full font-black active:bg-black/20 rounded-r-xl transition-colors">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 animate-in slide-in-from-bottom-8 duration-500 delay-150">
                    <h3 className="font-black text-gray-900 mb-5 text-lg tracking-tight">Bill Details</h3>
                    <div className="space-y-4 text-[15px]">
                      <div className="flex justify-between text-gray-600 font-medium"><span className="flex items-center gap-2.5"><Square size={16} className="text-gray-400"/> Items total</span><span className="font-bold text-gray-900">₹{itemTotal}</span></div>
                      <div className="flex justify-between text-gray-600 font-medium"><span className="flex items-center gap-2.5"><Car size={16} className="text-gray-400"/> Delivery charge</span><span className="text-[#0c831f] font-black">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
                      <div className="flex justify-between text-gray-600 font-medium"><span className="flex items-center gap-2.5"><Info size={16} className="text-gray-400"/> Handling fee</span><span className="font-bold text-gray-900">₹{HANDLING_FEE}</span></div>
                      
                      <div className="border-t border-dashed border-gray-200 pt-5 mt-5 flex justify-between items-center">
                        <span className="font-black text-gray-900 text-xl tracking-tight">Grand total</span>
                        <span className="font-black text-gray-900 text-2xl tracking-tighter">₹{finalCartTotal}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-10"></div>
                </div>

                <div className="bg-white p-6 border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] z-10">
                  <div className="flex items-center gap-4 mb-4 bg-[#f8f9fa] p-4 rounded-2xl border border-gray-100">
                    <div className="bg-green-100 p-2 rounded-full"><MapPin className="text-[#0c831f]" size={20}/></div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Delivering to</div>
                      <div className="text-[15px] font-extrabold text-gray-900 truncate mt-0.5">{currentAddress}</div>
                    </div>
                  </div>
                  <button onClick={handleCartCheckout} className="w-full bg-gradient-to-r from-[#0c831f] to-[#0a6d1a] hover:to-[#085a15] transition-all text-white font-bold py-4 rounded-2xl flex justify-between px-6 items-center active:scale-[0.98] shadow-[0_8px_20px_-6px_rgba(12,131,31,0.4)]">
                    <div className="flex flex-col text-left">
                      <span className="text-xl font-black tracking-tighter leading-none">₹{finalCartTotal}</span>
                      <span className="text-[10px] uppercase tracking-widest opacity-90 font-bold mt-1.5">Total</span>
                    </div>
                    <span className="flex items-center gap-2 text-lg font-black tracking-tight">Proceed to Pay <ChevronRight size={20} strokeWidth={3}/></span>
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* --- AUTH MODAL --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-5 right-5 p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors active:scale-90"><X size={20} /></button>
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-purple-100"><Smartphone size={36} className="text-purple-600 stroke-[1.5]"/></div>
            <h2 className="text-2xl font-black mb-2 text-center text-gray-900 tracking-tight">Sign In</h2>
            <p className="text-center text-sm text-gray-500 mb-8 font-medium">To securely access your Zeshu account</p>
            {!otpSent ? (
              <div className="space-y-4">
                <div className="relative">
                   <span className="absolute left-4 top-4 font-bold text-gray-400 border-r border-gray-200 pr-3">+91</span>
                   <input type="tel" maxLength={10} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-4 pl-16 bg-[#f8f9fa] border border-gray-200/60 rounded-2xl font-bold text-lg focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all shadow-inner" placeholder="Enter Mobile Number" />
                </div>
                <button onClick={handleSendOtp} disabled={isLoading} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-gray-900/20 tracking-wide text-lg">{isLoading ? 'Sending OTP...' : 'Continue'}</button>
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-right-8 duration-400 ease-out">
                <input type="number" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-[#f8f9fa] border border-gray-200/60 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.5em] focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all shadow-inner" placeholder="------" />
                <button onClick={handleVerifyOtp} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_8px_20px_-6px_rgba(147,51,234,0.4)] tracking-wide text-lg">{isLoading ? 'Verifying...' : 'Verify OTP'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}