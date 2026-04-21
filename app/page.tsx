/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Script from 'next/script';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mic, MapPin, Search, Coins, User, ChevronRight, Zap, Smartphone, 
  Tv, HeartHandshake, Plus, Minus, ShoppingBag, X, LogOut, Ticket, QrCode,
  Droplets, Wifi, Car, Landmark, ShieldCheck, PhoneCall, Phone, Package, Flame, BadgeCheck,
  History, ChevronDown, CheckSquare, Square, Clock, CheckCircle, Menu, Info, AlertCircle, BookUser
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 🎨 WORLD-CLASS COLOR PALETTE APPLIED TO SERVICES ---
const SERVICES = [
  { id: 'mobile', label: 'Prepaid', icon: <Smartphone size={28} strokeWidth={1.5}/>, color: 'bg-[#EEF2FF] text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white', inputLabel: 'Mobile Number' },
  { id: 'electricity', label: 'Electricity', icon: <Zap size={28} strokeWidth={1.5}/>, color: 'bg-[#FEF3C7] text-[#D97706] group-hover:bg-[#F59E0B] group-hover:text-white', inputLabel: 'Consumer Number' },
  { id: 'dth', label: 'DTH', icon: <Tv size={28} strokeWidth={1.5}/>, color: 'bg-[#FFEDD5] text-[#EA580C] group-hover:bg-[#F97316] group-hover:text-white', inputLabel: 'DTH / VC Number' },
  { id: 'upi', label: 'UPI Tools', icon: <BadgeCheck size={28} strokeWidth={1.5}/>, color: 'bg-[#E0F2FE] text-[#0284C7] group-hover:bg-[#0EA5E9] group-hover:text-white', inputLabel: 'UPI ID or Mobile No.' },
  { id: 'pharmacy', label: 'Pharmacy', icon: <HeartHandshake size={28} strokeWidth={1.5}/>, color: 'bg-[#ECFDF5] text-[#059669] group-hover:bg-[#059669] group-hover:text-white', inputLabel: 'Search Medicines (e.g. Dolo 650)' }, // 🚀 PHARMACY ADDED
  { id: 'fastag', label: 'FASTag', icon: <Car size={28} strokeWidth={1.5}/>, color: 'bg-[#D1FAE5] text-[#059669] group-hover:bg-[#10B981] group-hover:text-white', inputLabel: 'Vehicle Registration No.' },
  { id: 'lpg', label: 'Gas Booking', icon: <Package size={28} strokeWidth={1.5}/>, color: 'bg-[#FFE4E6] text-[#E11D48] group-hover:bg-[#E11D48] group-hover:text-white', inputLabel: 'Consumer Number / ID' },
  { id: 'gas', label: 'Piped Gas', icon: <Flame size={28} strokeWidth={1.5}/>, color: 'bg-[#FEE2E2] text-[#DC2626] group-hover:bg-[#EF4444] group-hover:text-white', inputLabel: 'Consumer Number' },
  { id: 'water', label: 'Water Bill', icon: <Droplets size={28} strokeWidth={1.5}/>, color: 'bg-[#CFFAFE] text-[#0891B2] group-hover:bg-[#06B6D4] group-hover:text-white', inputLabel: 'Account / Consumer No.' },
  { id: 'broadband', label: 'Broadband', icon: <Wifi size={28} strokeWidth={1.5}/>, color: 'bg-[#FAE8FF] text-[#C026D3] group-hover:bg-[#D946EF] group-hover:text-white', inputLabel: 'Subscriber / User ID' },
];

const OPERATORS_DATA: any = {
  mobile: { 'JIO': '11', 'Airtel': '2', 'Vodafone': '23', 'Idea': '6', 'BSNL': '4' },
  electricity: { 'TSSPDCL': '474', 'TSNPDCL': '475', 'Adani Electricity': '50', 'Tata Power': '116', 'BSES Rajdhani': '449' },
  lpg: { 'Bharat Gas': '214', 'HP Gas': '215', 'Indane Gas': '216' },
  gas: { 'MAHANAGAR GAS': '62', 'INDRAPRASTHA GAS': '63', 'GUJARAT GAS': '64', 'Adani Gas': '154' },
};

