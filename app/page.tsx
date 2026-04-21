/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mic, MapPin, Search, Coins, User, ChevronRight, Zap, Smartphone, 
  Tv, HeartHandshake, Plus, Minus, ShoppingBag, X, LogOut, Ticket, QrCode,
  Droplets, Wifi, Car, Landmark, ShieldCheck, PhoneCall, Phone, Package, Flame, BadgeCheck,
  History, ChevronDown, CheckSquare, Square, Clock, CheckCircle, Menu, Info
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SERVICES = [
  { id: 'mobile', label: 'Prepaid', icon: <Smartphone size={28}/>, color: 'bg-blue-50 text-blue-600', inputLabel: 'Mobile Number' },
  { id: 'postpaid', label: 'Postpaid', icon: <PhoneCall size={28}/>, color: 'bg-indigo-50 text-indigo-600', inputLabel: 'Mobile Number' },
  { id: 'dth', label: 'DTH', icon: <Tv size={28}/>, color: 'bg-orange-50 text-orange-600', inputLabel: 'DTH / VC Number' },
  { id: 'upi', label: 'UPI Tools', icon: <BadgeCheck size={28}/>, color: 'bg-sky-50 text-sky-600', inputLabel: 'UPI ID or Mobile No.' },
  { id: 'fastag', label: 'FASTag', icon: <Car size={28}/>, color: 'bg-emerald-50 text-emerald-600', inputLabel: 'Vehicle Registration No.' },
  { id: 'electricity', label: 'Electricity', icon: <Zap size={28}/>, color: 'bg-yellow-50 text-yellow-600', inputLabel: 'Consumer Number' },
  { id: 'gas', label: 'Piped Gas', icon: <Flame size={28}/>, color: 'bg-red-50 text-red-600', inputLabel: 'Consumer Number' },
  { id: 'lpg', label: 'LPG Booking', icon: <Package size={28}/>, color: 'bg-rose-50 text-rose-600', inputLabel: 'Registered Mobile / LPG ID' },
  { id: 'water', label: 'Water Bill', icon: <Droplets size={28}/>, color: 'bg-cyan-50 text-cyan-600', inputLabel: 'Account / Consumer No.' },
  { id: 'broadband', label: 'Broadband', icon: <Wifi size={28}/>, color: 'bg-fuchsia-50 text-fuchsia-600', inputLabel: 'Subscriber / User ID' },
];

const OPERATORS_DATA: any = {
  mobile: { 'JIO': '11', 'Airtel': '2', 'Vodafone': '23', 'Idea': '6', 'BSNL': '4' },
  postpaid: { 'Jio Postpaid': '491', 'Airtel Postpaid': '34', 'Vodafone Postpaid': '36', 'BSNL Postpaid': '33', 'Idea Postpaid': '35' },
  dth: { 'TATA SKY': '28', 'AIRTEL DTH': '24', 'DISH TV': '25', 'SUN DIRECT': '27', 'VIDEOCON D2H': '29' },
  lpg: { 'Bharat Gas': '214', 'HP Gas': '215', 'Indane Gas': '216' },
  electricity: { 'TSSPDCL - Telangana Southern': '474', 'TSNPDCL - Telangana Northern': '475', 'Adani Electricity - MUMBAI': '50', 'Tata Power - MUMBAI': '116', 'B.E.S.T Mumbai': '495', 'BSES Rajdhani': '449', 'Torrent Power': '53', 'UPPCL': '47', 'KSEBL - KERALA': '69', 'TNEB - TAMIL NADU': '115', 'WBSEDCL - WEST BENGAL': '155', 'BESCOM - BENGALURU': '149', 'APSPDCL - ANDHRA PRADESH': '150' },
  fastag: { 'Airtel Payments Bank': '1', 'Axis Bank': '3', 'HDFC FASTag': '10', 'ICICI Bank': '12', 'SBI Fastag': '30', 'Paytm FASTag': '22', 'IDFC FIRST Bank': '14', 'Kotak Mahindra': '21' },
  gas: { 'MAHANAGAR GAS': '62', 'INDRAPRASTHA GAS': '63', 'GUJARAT GAS': '64', 'Adani Gas': '154', 'Haryana City Gas': '139', 'Maharashtra Natural Gas': '489' },
  water: { 'Hyderabad Metro Water (HMWSSB)': '172', 'Delhi Jal Board': '219', 'BWSSB Bangalore': '166', 'Kerala Water Authority': '175', 'Pune Municipal Corp': '182', 'MCGM Water Mumbai': '237', 'Gurugram Water': '223' },
  broadband: { 'Airtel Broadband': '324', 'ACT Fibernet': '314', 'Hathway': '362', 'Tikona': '68', 'Asianet': '329', 'Spectra': '399' },
  emi: { 'Bajaj Finance Limited': '457', 'TVS Credit Services': '458', 'Cholamandalam': '466', 'Home Credit': '468', 'L&T Finance': '470', 'Hero FinCorp': '467' },
  insurance: { 'Life Insurance Corporation (LIC)': '187', 'SBI Life Insurance': '277', 'ICICI Prudential Life': '268', 'HDFC Life': '201', 'Bajaj Allianz Life': '193', 'TATA AIA Life': '281' },
};

