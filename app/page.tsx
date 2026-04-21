/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mic, MapPin, Search, Coins, User, ChevronRight, Zap, Smartphone, 
  Tv, HeartHandshake, Plus, Minus, ShoppingBag, X, LogOut, Ticket, QrCode,
  Droplets, Wifi, Car, Landmark, ShieldCheck, PhoneCall, Phone, Package, Flame, BadgeCheck,
  History, ChevronDown, CheckSquare, Square, Clock, CheckCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SERVICES = [
  { id: 'mobile', label: 'Prepaid', icon: <Smartphone size={22}/>, color: 'bg-purple-100 text-purple-600', inputLabel: 'Mobile Number' },
  { id: 'postpaid', label: 'Postpaid', icon: <PhoneCall size={22}/>, color: 'bg-indigo-100 text-indigo-600', inputLabel: 'Mobile Number' },
  { id: 'dth', label: 'DTH', icon: <Tv size={22}/>, color: 'bg-orange-100 text-orange-600', inputLabel: 'DTH / VC Number' },
  { id: 'upi', label: 'UPI Tools', icon: <BadgeCheck size={22}/>, color: 'bg-sky-100 text-sky-600', inputLabel: 'UPI ID or Mobile No.' },
  { id: 'fastag', label: 'FASTag', icon: <Car size={22}/>, color: 'bg-green-100 text-green-600', inputLabel: 'Vehicle Registration No.' },
  { id: 'electricity', label: 'Electricity', icon: <Zap size={22}/>, color: 'bg-yellow-100 text-yellow-600', inputLabel: 'Consumer Number' },
  { id: 'gas', label: 'Piped Gas', icon: <Flame size={22}/>, color: 'bg-red-100 text-red-600', inputLabel: 'Consumer Number' },
  { id: 'lpg', label: 'LPG Booking', icon: <Package size={22}/>, color: 'bg-rose-100 text-rose-600', inputLabel: 'Registered Mobile / LPG ID' },
  { id: 'water', label: 'Water Bill', icon: <Droplets size={22}/>, color: 'bg-blue-100 text-blue-600', inputLabel: 'Account / Consumer No.' },
  { id: 'broadband', label: 'Broadband', icon: <Wifi size={22}/>, color: 'bg-cyan-100 text-cyan-600', inputLabel: 'Subscriber / User ID' },
  { id: 'emi', label: 'Loan EMI', icon: <Landmark size={22}/>, color: 'bg-emerald-100 text-emerald-600', inputLabel: 'Loan Account Number' },
  { id: 'insurance', label: 'Insurance', icon: <ShieldCheck size={22}/>, color: 'bg-teal-100 text-teal-600', inputLabel: 'Policy Number' },
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
      if (error && !cachedProducts) setProducts([]); 
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
    <div className="max-w-screen-md mx-auto w-full bg-slate-50 min-h-screen pb-40 font-sans antialiased text-gray-900 overflow-x-hidden relative shadow-2xl">
      
      {/* GLOW-UP: Glassmorphism Header */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-xl px-5 pt-5 pb-3 z-40 border-b border-gray-200/50 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('home')}>
             <div className="bg-gradient-to-br from-pink-500 to-purple-700 text-white font-black p-2.5 rounded-2xl text-xl shadow-lg shadow-purple-200">Z</div>
             <div className="flex flex-col">
               <span className="text-base font-black tracking-tight leading-none text-slate-800">ZESHU</span>
               <span className="text-[10px] font-bold text-purple-600 tracking-widest uppercase">Super App</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsScannerOpen(true)} className="bg-slate-900 text-white p-2.5 rounded-full shadow-md active:scale-90 transition-transform"><QrCode size={18} /></button>
             <button onClick={() => setIsCoinHistoryOpen(true)} className="bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-700 px-3.5 py-2 rounded-full flex items-center gap-2 shadow-sm border border-yellow-200/50"><Coins size={14} className="text-amber-500" /><span className="text-xs font-black">{coinsBalance}</span></button>
             <button onClick={() => user ? setIsAccountOpen(true) : setIsAuthModalOpen(true)} className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">{user ? <User size={20} className="text-purple-600"/> : <User size={20} />}</button>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex-1 cursor-pointer">
            <div className="font-black text-sm text-slate-800 flex items-center gap-1"><Clock size={14} className="text-purple-600"/> Delivery in 12 mins</div>
            <div className="flex items-center text-xs text-slate-500 mt-0.5">
              <span className="truncate max-w-[180px] font-medium">{currentAddress}</span>
              <ChevronDown size={14} className="ml-1 opacity-50"/>
            </div>
          </div>
          <button onClick={handleAutoDetectLocation} className="bg-purple-50 px-3 py-2 rounded-xl flex items-center justify-center min-w-[90px] active:scale-95 transition-transform">
            {isDetectingLoc ? <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div> : <span className="text-[10px] font-black text-purple-700 tracking-wide uppercase">Locate Me</span>}
          </button>
        </div>

        <div className="bg-slate-100/80 rounded-2xl flex items-center px-4 py-3 border border-slate-200/50 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Search 'milk', 'recharge', 'chips'..." className="bg-transparent border-none outline-none flex-1 ml-3 text-sm font-medium text-slate-700 placeholder-slate-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Mic size={18} className="text-purple-600" />
        </div>
      </header>

      {activeTab === 'home' ? (
        <div className="p-4 space-y-8">
          
          {/* GLOW-UP: Premium Hero Banner */}
          {searchQuery === '' && (
            <div className="relative w-full rounded-3xl overflow-hidden shadow-lg shadow-purple-100">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-purple-600 to-pink-500"></div>
              <div className="absolute top-0 right-0 p-4 opacity-20"><ShoppingBag size={100} color="white"/></div>
              <div className="relative p-6 py-8">
                <div className="bg-white/20 backdrop-blur-sm w-fit px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-3 border border-white/30">Free Delivery</div>
                <h1 className="text-3xl font-black text-white leading-tight mb-1">Your Daily<br/>Needs, Sorted.</h1>
                <p className="text-purple-100 text-sm font-medium">Groceries, bills, and more in one app.</p>
              </div>
            </div>
          )}

          {/* LIVE ORDER TRACKER */}
          {myOrders.length > 0 && myOrders[0].status !== 'DELIVERED' && (
            <section className="bg-white p-5 rounded-3xl shadow-xl shadow-purple-100/50 border border-purple-100 mb-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-purple-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Tracking</h2>
                <span className="text-[10px] font-black bg-purple-50 px-2.5 py-1.5 rounded-lg text-purple-600 border border-purple-100">#{myOrders[0].id.split('-')[0].toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between relative px-2">
                <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-100 rounded-full -translate-y-1/2 z-0"></div>
                <div className={`absolute top-1/2 left-4 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full -translate-y-1/2 z-0 transition-all duration-700 ease-out`} style={{ width: myOrders[0].status === 'PENDING' ? '30%' : '70%' }}></div>
                <div className="z-10 flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-md transition-colors duration-500 ${myOrders[0].status === 'PENDING' || 'OUT_FOR_DELIVERY' ? 'bg-purple-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}><Clock size={16}/></div>
                  <span className="text-[9px] font-black mt-2 text-slate-600 uppercase tracking-wide">Packing</span>
                </div>
                <div className="z-10 flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-md transition-colors duration-500 ${myOrders[0].status === 'OUT_FOR_DELIVERY' ? 'bg-purple-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}><Car size={16}/></div>
                  <span className="text-[9px] font-black mt-2 text-slate-600 uppercase tracking-wide">On the Way</span>
                </div>
                <div className="z-10 flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-white border-2 border-slate-200 text-slate-300`}><CheckCircle size={16}/></div>
                  <span className="text-[9px] font-black mt-2 text-slate-400 uppercase tracking-wide">Arrived</span>
                </div>
              </div>
            </section>
          )}

          {searchQuery === '' && (
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-5">Pay Bills & Recharge</h2>
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {SERVICES.map((s) => (
                  <div key={s.id} onClick={() => { setActiveTab('recharge'); setActiveService(s.id); setFetchedBill(null); setUpiResult(null); setPlans([]); setRechargeNumber(''); setRechargeAmount(''); setSelectedOperator(''); }} className="flex flex-col items-center gap-2.5 cursor-pointer group">
                    <div className={`h-14 w-14 rounded-[20px] flex items-center justify-center shadow-sm group-hover:scale-105 group-active:scale-95 transition-all duration-200 ${s.color}`}>{s.icon}</div>
                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{s.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex justify-between items-end mb-4">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Grocery & Kitchen</h2>
            </div>
            
            {/* GLOW-UP: Polished Category Scroll Bar */}
            {products.length > 0 && (
              <div className="flex overflow-x-auto gap-2.5 mb-6 no-scrollbar pb-2 -mx-4 px-4">
                {productCategories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-xl whitespace-nowrap text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${activeCategory === cat ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            
            {products.length === 0 && searchQuery === '' ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center">
                 <p className="text-slate-400 font-bold">No products found in {activeCategory}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((p) => {
                  const inCart = cart.find(c => c.item.id === p.id);
                  return (
                    /* GLOW-UP: Product Card Hover Animations */
                    <div key={p.id} className="bg-white p-3 rounded-[24px] shadow-sm border border-slate-100 flex flex-col hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                      <div className="bg-slate-50/80 rounded-2xl mb-3 flex items-center justify-center p-4 h-36 relative overflow-hidden">
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm text-[9px] font-black text-purple-700 flex items-center gap-1"><Zap size={10}/> 12 MINS</div>
                        <img src={p.image_url} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                      </div>
                      
                      <div className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                        {p.category || 'General'} • {p.weight || 'N/A'}
                      </div>
                      
                      <div className="text-sm font-bold text-slate-800 line-clamp-2 h-10 mb-2 leading-tight">{p.name}</div>
                      
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-50">
                        <span className="font-black text-lg text-slate-900">₹{p.price}</span>
                        {inCart ? (
                          <div className="flex items-center bg-purple-50 rounded-xl p-1 border border-purple-100 shadow-sm">
                            <button onClick={() => removeFromCart(p.id)} className="px-3 py-1 font-black text-purple-700 active:scale-90 transition-transform">-</button>
                            <span className="px-2 font-black text-sm text-purple-900">{inCart.qty}</span>
                            <button onClick={() => addToCart(p)} className="px-3 py-1 font-black text-purple-700 active:scale-90 transition-transform">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(p)} className="px-5 py-2 border border-purple-100 bg-white text-purple-700 rounded-xl text-xs font-black shadow-sm hover:bg-purple-50 active:scale-95 transition-all">ADD</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="p-4">
          <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden max-w-lg mx-auto">
            <div className="flex overflow-x-auto bg-slate-50 p-2 gap-2 border-b border-slate-100 no-scrollbar">
              {SERVICES.map((s) => (
                <button key={s.id} onClick={() => { setActiveService(s.id); setSelectedOperator(''); setPlans([]); setFetchedBill(null); setUpiResult(null); setRechargeNumber(''); setRechargeAmount(''); }} className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap text-xs font-black uppercase transition-all duration-200 ${activeService === s.id ? 'bg-white shadow-md text-purple-600 scale-105' : 'text-slate-400 hover:bg-slate-200/50'}`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{currentServiceObj.inputLabel}</label>
                  <div className="relative mt-1">
                    <input type="text" placeholder={`Enter details`} className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:border-purple-300 focus:bg-white outline-none font-bold text-lg transition-all" value={rechargeNumber} onChange={(e) => setRechargeNumber(e.target.value)} />
                    {isDetecting && <div className="absolute right-4 top-4 animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>}
                  </div>
                </div>
                {activeService !== 'upi' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Operator</label>
                    <select className="w-full mt-1 p-4 bg-slate-50 rounded-2xl border border-transparent focus:border-purple-300 focus:bg-white outline-none font-bold text-slate-700 transition-all" value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
                      <option value="">Choose Provider</option>
                      {Object.keys(OPERATORS_DATA[activeService] || {}).map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                )}
                {activeService === 'upi' ? (
                  <button onClick={handleUpiSearch} disabled={isLoading} className="w-full p-4 border-2 border-dashed border-sky-200 rounded-2xl text-sky-600 bg-sky-50 text-xs font-black uppercase tracking-wider hover:bg-sky-100 transition-colors">
                    {isLoading ? 'Searching...' : 'Search Bank Network'}
                  </button>
                ) : isPlanBased ? (
                  <button onClick={fetchOffers} className="w-full p-4 border-2 border-dashed border-purple-200 rounded-2xl text-purple-600 bg-purple-50 text-xs font-black uppercase tracking-wider hover:bg-purple-100 transition-colors">
                    View Offers
                  </button>
                ) : (
                  <button onClick={fetchBillDetails} disabled={isLoading} className="w-full p-4 border-2 border-dashed border-purple-200 rounded-2xl text-purple-600 bg-purple-50 text-xs font-black uppercase tracking-wider hover:bg-purple-100 transition-colors">
                    {isLoading ? 'Fetching...' : 'Fetch Bill Details'}
                  </button>
                )}
                <div className={(fetchedBill && !isPlanBased) || activeService === 'upi' ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Amount</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-4 text-xl font-bold text-slate-400">₹</span>
                    <input type="number" className="w-full p-4 pl-10 bg-slate-50 rounded-2xl border border-transparent focus:border-purple-300 focus:bg-white outline-none font-black text-2xl transition-all" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} readOnly={(fetchedBill && !isPlanBased) || activeService === 'upi'} />
                  </div>
                </div>
                {activeService !== 'upi' && (
                  <button onClick={handleRecharge} disabled={isLoading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 mt-6 active:scale-95 transition-transform">
                    {isLoading ? 'Processing...' : `Proceed to Pay ₹${rechargeAmount || 0}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CART MODAL & AUTH MODAL REMAIN UNCHANGED TO PRESERVE LOGIC */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex flex-col justify-end">
          <div className="bg-slate-50 w-full h-[90vh] rounded-t-[32px] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="bg-white p-6 rounded-t-[32px] flex justify-between items-center border-b border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-600"/></button>
                <h2 className="text-xl font-black text-slate-900">My Cart</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
               {cart.map((c, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{c.item.name}</div>
                      <div className="font-black mt-1.5 text-slate-900 text-lg">₹{c.item.price * c.qty}</div>
                    </div>
                    <div className="flex items-center bg-purple-50 rounded-xl p-1 border border-purple-100">
                      <button onClick={() => removeFromCart(c.item.id)} className="px-3 py-1 font-black text-purple-700">-</button>
                      <span className="px-2 font-black text-purple-900">{c.qty}</span>
                      <button onClick={() => addToCart(c.item)} className="px-3 py-1 font-black text-purple-700">+</button>
                    </div>
                  </div>
               ))}
               <div className="bg-slate-900 p-5 rounded-2xl font-black text-xl flex justify-between text-white shadow-lg mt-6">
                 <span>Grand Total</span>
                 <span>₹{finalCartTotal}</span>
               </div>
            </div>
            <div className="bg-white p-5 border-t border-slate-100 pb-8">
              <button onClick={handleCartCheckout} className="w-full bg-emerald-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform">
                Proceed To Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative shadow-2xl">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} className="text-slate-600"/></button>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto"><User size={32} className="text-purple-600"/></div>
            <h2 className="text-2xl font-black mb-6 text-center text-slate-900">Sign In</h2>
            {!otpSent ? (
              <div className="space-y-4">
                <input type="tel" maxLength={10} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-center text-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all" placeholder="Enter Mobile Number" />
                <button onClick={handleSendOtp} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl tracking-widest uppercase shadow-lg shadow-slate-900/20 active:scale-95 transition-transform">Send OTP</button>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="number" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all" placeholder="------" />
                <button onClick={handleVerifyOtp} className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl tracking-widest uppercase shadow-lg shadow-purple-600/30 active:scale-95 transition-transform">Verify OTP</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING CART SUMMARY */}
      {cart.length > 0 && activeTab === 'home' && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent z-[60] pb-8">
          <div className="max-w-screen-md mx-auto w-full flex justify-between items-center bg-slate-900 text-white p-4 px-6 rounded-2xl shadow-2xl shadow-slate-900/30 cursor-pointer active:scale-95 transition-transform" onClick={() => setIsCartOpen(true)}>
            <div className="flex items-center gap-4"><div className="bg-white/20 p-2 rounded-xl"><ShoppingBag size={20} color="white"/></div><div className="text-xl font-black">₹{finalCartTotal}</div></div>
            <div className="flex items-center gap-2 font-black uppercase text-sm tracking-wider">View Cart <ChevronRight size={18} /></div>
          </div>
        </div>
      )}
    </div>
  );
}