const FALLBACK_BANNERS = [
  "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1440/layout-engine/2022-05/Group-33704.jpg",
  "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1440/layout-engine/2022-05/Group-33703.jpg",
];

export default function ZeshuSuperApp() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [activeService, setActiveService] = useState('mobile');
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<string[]>(FALLBACK_BANNERS);
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
  const [isCoinHistoryOpen, setIsCoinHistoryOpen] = useState(false);
  const [useZeshuCoins, setUseZeshuCoins] = useState(false);
  const [tipAmount, setTipAmount] = useState(20); 
  const [isDonating, setIsDonating] = useState(true); 
  
  const [currentAddress, setCurrentAddress] = useState('Fetching precise location...');
  const [isDetectingLoc, setIsDetectingLoc] = useState(true);
  
  const [rechargeNumber, setRechargeNumber] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [fetchedBill, setFetchedBill] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedPlanCategory, setSelectedPlanCategory] = useState("All");

  // 🚀 MEDPAY / PHARMACY STATES
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [medResults, setMedResults] = useState<any>(null);
  
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
    const fetchAppContent = async () => {
      const cachedProducts = localStorage.getItem('zeshu_products');
      if (cachedProducts) setProducts(JSON.parse(cachedProducts));
      const { data: pData } = await supabase.from('products').select('*');
      if (pData) { setProducts(pData); localStorage.setItem('zeshu_products', JSON.stringify(pData)); }
      
      const { data: bData } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
      if (bData && bData.length > 0) { setBanners(bData.map((b: any) => b.image_url)); }
    };
    
    fetchAppContent();
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
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setTimeout(() => { setCurrentAddress("Current GPS Location Synced"); setIsDetectingLoc(false); showToast("Location updated!"); }, 1000); },
        () => { alert("Location access denied."); setIsDetectingLoc(false); }
      );
    } else { setIsDetectingLoc(false); }
  };

  const handleContactPicker = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const contacts: any = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts.length > 0 && contacts[0].tel && contacts[0].tel.length > 0) {
          const phone = contacts[0].tel[0].replace(/\D/g, '').slice(-10);
          setRechargeNumber(phone);
          showToast(`Selected contact: ${contacts[0].name || phone}`);
        }
      } catch (ex) {
        showToast("Contact selection cancelled.");
      }
    } else {
      showToast("Contact Search is only supported on Android Chrome Mobile.");
    }
  };

  // 🚀 MEDPAY WATERFALL SEARCH FUNCTION
  const handleMedicineSearch = async () => {
    if (!medSearchQuery) return;
    setIsLoading(true);
    setMedResults(null);
    try {
      // Using Jagtial Coordinates for the demo
      const res = await fetch(`/api/med-search?q=${medSearchQuery}&lat=18.7989&lng=78.9117`);
      const data = await res.json();
      
      if (data.success) {
        setMedResults(data);
      } else {
        showToast(data.message || "Failed to search medical network.");
      }
    } catch (err) {
      showToast("Failed to search medical network.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (rechargeNumber.length === 10 && activeService === 'mobile') { autoDetectAndFetchPlans(rechargeNumber); }
    setFetchedBill(null);
  }, [rechargeNumber, activeService]);

  const autoDetectAndFetchPlans = async (num: string) => {
    setIsDetecting(true); setPlans([]);
    try {
      const opRes = await fetch(`/api/fetch-operator?number=${num}&service=${activeService}`);
      const opData = await opRes.json();
      if (opData && opData.success && opData.operator) {
        const opNameFromAPI = opData.operator.toLowerCase();
        const foundOpKey = Object.keys(OPERATORS_DATA['mobile']).find(k => opNameFromAPI.includes(k.toLowerCase()) || k.toLowerCase().includes(opNameFromAPI));
        const finalOperator = foundOpKey || opData.operator;
        setSelectedOperator(finalOperator); 
        const opCode = OPERATORS_DATA['mobile'][finalOperator];
        if (opCode) {
          const planRes = await fetch(`/api/fetch-plans?number=${num}&operator=${opCode}&service=${activeService}`);
          const planData = await planRes.json();
          if(planData.plans && planData.plans.length > 0) { setPlans(planData.plans); setSelectedPlanCategory("All"); showToast(`Auto-detected ${finalOperator}`); }
        }
      }
    } catch (err) {}
    setIsDetecting(false);
  };

  const fetchOffers = async () => {
    if (!rechargeNumber || !selectedOperator) return alert(`Enter details`);
    setIsLoading(true);
    try {
      const opCode = OPERATORS_DATA[activeService][selectedOperator];
      const res = await fetch(`/api/fetch-plans?number=${rechargeNumber}&operator=${opCode}&service=${activeService}`);
      const data = await res.json();
      if (data && data.plans) { setPlans(data.plans); setSelectedPlanCategory("All"); } 
    } catch (err) {}
    setIsLoading(false);
  };

  const fetchBillDetails = async () => {
    if (!rechargeNumber || !selectedOperator) return alert(`Enter details`);
    setIsLoading(true); setFetchedBill(null);
    try {
      const opCode = OPERATORS_DATA[activeService][selectedOperator];
      const res = await fetch(`/api/fetch-bill?service=${activeService}&number=${rechargeNumber}&operatorCode=${opCode}`);
      const data = await res.json();
      if (data.success && data.bill) { setFetchedBill(data.bill); setRechargeAmount(data.bill.DueAmount); showToast("Bill Details Fetched!"); } 
    } catch (err) {}
    setIsLoading(false);
  };

  const checkUser = async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) { setUser(session.user); fetchCoinBalance(session.user.id); } };
  const fetchCoinBalance = async (userId: string) => { const { data } = await supabase.from('wallets').select('coins').eq('user_id', userId).single(); if (data) setCoinsBalance(data.coins); };
  const handleSendOtp = async () => { setIsLoading(true); const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phoneNumber}` }); setIsLoading(false); if (!error) setOtpSent(true); else alert(error.message); };
  const handleVerifyOtp = async () => { setIsLoading(true); const { data, error } = await supabase.auth.verifyOtp({ phone: `+91${phoneNumber}`, token: otp, type: 'sms' }); setIsLoading(false); if (data.session) { setUser(data.session.user); setIsAuthModalOpen(false); fetchCoinBalance(data.session.user.id); showToast("Welcome back!"); } else alert(error?.message); };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setCoinsBalance(0); setIsAccountOpen(false); showToast("Logged out."); };
  
  const addToCart = (product: any) => { setCart(prev => { const existing = prev.find(c => c.item.id === product.id); return existing ? prev.map(c => c.item.id === product.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { item: product, qty: 1 }]; }); showToast(`${product.name} added`); };
  const removeFromCart = (productId: any) => { setCart(prev => { const existing = prev.find(c => c.item.id === productId); if (existing && existing.qty > 1) { return prev.map(c => c.item.id === productId ? { ...c, qty: c.qty - 1 } : c); } else { const newCart = prev.filter(c => c.item.id !== productId); if (newCart.length === 0) setIsCartOpen(false); return newCart; } }); };

  const itemTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
  const smallCartFee = (itemTotal > 0 && itemTotal < 100) ? 20 : 0;
  const deliveryCharge = (itemTotal > 0 && itemTotal < 200) ? 30 : 0; 
  const donationAmt = isDonating ? 1 : 0;
  const zeshuDiscount = useZeshuCoins ? Math.min(ZESHU_COINS_VAL, itemTotal) : 0; 
  const finalCartTotal = itemTotal > 0 ? (itemTotal + deliveryCharge + smallCartFee + HANDLING_FEE + donationAmt + tipAmount - zeshuDiscount) : 0;

  const handleCartCheckout = async () => {
    if (finalCartTotal === 0) return;
    if (!user) return setIsAuthModalOpen(true);
    setIsLoading(true);
    try {
      const orderResponse = await fetch('/api/create-razorpay-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: finalCartTotal }) });
      const orderData = await orderResponse.json();
      const orderId = orderData.id || orderData.order?.id;
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: orderData.amount || (finalCartTotal * 100), currency: orderData.currency || 'INR', name: "Zeshu Super App", order_id: orderId,
        handler: async function (response: any) { 
          await fetch('/api/confirm-grocery-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, cartItems: cart, totalAmount: finalCartTotal, paymentId: response.razorpay_payment_id, address: currentAddress }) });
          showToast("Order placed!"); setCart([]); setIsCartOpen(false); 
        },
        theme: { color: "#4F46E5" },
      };
      const rzp = new (window as any).Razorpay(options); rzp.open();
    } catch (error) { alert("Gateway Error"); }
    setIsLoading(false);
  };

  const handleUpiSearch = async () => {
    // UPI search logic
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans antialiased text-[#111827] overflow-x-hidden">
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ${toastMessage ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
        <div className="bg-[#1F2937]/95 backdrop-blur-xl text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2.5 border border-white/10"><CheckCircle size={18} className="text-[#10B981]"/>{toastMessage}</div>
      </div>

      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-2xl shadow-sm border-b border-gray-200/40' : 'bg-white border-b border-gray-100'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-0 md:h-[88px] flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-8">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3 cursor-pointer md:border-r border-gray-200/60 md:pr-6 active:scale-[0.97] transition-transform" onClick={() => setActiveTab('home')}>
                <div className="bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white font-black p-2 md:p-2.5 rounded-xl md:rounded-2xl text-xl md:text-2xl tracking-tighter shadow-sm">Z</div>
                <div className="hidden md:flex flex-col"><span className="text-[22px] font-black tracking-tighter leading-none">ZESHU</span><span className="text-[10px] font-extrabold text-[#6366F1] tracking-[0.2em] uppercase mt-0.5">Super App</span></div>
              </div>
              <div className="flex flex-col cursor-pointer max-w-[160px] md:max-w-[220px] group active:scale-[0.97] transition-transform" onClick={handleAutoDetectLocation}>
                <div className="font-black text-[13px] md:text-[15px] flex items-center gap-1.5">Delivery in 12 min <Zap size={14} className="text-[#F59E0B] fill-[#F59E0B]"/></div>
                <div className="flex items-center text-[10px] md:text-xs text-[#6B7280] mt-0.5 font-medium truncate">{currentAddress}<ChevronDown size={14} className="ml-1"/></div>
              </div>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 bg-gray-100 rounded-full active:scale-95 transition-transform">
                <ShoppingBag size={20} className="text-gray-700" />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] font-black w-5 h-5 flex items-center justify-center border-2 border-white">{cart.length}</span>}
              </button>
            </div>
          </div>
          <div className="w-full md:flex-1 max-w-3xl order-last md:order-none mt-1 md:mt-0">
            <div className="bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all rounded-[14px] md:rounded-[20px] flex items-center px-4 py-3 md:py-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6366F1]/20">
              <Search className="text-[#9CA3AF] w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none flex-1 ml-2 md:ml-3 text-[14px] md:text-[16px] font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && <X size={14} className="cursor-pointer" onClick={() => setSearchQuery('')}/>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-5 shrink-0">
            <button onClick={() => user ? setIsAccountOpen(true) : setIsAuthModalOpen(true)} className="flex items-center gap-2 text-[#4B5563] font-extrabold text-sm active:scale-95"><User size={20}/>{user ? 'Account' : 'Login'}</button>
            <button onClick={() => setIsCartOpen(true)} className="bg-gradient-to-b from-[#059669] to-[#047857] text-white px-5 py-3.5 rounded-[20px] flex items-center gap-3 font-bold text-sm min-w-[120px] justify-center active:scale-[0.96]">
              <ShoppingBag size={22} /> {cart.length > 0 ? `₹${finalCartTotal}` : 'My Cart'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full md:px-8 py-8 pt-[140px] md:pt-[120px] flex gap-8">
        {activeTab === 'home' && searchQuery === '' && (
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pr-4">
            <h3 className="font-black text-[#111827] mb-5 px-3 tracking-tight text-lg">Shop by Category</h3>
            <div className="flex flex-col gap-1.5">
              {productCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-left px-4 py-3.5 rounded-[18px] font-extrabold text-sm transition-all flex items-center gap-3.5 active:scale-[0.97] ${activeCategory === cat ? 'bg-[#EEF2FF] text-[#4F46E5] shadow-[inset_4px_0_0_0_#4F46E5]' : 'text-[#6B7280] hover:bg-white border border-transparent hover:border-gray-200/60'}`}>
                  <Package size={16} />{cat}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0 pb-32">
          {activeTab === 'recharge' ? (
             <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 max-w-2xl mx-auto overflow-hidden animate-in slide-in-from-bottom-4">
               <div className="flex overflow-x-auto bg-[#F8F9FC] p-3 gap-2 border-b border-gray-100 no-scrollbar">
                 {SERVICES.map((s) => (
                   <button key={s.id} onClick={() => { setActiveService(s.id); setSelectedOperator(''); setPlans([]); setFetchedBill(null); setRechargeNumber(''); setRechargeAmount(''); setMedResults(null); setMedSearchQuery(''); }} className={`flex items-center gap-2 px-5 py-3 rounded-[16px] whitespace-nowrap text-sm font-bold transition-all active:scale-95 ${activeService === s.id ? 'bg-white shadow-md text-[#111827]' : 'text-[#6B7280] hover:bg-[#E5E7EB]'}`}>
                     {s.icon} {s.label}
                   </button>
                 ))}
               </div>
               
               <div className="p-5 md:p-8 space-y-5">
                 
                 {/* 🚀 PHARMACY UI CONDITIONAL */}
                 {activeService === 'pharmacy' ? (
                   <div className="space-y-5">
                     <div>
                       <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">{currentServiceObj.inputLabel}</label>
                       <div className="relative flex items-center">
                         <input type="text" placeholder="e.g. Paracetamol, Dolo 650" className="w-full p-4 bg-[#F8F9FC] border border-gray-200/80 rounded-2xl focus:border-[#059669] focus:bg-white focus:ring-4 focus:ring-[#059669]/10 outline-none font-bold text-lg transition-all" value={medSearchQuery} onChange={(e) => setMedSearchQuery(e.target.value)} />
                       </div>
                     </div>
                     <button disabled={isLoading} onClick={handleMedicineSearch} className="w-full p-4 border-2 border-dashed border-[#A7F3D0] rounded-2xl text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] text-sm font-bold transition-all active:scale-[0.98] flex justify-center items-center gap-2">
                       {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-[#059669] border-t-transparent rounded-full"></div> : 'Search Local Pharmacies'}
                     </button>

                     {/* 🚀 MEDPAY WATERFALL RESULTS */}
                     {medResults && medResults.routing_type === 'local' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 animate-in fade-in">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-xl">Available Locally!</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-lg">{medResults.fulfillment.eta}</span>
                          </div>
                          {medResults.products.map((med: any) => (
                            <div key={med.id} className="flex justify-between items-center py-3 border-b last:border-0">
                              <div>
                                <p className="font-bold text-gray-900">{med.name}</p>
                                {med.requires_rx && <p className="text-[10px] text-red-500 font-bold mt-1">💊 Rx Required</p>}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-black text-lg">₹{med.discount_price}</span>
                                <button onClick={() => addToCart({id: med.id, name: med.name, price: med.discount_price, image_url: 'https://cdn-icons-png.flaticon.com/512/2950/2950660.png', category: 'Pharmacy'})} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold active:scale-95 text-xs">ADD</button>
                              </div>
                            </div>
                          ))}
                        </div>
                     )}

                     {medResults && medResults.routing_type === 'affiliate' && (
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-center animate-in fade-in">
                          <h3 className="font-black text-xl text-amber-900 mb-2">Out of Local Stock</h3>
                          <p className="text-sm text-amber-700 mb-6 font-medium">{medResults.fallback_action.message}</p>
                          <a href={medResults.fallback_action.link} target="_blank" rel="noopener noreferrer" className="bg-amber-500 text-white px-8 py-4 rounded-xl font-black shadow-lg hover:bg-amber-600 transition-all inline-block w-full">
                            Buy via Apollo 24|7 (Delivery {medResults.fulfillment.eta})
                          </a>
                        </div>
                     )}
                   </div>
                 ) : (
                   /* STANDARD UTILITY UI */
                   <>
                     <div>
                       <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">{currentServiceObj.inputLabel}</label>
                       <div className="relative flex items-center">
                         <input type="text" placeholder="Enter details" className="w-full p-4 pr-14 bg-[#F8F9FC] border border-gray-200 rounded-2xl focus:border-[#6366F1] font-bold text-lg outline-none" value={rechargeNumber} onChange={(e) => setRechargeNumber(e.target.value)} />
                         {activeService === 'mobile' && (
                           <button onClick={handleContactPicker} className="absolute right-3 p-2 bg-[#EEF2FF] text-[#4F46E5] rounded-xl hover:bg-[#E0E7FF] transition-colors active:scale-95 shadow-sm border border-[#E0E7FF]" title="Search Contact">
                             <BookUser size={20} />
                           </button>
                         )}
                       </div>
                     </div>
                     {activeService !== 'upi' && (
                       <div>
                         <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Operator</label>
                         <select className="w-full p-4 bg-[#F8F9FC] border border-gray-200 rounded-2xl focus:border-[#6366F1] font-bold text-[#374151] outline-none" value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
                           <option value="">Select Provider</option>
                           {Object.keys(OPERATORS_DATA[activeService] || {}).map(op => <option key={op} value={op}>{op}</option>)}
                         </select>
                       </div>
                     )}
                     <button disabled={isLoading} onClick={activeService === 'upi' ? handleUpiSearch : isPlanBased ? fetchOffers : fetchBillDetails} className="w-full p-4 border-2 border-dashed border-[#C7D2FE] rounded-2xl text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] text-sm font-bold active:scale-[0.98]">
                       {isLoading ? 'Fetching...' : 'Fetch Details'}
                     </button>
                     
                     {fetchedBill && !isPlanBased && (
                       <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-6 rounded-2xl shadow-sm">
                         <div className="flex justify-between border-b border-[#D1FAE5] pb-3 mb-3"><span className="text-xs font-bold text-[#059669] uppercase">Customer Name</span><span className="font-bold text-[#111827]">{fetchedBill.Name || 'N/A'}</span></div>
                         <div className="flex justify-between border-b border-[#D1FAE5] pb-3 mb-3"><span className="text-xs font-bold text-[#059669] uppercase">Due Date</span><span className="font-bold text-[#DC2626]">{fetchedBill.DueDate || 'N/A'}</span></div>
                         <div className="flex justify-between"><span className="text-xs font-bold text-[#047857] uppercase">Total Due</span><span className="font-black text-xl text-[#111827]">₹{fetchedBill.DueAmount || '0'}</span></div>
                       </div>
                     )}

                     {isPlanBased && plans.length > 0 && (
                       <div className="mt-4">
                         <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4">
                           {planCategories.map((cat) => (
                             <button key={cat} onClick={() => setSelectedPlanCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${selectedPlanCategory === cat ? 'bg-[#4F46E5] text-white shadow-md' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'}`}>{cat}</button>
                           ))}
                         </div>
                         <div className="h-[280px] bg-[#F8F9FC] rounded-2xl border border-gray-100 overflow-y-auto p-2 space-y-2">
                           {filteredPlans.map((plan, idx) => (
                             <div key={idx} onClick={() => setRechargeAmount(String(plan.amount))} className={`bg-white p-4 rounded-[16px] cursor-pointer transition-all border-2 ${rechargeAmount === String(plan.amount) ? 'border-[#4F46E5] shadow-md scale-[1.02]' : 'border-transparent hover:border-gray-200 shadow-sm'}`}>
                               <div className="flex justify-between items-start mb-2">
                                 <span className="font-black text-xl text-[#4F46E5]">₹{plan.amount}</span>
                                 <span className="bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-black px-2.5 py-1 rounded-lg">{plan.validity}</span>
                               </div>
                               <p className="text-xs text-[#6B7280] leading-relaxed font-medium">{plan.desc}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     <div className={(fetchedBill && !isPlanBased) || activeService === 'upi' ? 'opacity-60 pointer-events-none' : ''}>
                       <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Amount</label>
                       <div className="relative">
                         <span className="absolute left-4 top-4 text-xl font-bold text-gray-400">₹</span>
                         <input type="number" className="w-full p-4 pl-10 bg-white border border-gray-200 rounded-xl focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none font-black text-2xl transition-all shadow-sm" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} readOnly={(fetchedBill && !isPlanBased) || activeService === 'upi'} />
                       </div>
                     </div>

                     {activeService !== 'upi' && (
                       <button onClick={handleCartCheckout} disabled={isLoading} className="w-full bg-gradient-to-r from-[#059669] to-[#047857] hover:to-[#065F46] text-white py-5 rounded-2xl font-black text-lg shadow-[0_8px_20px_-6px_rgba(5,150,105,0.4)] mt-4 transition-all active:scale-[0.98]">
                         {isLoading ? 'Processing...' : `Proceed to Pay ₹${rechargeAmount || 0}`}
                       </button>
                     )}
                   </>
                 )}
               </div>
             </div>
          ) : (
            <>
              {searchQuery === '' && (
                <div className="mb-12 space-y-10 animate-in fade-in duration-700">
                  <div className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar pb-4 px-4 md:px-0 snap-x">
                    {banners.map((img, idx) => (<img key={idx} src={img} alt="Promo" className="h-[140px] md:h-[240px] rounded-[16px] md:rounded-[28px] object-cover min-w-[280px] md:min-w-[480px] cursor-pointer shadow-lg hover:-translate-y-1.5 transition-all snap-center border border-gray-100/50" />))}
                  </div>
                  <div className="bg-white p-6 md:p-10 rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 mx-4 md:mx-0">
                    <div className="flex items-center justify-between mb-8"><h2 className="text-xl md:text-2xl font-black tracking-tight">Utility & Recharges</h2><span className="text-[#4F46E5] font-extrabold text-xs md:text-sm cursor-pointer hover:bg-[#E0E7FF] bg-[#EEF2FF] px-3 py-1.5 md:px-4 md:py-2 rounded-xl">Explore All</span></div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-y-8 md:gap-y-10 gap-x-2 md:gap-x-4">
                      {SERVICES.map((s) => (
                        <div key={s.id} onClick={() => { setActiveTab('recharge'); setActiveService(s.id); }} className="flex flex-col items-center gap-2.5 md:gap-3.5 cursor-pointer group active:scale-95 transition-transform">
                          <div className={`h-[60px] w-[60px] md:h-[72px] md:w-[72px] rounded-[20px] md:rounded-[24px] flex items-center justify-center transition-all ${s.color}`}>{s.icon}</div>
                          <span className="text-[10px] md:text-[11px] font-black text-[#6B7280] text-center leading-tight group-hover:text-[#111827]">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="px-4 md:px-0">
                <div className="flex justify-between items-end mb-6 md:mb-8 border-b pb-4 md:pb-5"><h2 className="text-2xl md:text-3xl font-black tracking-tighter">{activeCategory} Items</h2><span className="text-[#6B7280] font-bold text-xs md:text-sm bg-gray-100 px-3 py-1 rounded-xl">{filteredProducts.length} items</span></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {filteredProducts.map((p) => {
                    const inCart = cart.find(c => c.item.id === p.id);
                    return (
                      <div key={p.id} className="bg-white p-3 md:p-4 rounded-[20px] md:rounded-[28px] shadow-sm border border-gray-100 flex flex-col hover:shadow-xl hover:-translate-y-1.5 transition-all group relative">
                        <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-white/90 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-1 rounded-md shadow-sm z-10 flex items-center gap-1 md:gap-1.5 border border-gray-50"><Clock size={10} className="text-[#4F46E5]"/><span className="text-[9px] md:text-[10px] font-black">12 MINS</span></div>
                        <div className="bg-[#F8F9FC] rounded-[16px] mb-3 flex items-center justify-center p-4 aspect-square relative overflow-hidden group-hover:bg-[#F3F4F6] transition-colors"><img src={p.image_url} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" alt={p.name} /></div>
                        <div className="text-[13px] md:text-[15px] font-bold text-[#1F2937] line-clamp-2 min-h-[38px] md:min-h-[44px] mb-1 leading-snug tracking-tight group-hover:text-[#4F46E5]">{p.name}</div>
                        <div className="text-[11px] md:text-[13px] text-[#6B7280] mb-4 font-semibold">{p.weight || '1 unit'}</div>
                        <div className="flex justify-between items-center mt-auto pt-2 md:pt-3 border-t">
                          <span className="font-black text-base md:text-lg">₹{p.price}</span>
                          {inCart ? (
                            <div className="flex items-center bg-[#059669] text-white rounded-xl shadow-lg min-w-[70px] md:min-w-[84px] justify-between overflow-hidden h-[30px] md:h-[36px]"><button onClick={() => removeFromCart(p.id)} className="flex-1 active:bg-black/20">-</button><span className="font-black text-xs md:text-sm">{inCart.qty}</span><button onClick={() => addToCart(p)} className="flex-1 active:bg-black/20">+</button></div>
                          ) : (
                            <button onClick={() => addToCart(p)} className="px-4 md:px-6 h-[30px] md:h-[36px] border border-[#059669] text-[#059669] bg-[#ECFDF5] rounded-xl text-[11px] md:text-[13px] font-black active:scale-95 shadow-sm min-w-[70px] md:min-w-[84px]">ADD</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[60]" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full md:w-[460px] bg-[#F8F9FC] z-[70] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="bg-white px-6 py-5 flex justify-between items-center border-b">
              <h2 className="text-2xl font-black tracking-tighter">My Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2.5 bg-[#F3F4F6] rounded-full active:scale-90"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {cart.map((c, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                  <img src={c.item.image_url} className="w-16 h-16 object-contain" alt="cart item"/>
                  <div className="flex-1"><h4 className="font-bold text-sm">{c.item.name}</h4><p className="text-xs text-gray-500">₹{c.item.price} x {c.qty}</p></div>
                  <div className="flex items-center bg-[#059669] text-white rounded-lg px-2"><button onClick={() => removeFromCart(c.item.id)} className="px-2">-</button><span className="px-2">{c.qty}</span><button onClick={() => addToCart(c.item)} className="px-2">+</button></div>
                </div>
              ))}
              <div className="bg-white p-6 rounded-[24px] shadow-sm space-y-4">
                <div className="flex justify-between text-[#4B5563]"><span>Items total</span><span className="font-bold">₹{itemTotal}</span></div>
                <div className="flex justify-between text-[#059669]"><span>Delivery charge</span><span className="font-black">FREE</span></div>
                {useZeshuCoins && <div className="flex justify-between text-[#4F46E5]"><span>Zeshu Coins Applied</span><span className="font-black">-₹{zeshuDiscount}</span></div>}
                <div className="border-t pt-4 flex justify-between font-black text-xl"><span>Grand total</span><span>₹{finalCartTotal}</span></div>
              </div>
            </div>
            <div className="bg-white p-6 border-t shadow-2xl">
              <button onClick={handleCartCheckout} className="w-full bg-gradient-to-r from-[#059669] to-[#047857] text-white font-bold py-4 rounded-2xl flex justify-between px-6 items-center">
                <span>Proceed to Pay</span><span>₹{finalCartTotal}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative shadow-2xl">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-5 right-5 text-gray-400"><X size={20}/></button>
            <h2 className="text-2xl font-black text-center mb-6">Sign In</h2>
            {!otpSent ? (
              <div className="space-y-4">
                <input type="tel" maxLength={10} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-4 bg-[#F8F9FC] border rounded-2xl font-bold text-lg outline-none focus:border-[#6366F1]" placeholder="Mobile Number" />
                <button onClick={handleSendOtp} className="w-full bg-[#111827] text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform">Get OTP</button>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="number" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-4 bg-[#F8F9FC] border rounded-2xl text-center text-3xl font-black tracking-widest outline-none focus:border-[#6366F1]" placeholder="------" />
                <button onClick={handleVerifyOtp} className="w-full bg-[#4F46E5] text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform">Verify OTP</button>
              </div>
            )}
          </div>
        </div>
      )}

      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}