const COMMISSION_RATES: any = { 'Airtel': 1.00, 'JIO': 0.65, 'Vodafone': 3.70, 'BSNL': 3.00 };

// Mock Banners for Blinkit-style feel
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
  const [isCoinHistoryOpen, setIsCoinHistoryOpen] = useState(false);
  const [useZeshuCoins, setUseZeshuCoins] = useState(false);
  const [tipAmount, setTipAmount] = useState(20); 
  const [isDonating, setIsDonating] = useState(true); 
  const [currentAddress, setCurrentAddress] = useState('HotelRoom 205, 2nd floor Shree Amardeep...');
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);
  
  const [rechargeNumber, setRechargeNumber] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [dob, setDob] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [fetchedBill, setFetchedBill] = useState<any>(null);
  const [upiResult, setUpiResult] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedPlanCategory, setSelectedPlanCategory] = useState("All");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    
    const fetchProducts = async () => {
      const cachedProducts = localStorage.getItem('zeshu_products');
      if (cachedProducts) setProducts(JSON.parse(cachedProducts));

      const { data, error } = await supabase.from('products').select('*').eq('in_stock', true);
      if (data) {
        setProducts(data);
        localStorage.setItem('zeshu_products', JSON.stringify(data));
      }
    };

    fetchProducts();
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchMyOrders = async () => {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (data) setMyOrders(data);
      };
      
      fetchMyOrders();

      const orderChannel = supabase
        .channel('customer-orders')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, 
          (payload) => { setMyOrders([payload.new]); }
        ).subscribe();

      return () => { supabase.removeChannel(orderChannel); };
    }
  }, [user]);

  const handleAutoDetectLocation = () => {
    setIsDetectingLoc(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTimeout(() => { setCurrentAddress("Current GPS Location Synced"); setIsDetectingLoc(false); }, 1000);
        },
        () => { alert("Location access denied."); setIsDetectingLoc(false); }
      );
    } else { setIsDetectingLoc(false); }
  };

  const parseUpiData = (qrString: string) => {
    if (!qrString.startsWith('upi://pay')) { alert("Invalid QR Code."); return null; }
    try {
      const url = new URL(qrString);
      const params = new URLSearchParams(url.search);
      return { payeeAddress: params.get('pa'), payeeName: params.get('pn'), amount: params.get('am') || '' };
    } catch (error) { return null; }
  };

  useEffect(() => {
    if (rechargeNumber.length === 10 && activeService === 'mobile') { autoDetectAndFetchPlans(rechargeNumber); }
    setFetchedBill(null); setUpiResult(null);
  }, [rechargeNumber, activeService]);

  const autoDetectAndFetchPlans = async (num: string) => {
    setIsDetecting(true); setPlans([]);
    try {
      const opRes = await fetch(`/api/fetch-operator?number=${num}`);
      const opData = await opRes.json();
      if (opData.operator) {
        setSelectedOperator(opData.operator); 
        const opCode = OPERATORS_DATA['mobile'][opData.operator];
        if (opCode) {
          const planRes = await fetch(`/api/fetch-plans?number=${num}&operator=${opCode}`);
          const planData = await planRes.json();
          setPlans(planData.plans || []);
          setSelectedPlanCategory("All");
        }
      }
    } catch (err) {}
    setIsDetecting(false);
  };

  const fetchOffers = async () => {
    if (!rechargeNumber || !selectedOperator) return alert(`Enter ${currentServiceObj.inputLabel} and select operator`);
    setIsLoading(true);
    try {
      const opCode = OPERATORS_DATA[activeService][selectedOperator];
      const res = await fetch(`/api/fetch-plans?number=${rechargeNumber}&operator=${opCode}`);
      const data = await res.json();
      setPlans(data.plans || []);
      setSelectedPlanCategory("All");
    } catch (err) { alert("Error fetching offers"); }
    setIsLoading(false);
  };

  const fetchBillDetails = async () => {
    if (!rechargeNumber || !selectedOperator) return alert(`Enter ${currentServiceObj.inputLabel} and select operator`);
    setIsLoading(true); setFetchedBill(null);
    try {
      const opCode = OPERATORS_DATA[activeService][selectedOperator];
      const res = await fetch(`/api/fetch-bill?service=${activeService}&number=${rechargeNumber}&operatorCode=${opCode}`);
      const data = await res.json();
      if (data.success && data.bill) { setFetchedBill(data.bill); setRechargeAmount(data.bill.DueAmount); } 
      else { alert(data.message || "Could not fetch bill details."); }
    } catch (err) { alert("Error connecting to billing server."); }
    setIsLoading(false);
  };

  const handleUpiSearch = async () => {
    if (!rechargeNumber) return alert("Please enter a UPI ID or Mobile Number.");
    setIsLoading(true); setUpiResult(null);
    const cleanInput = rechargeNumber.trim();
    const isMobileNumber = /^\d{10}$/.test(cleanInput);
    const actionType = isMobileNumber ? 'mobile_to_multiple_upi' : 'vpa_info';
    try {
      const response = await fetch('/api/upi-tools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, mobileNo: isMobileNumber ? cleanInput : undefined, upiId: !isMobileNumber ? cleanInput : undefined })
      });
      const result = await response.json();
      if (result.success) { setUpiResult(result.data); } else { alert(`Error: ${result.message}`); }
    } catch (error) { alert("Network error"); }
    setIsLoading(false);
  };

  const checkUser = async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) { setUser(session.user); fetchCoinBalance(session.user.id); } };
  const fetchCoinBalance = async (userId: string) => { const { data } = await supabase.from('wallets').select('coins').eq('user_id', userId).single(); if (data) setCoinsBalance(data.coins); };
  const handleSendOtp = async () => { setIsLoading(true); const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phoneNumber}` }); setIsLoading(false); if (!error) setOtpSent(true); else alert(error.message); };
  const handleVerifyOtp = async () => { setIsLoading(true); const { data, error } = await supabase.auth.verifyOtp({ phone: `+91${phoneNumber}`, token: otp, type: 'sms' }); setIsLoading(false); if (data.session) { setUser(data.session.user); setIsAuthModalOpen(false); fetchCoinBalance(data.session.user.id); } else alert(error?.message); };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setCoinsBalance(0); setIsAccountOpen(false); };
  
  const addToCart = (product: any) => setCart(prev => { const existing = prev.find(c => c.item.id === product.id); return existing ? prev.map(c => c.item.id === product.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { item: product, qty: 1 }]; });
  const removeFromCart = (productId: any) => { const existing = cart.find(c => c.item.id === productId); if (existing && existing.qty > 1) { setCart(cart.map(c => c.item.id === productId ? { ...c, qty: c.qty - 1 } : c)); } else { setCart(cart.filter(c => c.item.id !== productId)); if (cart.length === 1) setIsCartOpen(false); } };

  const itemTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
  const smallCartFee = (itemTotal > 0 && itemTotal < 100) ? 20 : 0;
  const deliveryCharge = (itemTotal > 0 && itemTotal < 200) ? 30 : 0; 
  const donationAmt = isDonating ? 1 : 0;
  const zeshuDiscount = useZeshuCoins ? Math.min(ZESHU_COINS_VAL, itemTotal) : 0; 
  const finalCartTotal = itemTotal > 0 ? (itemTotal + deliveryCharge + smallCartFee + HANDLING_FEE + donationAmt + tipAmount - zeshuDiscount) : 0;

  const baseRate = COMMISSION_RATES[selectedOperator] || 1.00; 
  const exactProfit = (parseFloat(rechargeAmount) || 0) * (baseRate / 100);
  const cashbackEarned = Math.floor(exactProfit * 0.80);

  const handleRecharge = async () => {
    if (!user) return setIsAuthModalOpen(true);
    if (!rechargeNumber || !rechargeAmount) return alert("Please fill all details");
    setIsLoading(true);
    try {
      const orderResponse = await fetch('/api/create-razorpay-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: rechargeAmount }) });
      const order = await orderResponse.json();
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency, name: "Zeshu Super App", order_id: order.id,
        handler: async function (response: any) {
          const rechargeRes = await fetch('/api/process-recharge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operatorCode: OPERATORS_DATA[activeService]?.[selectedOperator] || 'UPI', circleCode: 13, number: rechargeNumber, amount: rechargeAmount, userId: user.id, orderId: order.id, dob }) });
          const result = await rechargeRes.json();
          if (result.success) { alert(`Payment successful! 🎉 You earned ₹${cashbackEarned} Cashback!`); fetchCoinBalance(user.id); } else alert(result.message);
        },
        theme: { color: "#9333ea" },
      };
      const rzp = new (window as any).Razorpay(options); rzp.open();
    } catch (error) { alert("Gateway Error"); }
    setIsLoading(false);
  };

  const handleCartCheckout = async () => {
    if (finalCartTotal === 0) return;
    if (!user) return setIsAuthModalOpen(true);
    setIsLoading(true);
    try {
      const orderResponse = await fetch('/api/create-razorpay-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: finalCartTotal }) });
      const order = await orderResponse.json();
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency, name: "Zeshu Grocery", order_id: order.id,
        handler: async function (response: any) { 
          try {
            await fetch('/api/confirm-grocery-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, cartItems: cart, totalAmount: finalCartTotal, paymentId: response.razorpay_payment_id, address: currentAddress })
            });
          } catch(e) { console.error(e) }
          alert("Grocery Order Successful!"); 
          setCart([]); 
          setIsCartOpen(false); 
        },
        theme: { color: "#9333ea" },
      };
      const rzp = new (window as any).Razorpay(options); rzp.open();
    } catch (error) { alert("Gateway Error"); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] font-sans antialiased text-gray-900 overflow-x-hidden">
      
      {/* --- BLINKIT-STYLE TOP NAVIGATION --- */}
      <header className="sticky top-0 bg-white z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-[84px] flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo & Location Divider */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer border-r border-gray-200 pr-6" onClick={() => setActiveTab('home')}>
              <div className="bg-purple-600 text-white font-black p-2 rounded-xl text-2xl tracking-tighter shadow-md">Z</div>
              <div className="hidden md:flex flex-col">
                <span className="text-xl font-black tracking-tight leading-none text-gray-900">ZESHU</span>
                <span className="text-[10px] font-bold text-purple-600 tracking-widest uppercase">Super App</span>
              </div>
            </div>
            
            {/* Location Selector (Blinkit Style) */}
            <div className="hidden md:flex flex-col cursor-pointer max-w-[200px]" onClick={handleAutoDetectLocation}>
              <div className="font-extrabold text-sm text-gray-900">Delivery in 12 minutes</div>
              <div className="flex items-center text-xs text-gray-500 mt-0.5 group">
                <span className="truncate">{currentAddress}</span>
                <ChevronDown size={14} className="ml-1 group-hover:text-gray-900 transition-colors"/>
              </div>
            </div>
          </div>

          {/* Huge Central Search Bar */}
          <div className="flex-1 max-w-3xl">
            <div className="bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 rounded-xl flex items-center px-4 py-3.5 focus-within:bg-white focus-within:border-purple-300 focus-within:shadow-[0_0_0_4px_rgba(147,51,234,0.1)]">
              <Search size={20} className="text-gray-500" />
              <input 
                type="text" 
                placeholder="Search 'milk', 'recharge', 'chips'..." 
                className="bg-transparent border-none outline-none flex-1 ml-3 text-[15px] font-medium text-gray-800 placeholder-gray-500" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              {searchQuery && <X size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setSearchQuery('')}/>}
            </div>
          </div>

          {/* Right Actions: Login & Cart */}
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => user ? setIsAccountOpen(true) : setIsAuthModalOpen(true)} className="hidden md:flex items-center gap-2 text-gray-700 hover:text-gray-900 font-bold px-2 py-2">
              {user ? 'My Account' : 'Login'}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="bg-[#0c831f] hover:bg-[#0a6d1a] transition-colors text-white px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-md font-bold text-sm min-w-[110px] justify-center">
              <ShoppingBag size={20} />
              {cart.length > 0 ? (
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] opacity-90">{cart.length} items</span>
                  <span>₹{finalCartTotal}</span>
                </div>
              ) : <span>My Cart</span>}
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <main className="max-w-[1400px] mx-auto w-full md:px-8 py-6 flex gap-6">
        
        {/* DESKTOP SIDEBAR (Blinkit Style Categories) */}
        {activeTab === 'home' && searchQuery === '' && (
          <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[100px] h-[calc(100vh-100px)] overflow-y-auto no-scrollbar pr-4">
            <h3 className="font-extrabold text-gray-900 mb-4 px-2">Categories</h3>
            <div className="flex flex-col gap-1">
              {productCategories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-between group ${activeCategory === cat ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeCategory === cat ? 'bg-purple-100' : 'bg-gray-200 group-hover:bg-white'}`}>
                       <Package size={14} className={activeCategory === cat ? 'text-purple-600' : 'text-gray-500'}/>
                    </div>
                    {cat}
                  </div>
                  {activeCategory === cat && <div className="w-1 h-5 bg-purple-600 rounded-full" />}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0 pb-32">
          
          {/* RECHARGE / BILL PAY TAB */}
          {activeTab === 'recharge' ? (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto">
               <div className="flex overflow-x-auto bg-gray-50 p-2 gap-2 border-b border-gray-100 no-scrollbar">
                 {SERVICES.map((s) => (
                   <button key={s.id} onClick={() => { setActiveService(s.id); setSelectedOperator(''); setPlans([]); setFetchedBill(null); setUpiResult(null); setRechargeNumber(''); setRechargeAmount(''); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${activeService === s.id ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:bg-gray-200/50'}`}>
                     {s.icon} {s.label}
                   </button>
                 ))}
               </div>
               <div className="p-8 space-y-6">
                 <div className="space-y-5">
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{currentServiceObj.inputLabel}</label>
                     <div className="relative">
                       <input type="text" placeholder={`Enter details`} className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-bold text-lg transition-all shadow-sm" value={rechargeNumber} onChange={(e) => setRechargeNumber(e.target.value)} />
                     </div>
                   </div>
                   
                   {activeService !== 'upi' && (
                     <div>
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Operator</label>
                       <select className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-bold text-gray-700 transition-all shadow-sm" value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
                         <option value="">Choose Provider</option>
                         {Object.keys(OPERATORS_DATA[activeService] || {}).map(op => <option key={op} value={op}>{op}</option>)}
                       </select>
                     </div>
                   )}
                   
                   {activeService === 'upi' ? (
                     <button onClick={handleUpiSearch} disabled={isLoading} className="w-full p-4 border border-blue-200 rounded-xl text-blue-600 bg-blue-50 text-sm font-bold hover:bg-blue-100 transition-colors">
                       {isLoading ? 'Searching...' : 'Verify UPI ID'}
                     </button>
                   ) : isPlanBased ? (
                     <button onClick={fetchOffers} className="w-full p-4 border border-purple-200 rounded-xl text-purple-700 bg-purple-50 text-sm font-bold hover:bg-purple-100 transition-colors">
                       View Offers
                     </button>
                   ) : (
                     <button onClick={fetchBillDetails} disabled={isLoading} className="w-full p-4 border border-purple-200 rounded-xl text-purple-700 bg-purple-50 text-sm font-bold hover:bg-purple-100 transition-colors">
                       {isLoading ? 'Fetching...' : 'Fetch Bill Details'}
                     </button>
                   )}
                   
                   <div className={(fetchedBill && !isPlanBased) || activeService === 'upi' ? 'opacity-60 pointer-events-none' : ''}>
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount</label>
                     <div className="relative">
                       <span className="absolute left-4 top-4 text-xl font-bold text-gray-400">₹</span>
                       <input type="number" className="w-full p-4 pl-10 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-black text-2xl transition-all shadow-sm" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} readOnly={(fetchedBill && !isPlanBased) || activeService === 'upi'} />
                     </div>
                   </div>
                   
                   {activeService !== 'upi' && (
                     <button onClick={handleRecharge} disabled={isLoading} className="w-full bg-[#0c831f] hover:bg-[#0a6d1a] text-white py-5 rounded-xl font-bold text-base shadow-md mt-4 transition-colors">
                       {isLoading ? 'Processing...' : `Proceed to Pay ₹${rechargeAmount || 0}`}
                     </button>
                   )}
                 </div>
               </div>
             </div>
          ) : (
            <>
              {/* HOME TAB: BANNERS & CATEGORIES */}
              {searchQuery === '' && (
                <div className="mb-10 space-y-8">
                  {/* Hero Banners */}
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-4 md:px-0">
                    {BANNERS.map((img, idx) => (
                      <img key={idx} src={img} alt="Promo" className="h-[140px] md:h-[200px] rounded-xl object-cover min-w-[280px] md:min-w-[400px] cursor-pointer hover:shadow-md transition-shadow" />
                    ))}
                  </div>

                  {/* Quick Services Grid */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mx-4 md:mx-0">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-extrabold text-gray-900">Utility & Recharges</h2>
                      <span className="text-purple-600 font-bold text-sm cursor-pointer hover:underline">View All</span>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-y-8 gap-x-4">
                      {SERVICES.slice(0, 8).map((s) => (
                        <div key={s.id} onClick={() => { setActiveTab('recharge'); setActiveService(s.id); }} className="flex flex-col items-center gap-3 cursor-pointer group">
                          <div className={`h-[60px] w-[60px] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${s.color}`}>{s.icon}</div>
                          <span className="text-[11px] font-bold text-gray-700 text-center leading-tight group-hover:text-gray-900">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCTS SECTION */}
              <div className="px-4 md:px-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-extrabold text-gray-900">{activeCategory === 'All' ? 'Showing All Products' : activeCategory}</h2>
                  <span className="text-gray-500 font-medium text-sm">{filteredProducts.length} items</span>
                </div>
                
                {products.length === 0 && searchQuery === '' ? (
                  <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-[#0c831f] border-t-transparent rounded-full"></div></div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center"><p className="text-gray-500 font-medium">No products found</p></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map((p) => {
                      const inCart = cart.find(c => c.item.id === p.id);
                      return (
                        <div key={p.id} className="bg-white p-3 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col hover:shadow-lg hover:border-gray-200 transition-all duration-200 group relative">
                          {/* Time Pill */}
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm z-10 flex items-center gap-1 border border-gray-100">
                            <Clock size={10} className="text-gray-700"/>
                            <span className="text-[9px] font-extrabold text-gray-800 tracking-tight">12 MINS</span>
                          </div>
                          
                          <div className="bg-white rounded-xl mb-3 flex items-center justify-center p-4 h-[140px] relative overflow-hidden border border-gray-50">
                            <img src={p.image_url} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                          </div>
                          
                          <div className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] mb-1 leading-snug">{p.name}</div>
                          <div className="text-[11px] text-gray-500 mb-3 font-medium">{p.weight || '1 unit'}</div>
                          
                          <div className="flex justify-between items-center mt-auto pt-1">
                            <span className="font-extrabold text-sm text-gray-900">₹{p.price}</span>
                            {inCart ? (
                              <div className="flex items-center bg-[#0c831f] text-white rounded-lg px-2 py-1.5 shadow-sm min-w-[70px] justify-between">
                                <button onClick={() => removeFromCart(p.id)} className="px-1 font-bold active:scale-90">-</button>
                                <span className="font-bold text-sm px-2">{inCart.qty}</span>
                                <button onClick={() => addToCart(p)} className="px-1 font-bold active:scale-90">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(p)} className="px-4 py-1.5 border border-[#0c831f] text-[#0c831f] bg-green-50/50 hover:bg-green-50 rounded-lg text-xs font-bold transition-colors min-w-[70px]">ADD</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* --- BLINKIT-STYLE SLIDE-IN CART --- */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-[#f4f6fb] z-50 shadow-2xl animate-in slide-in-from-right flex flex-col">
            
            <div className="bg-white px-5 py-4 flex justify-between items-center shadow-sm z-10">
              <h2 className="text-xl font-extrabold text-gray-900">My Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-600"/></button>
            </div>

            {cart.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                 <ShoppingBag size={80} className="text-gray-300 mb-4"/>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Your cart is empty</h3>
                 <p className="text-sm text-gray-500">Looks like you haven't added anything to your cart yet.</p>
                 <button onClick={() => setIsCartOpen(false)} className="mt-8 bg-[#0c831f] text-white px-6 py-3 rounded-xl font-bold">Start Shopping</button>
               </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  
                  <div className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100">
                    <div className="bg-blue-50 p-3 rounded-xl"><Clock className="text-blue-600" size={24}/></div>
                    <div>
                      <div className="font-extrabold text-gray-900 text-sm">Delivery in 12 minutes</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">Shipment of {cart.length} item{cart.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {cart.map((c, i) => (
                      <div key={i} className="p-4 flex gap-4 border-b border-gray-50 last:border-0">
                        <img src={c.item.image_url} className="w-16 h-16 object-contain rounded-lg border border-gray-100 p-1" alt={c.item.name}/>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{c.item.name}</div>
                          <div className="text-xs text-gray-500">{c.item.weight || c.item.unit}</div>
                          <div className="flex justify-between items-end mt-2">
                            <span className="font-extrabold text-gray-900">₹{c.item.price * c.qty}</span>
                            <div className="flex items-center bg-[#0c831f] text-white rounded-lg px-2 py-1 shadow-sm">
                              <button onClick={() => removeFromCart(c.item.id)} className="px-2 font-bold">-</button>
                              <span className="px-2 font-bold text-sm">{c.qty}</span>
                              <button onClick={() => addToCart(c.item)} className="px-2 font-bold">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-extrabold text-gray-900 mb-4 text-sm">Bill Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-600"><span className="flex items-center gap-2"><Square size={14}/> Items total</span><span>₹{itemTotal}</span></div>
                      <div className="flex justify-between text-gray-600"><span className="flex items-center gap-2"><Car size={14}/> Delivery charge</span><span className="text-[#0c831f] font-bold">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
                      <div className="flex justify-between text-gray-600"><span className="flex items-center gap-2"><Info size={14}/> Handling fee</span><span>₹{HANDLING_FEE}</span></div>
                      {smallCartFee > 0 && <div className="flex justify-between text-gray-600"><span className="flex items-center gap-2 text-red-500"><AlertCircle size={14}/> Small cart fee</span><span className="text-red-500">₹{smallCartFee}</span></div>}
                      {useZeshuCoins && <div className="flex justify-between text-purple-600 font-bold"><span className="flex items-center gap-2"><Coins size={14}/> Zeshu Coins applied</span><span>-₹{zeshuDiscount}</span></div>}
                      
                      <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-extrabold text-gray-900 text-base">
                        <span>Grand total</span>
                        <span>₹{finalCartTotal}</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="bg-white p-4 border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="text-[#0c831f] shrink-0" size={24}/>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Delivering to</div>
                      <div className="text-sm font-extrabold text-gray-900 truncate">{currentAddress}</div>
                    </div>
                  </div>
                  <button onClick={handleCartCheckout} className="w-full bg-[#0c831f] hover:bg-[#0a6d1a] transition-colors text-white font-bold py-4 rounded-xl flex justify-between px-6 items-center">
                    <div className="flex flex-col text-left">
                      <span className="text-lg leading-none">₹{finalCartTotal}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-90 font-medium mt-0.5">Total</span>
                    </div>
                    <span className="flex items-center gap-2 text-base">Proceed to Pay <ChevronRight size={18}/></span>
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* LOGIN MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm relative shadow-2xl">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6 mx-auto"><Smartphone size={28} className="text-purple-600"/></div>
            <h2 className="text-2xl font-extrabold mb-2 text-center text-gray-900">Sign In</h2>
            <p className="text-center text-sm text-gray-500 mb-6 font-medium">To securely access your Zeshu account</p>
            {!otpSent ? (
              <div className="space-y-4">
                <input type="tel" maxLength={10} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center text-lg focus:border-purple-500 focus:bg-white outline-none transition-all" placeholder="Enter Mobile Number" />
                <button onClick={handleSendOtp} disabled={isLoading} className="w-full bg-[#0c831f] hover:bg-[#0a6d1a] text-white font-bold py-4 rounded-xl transition-colors">{isLoading ? 'Sending...' : 'Continue'}</button>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="number" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-2xl font-black tracking-[0.5em] focus:border-purple-500 focus:bg-white outline-none transition-all" placeholder="------" />
                <button onClick={handleVerifyOtp} disabled={isLoading} className="w-full bg-[#0c831f] hover:bg-[#0a6d1a] text-white font-bold py-4 rounded-xl transition-colors">{isLoading ? 'Verifying...' : 'Verify OTP'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING CART SUMMARY (Mobile Only) */}
      {cart.length > 0 && activeTab === 'home' && !isCartOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md z-[40] border-t border-gray-100">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-[#0c831f] text-white px-5 py-3.5 rounded-xl flex items-center justify-between shadow-lg font-bold">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg"><ShoppingBag size={18} className="text-white"/></div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-90">{cart.length} Items</span>
                <span className="text-base leading-none">₹{finalCartTotal}</span>
              </div>
            </div>
            <span className="flex items-center gap-1 text-sm">View Cart <ChevronRight size={18} /></span>
          </button>
        </div>
      )}
    </div>
  );
}