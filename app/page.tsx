/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mic, MapPin, Search, Coins, User, ChevronRight, Zap, Smartphone, 
  Tv, HeartHandshake, Plus, Minus, ShoppingBag, X, LogOut, Ticket, QrCode,
  Droplets, Wifi, Car, Landmark, ShieldCheck, PhoneCall, Phone, Package, Flame, BadgeCheck,
  History, ChevronDown, CheckSquare, Square, Clock
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Scanner } from '@yudiel/react-qr-scanner'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 🚀 THE MEGA SUPER APP GRID ---
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
  const [searchQuery, setSearchQuery] = useState(''); 
  const [cart, setCart] = useState<{item: any, qty: number}[]>([]);
  const [user, setUser] = useState<any>(null);
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
  const [scannedPayee, setScannedPayee] = useState<any>(null); 
  const [scanAmount, setScanAmount] = useState('');

  const currentServiceObj = SERVICES.find(s => s.id === activeService) || SERVICES[0];
  const isPlanBased = activeService === 'mobile' || activeService === 'dth'; 

  // Math Constants
  const ZESHU_COINS_VAL = 50;
  const HANDLING_FEE = 5;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    fetch('https://zeshu-backend-api.onrender.com/api/products').then(res => res.json()).then(json => setProducts(json.data || []));
    checkUser();
  }, []);

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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

  // 🚀 --- ADVANCED CART MATH --- 🚀
  const itemTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
  
  // NEW: Small Cart Fee & Dynamic Delivery Calculation
  const smallCartFee = (itemTotal > 0 && itemTotal < 100) ? 20 : 0;
  const deliveryCharge = (itemTotal > 0 && itemTotal < 200) ? 30 : 0; 
  
  const donationAmt = isDonating ? 1 : 0;
  const zeshuDiscount = useZeshuCoins ? Math.min(ZESHU_COINS_VAL, itemTotal) : 0; 
  
  // Final calculation updated with small cart fee
  const finalCartTotal = itemTotal > 0 ? (itemTotal + deliveryCharge + smallCartFee + HANDLING_FEE + donationAmt + tipAmount - zeshuDiscount) : 0;

  // Recharge Math
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
          if (result.success) { alert(`Payment successful! 🎉 You earned ₹${cashbackEarned} Cashback in Zeshu Coins!`); fetchCoinBalance(user.id); } else alert(result.message);
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
        handler: async function (response: any) { alert("Grocery Order Successful!"); setCart([]); setIsCartOpen(false); },
        theme: { color: "#9333ea" },
      };
      const rzp = new (window as any).Razorpay(options); rzp.open();
    } catch (error) { alert("Gateway Error"); }
    setIsLoading(false);
  };

  return (
    <div className="max-w-screen-xl mx-auto w-full bg-slate-50 min-h-screen pb-40 font-sans antialiased text-gray-900 overflow-hidden relative">
      
      {/* HEADER WITH LOCATION & SEARCH */}
      <header className="sticky top-0 bg-white px-4 pt-4 pb-2 z-40 border-b border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
             <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black p-2 rounded-xl text-xl shadow-lg">Z</div>
             <div className="flex flex-col">
               <span className="text-sm font-black tracking-tight leading-none">ZESHU</span>
               <span className="text-[9px] font-bold text-purple-600 tracking-widest uppercase">Super App</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsScannerOpen(true)} className="bg-purple-600 text-white p-2 rounded-full shadow-md active:scale-90 transition-transform"><QrCode size={20} /></button>
             <button onClick={() => setIsCoinHistoryOpen(true)} className="bg-yellow-50 text-amber-700 px-3 py-1.5 rounded-full flex items-center gap-2 border border-yellow-200"><Coins size={14} className="text-amber-500" /><span className="text-xs font-bold">{coinsBalance}</span></button>
             <button onClick={() => user ? setIsAccountOpen(true) : setIsAuthModalOpen(true)} className="p-2 rounded-full bg-gray-100 text-gray-500">{user ? <User size={20} className="text-purple-600"/> : <User size={20} />}</button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex-1 cursor-pointer">
            <div className="font-black text-lg text-gray-900">Delivery in 20 minutes</div>
            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              <span className="truncate max-w-[200px]">{currentAddress}</span>
              <ChevronDown size={14} className="ml-1"/>
            </div>
          </div>
          <button onClick={handleAutoDetectLocation} className="border border-gray-200 px-3 py-1.5 rounded-full bg-white shadow-sm flex items-center justify-center min-w-[90px]">
            {isDetectingLoc ? <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div> : <span className="text-[11px] font-bold text-purple-600">Auto Detect</span>}
          </button>
        </div>

        <div className="bg-gray-100 rounded-xl flex items-center px-4 py-2.5">
          <Search size={20} className="text-gray-400" />
          <input type="text" placeholder="Search 'milk' or 'recharge'..." className="bg-transparent border-none outline-none flex-1 ml-3 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Mic size={20} className="text-purple-600" />
        </div>
      </header>

      {activeTab === 'home' ? (
        <div className="p-4 space-y-6">
          {searchQuery === '' && (
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Recharges & Bill Payments</h2>
              <div className="grid grid-cols-4 gap-y-6">
                {SERVICES.map((s) => (
                  <div key={s.id} onClick={() => { setActiveTab('recharge'); setActiveService(s.id); setFetchedBill(null); setUpiResult(null); setPlans([]); setRechargeNumber(''); setRechargeAmount(''); setSelectedOperator(''); }} className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm ${s.color}`}>{s.icon}</div>
                    <span className="text-[9px] font-black text-gray-700 uppercase tracking-tighter text-center leading-tight">{s.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Grocery & Kitchen</h2>
            {<section>
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Grocery & Kitchen</h2>
            
            {/* 🚀 NEW: Show a loading spinner if products are still fetching */}
            {products.length === 0 && searchQuery === '' ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-gray-400 text-sm">No products found matching "{searchQuery}"</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((p) => {
                  const inCart = cart.find(c => c.item.id === p.id);
                  return (
                    <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col"> ? (
              <p className="text-gray-400 text-sm">No products found matching "{searchQuery}"</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((p) => {
                  const inCart = cart.find(c => c.item.id === p.id);
                  return (
                    <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                      <div className="bg-gray-50 rounded-xl mb-3 flex items-center justify-center p-2 h-32 relative">
                        <div className="absolute top-2 left-2 bg-white px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold text-purple-600">12 MINS</div>
                        <img src={p.image_url} className="h-full w-full object-contain" alt={p.name} />
                      </div>
                      <div className="text-[10px] text-gray-400 mb-1">{p.unit}</div>
                      <div className="text-sm font-bold text-gray-800 line-clamp-2 h-10 mb-1 leading-tight">{p.name}</div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="font-black text-base text-gray-900">₹{p.price}</span>
                        {inCart ? (
                          <div className="flex items-center bg-green-100 rounded-lg p-1 border border-green-200">
                            <button onClick={() => removeFromCart(p.id)} className="px-2 font-bold text-green-800">-</button>
                            <span className="px-2 font-bold text-sm text-green-900">{inCart.qty}</span>
                            <button onClick={() => addToCart(p)} className="px-2 font-bold text-green-800">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(p)} className="px-4 py-1.5 border border-green-200 bg-green-50 text-green-700 rounded-xl text-xs font-black">ADD</button>
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
          <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden max-w-lg mx-auto">
            <div className="flex overflow-x-auto bg-gray-50 p-2 gap-2 border-b border-gray-100 no-scrollbar">
              {SERVICES.map((s) => (
                <button key={s.id} onClick={() => { setActiveService(s.id); setSelectedOperator(''); setPlans([]); setFetchedBill(null); setUpiResult(null); setRechargeNumber(''); setRechargeAmount(''); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black uppercase transition-all ${activeService === s.id ? 'bg-white shadow-md text-purple-600' : 'text-gray-400'}`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{currentServiceObj.inputLabel}</label>
                  <div className="relative mt-1">
                    <input type="text" placeholder={`Enter details`} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-lg" value={rechargeNumber} onChange={(e) => setRechargeNumber(e.target.value)} />
                    {isDetecting && <div className="absolute right-4 top-4 animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>}
                  </div>
                </div>

                {activeService !== 'upi' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Operator / Provider</label>
                    <select className="w-full mt-1 p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-gray-700" value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
                      <option value="">Choose Provider</option>
                      {Object.keys(OPERATORS_DATA[activeService] || {}).map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                )}

                {activeService === 'upi' ? (
                  <button onClick={handleUpiSearch} disabled={isLoading} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-sky-200 rounded-2xl text-sky-600 text-xs font-black uppercase hover:bg-sky-50 transition-colors disabled:opacity-50">
                    <Search size={16}/> {isLoading ? 'Searching...' : 'Search Bank Network'}
                  </button>
                ) : isPlanBased ? (
                  <button onClick={fetchOffers} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-purple-200 rounded-2xl text-purple-600 text-xs font-black uppercase hover:bg-purple-50 transition-colors">
                    <Ticket size={16}/> View Best Recommended Offers
                  </button>
                ) : (
                  <button onClick={fetchBillDetails} disabled={isLoading || fetchedBill !== null} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-purple-200 rounded-2xl text-purple-600 text-xs font-black uppercase hover:bg-purple-50 transition-colors disabled:opacity-50">
                    <Search size={16}/> {isLoading ? 'Fetching...' : 'Fetch Bill Details'}
                  </button>
                )}

                {upiResult && activeService === 'upi' && (
                  <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex justify-between border-b border-sky-200 pb-2"><span className="text-[10px] font-black text-sky-600 uppercase">Bank Match</span><span className="text-sm font-bold text-gray-900">{upiResult.Name || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-sky-200 pb-2"><span className="text-[10px] font-black text-sky-600 uppercase">Account Status</span><span className={`text-xs font-bold px-2 py-1 rounded ${upiResult.IsAccountExist === false ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{upiResult.IsAccountExist === false ? 'INACTIVE' : 'ACTIVE'}</span></div>
                    <div className="pt-1"><span className="text-[10px] font-black text-sky-600 uppercase block mb-1">Found UPI ID</span><span className="text-lg font-black text-gray-900">{upiResult.Upiid || upiResult.UpiId || upiResult.upi_id?.[0] || 'No ID Found'}</span></div>
                  </div>
                )}

                {fetchedBill && !isPlanBased && activeService !== 'upi' && (
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex justify-between border-b border-emerald-200 pb-2"><span className="text-[10px] font-black text-emerald-600 uppercase">Customer Name</span><span className="text-sm font-bold text-gray-900">{fetchedBill.Name || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-emerald-200 pb-2"><span className="text-[10px] font-black text-emerald-600 uppercase">Due Date</span><span className="text-sm font-bold text-red-600">{fetchedBill.DueDate || 'N/A'}</span></div>
                    <div className="flex justify-between pt-2"><span className="text-[11px] font-black text-emerald-700 uppercase">Total Due</span><span className="text-2xl font-black text-gray-900">₹{fetchedBill.DueAmount || '0'}</span></div>
                  </div>
                )}

                {isPlanBased && plans.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex overflow-x-auto gap-2 no-scrollbar py-1">
                      {planCategories.map((cat) => (
                        <button key={cat} onClick={() => setSelectedPlanCategory(cat)} className={`px-4 py-2 rounded-xl whitespace-nowrap text-[10px] font-black uppercase border ${ selectedPlanCategory === cat ? "bg-purple-600 text-white border-purple-600 shadow-lg" : "bg-white text-gray-500 border-gray-100" }`}>{cat}</button>
                      ))}
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-3 p-2 bg-purple-50 rounded-3xl border border-purple-100">
                      {filteredPlans.map((plan: any, idx: number) => (
                        <div key={idx} onClick={() => setRechargeAmount(plan.amount)} className="bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:border-purple-400 border border-transparent transition-all">
                          <div className="flex justify-between mb-2"><span className="font-black text-purple-700 text-xl">₹{plan.amount}</span><span className="text-[10px] font-black bg-purple-100 px-2 py-1 rounded-lg text-purple-600">{plan.validity}</span></div>
                          <p className="text-[11px] font-medium text-gray-500 leading-snug">{plan.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={(fetchedBill && !isPlanBased) || activeService === 'upi' ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Amount</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-4 text-xl font-bold text-gray-400">₹</span>
                    <input type="number" className="w-full p-4 pl-10 bg-gray-50 rounded-2xl border-none outline-none font-black text-2xl" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} readOnly={(fetchedBill && !isPlanBased) || activeService === 'upi'} />
                  </div>
                </div>
                
                {/* 80% CASHBACK NOTIFICATION */}
                {rechargeAmount !== '' && cashbackEarned > 0 && activeService !== 'upi' && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-3">
                    <History size={18} className="text-green-600"/>
                    <span className="text-green-800 font-bold text-sm">You will get ₹{cashbackEarned} Cashback!</span>
                  </div>
                )}

                {activeService !== 'upi' && (
                  <button onClick={handleRecharge} disabled={isLoading} className="w-full bg-black text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-4">
                    {isLoading ? 'Processing...' : `Proceed to Pay ₹${rechargeAmount || 0}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MY ACCOUNT MODAL */}
      {isAccountOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md h-[75vh] flex flex-col shadow-2xl relative animate-in slide-in-from-bottom-10">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black">My Account</h2>
              <button onClick={() => setIsAccountOpen(false)}><X size={24} className="text-gray-400"/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-2">
              {['My Orders', 'Saved Addresses', "FAQ's", 'Account Privacy'].map((item) => (
                <div key={item} className="flex justify-between items-center py-4 border-b border-gray-50 cursor-pointer">
                  <span className="font-bold text-gray-800">{item}</span><ChevronRight size={18} className="text-gray-400"/>
                </div>
              ))}
              <div onClick={handleLogout} className="flex justify-between items-center py-4 cursor-pointer">
                <span className="font-bold text-red-500">Log Out</span><LogOut size={18} className="text-red-400"/>
              </div>

              <div className="bg-purple-50 p-6 rounded-2xl mt-8 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-purple-600 leading-tight">Simple way to<br/>get groceries<br/>at your doorstep</h3>
                  <p className="text-[10px] text-gray-500 mt-2">Scan the QR code and download zeshu super app</p>
                </div>
                <QrCode size={50} className="text-purple-600"/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COIN HISTORY MODAL */}
      {isCoinHistoryOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md h-[60vh] flex flex-col shadow-2xl relative animate-in slide-in-from-bottom-10">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black">Zeshu Coin History</h2>
              <button onClick={() => setIsCoinHistoryOpen(false)}><X size={24} className="text-gray-400"/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                <p className="text-amber-700 font-bold text-sm text-center">Zeshu coins can be used for recharge and bill payment and for groceries for your next shopping!</p>
              </div>
              <h3 className="font-black mb-4">Recent Transactions</h3>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <div><div className="font-bold">Airtel Prepaid</div><div className="text-xs text-gray-400">Cashback Earned</div></div>
                <div className="text-green-600 font-black">+12 Coins</div>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <div><div className="font-bold">Grocery Order</div><div className="text-xs text-gray-400">Coins Applied</div></div>
                <div className="text-red-500 font-black">-50 Coins</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL DETAILED CART MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col justify-end">
          <div className="bg-gray-50 w-full h-[90vh] rounded-t-[32px] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="bg-white p-5 rounded-t-[32px] flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsCartOpen(false)}><X size={24}/></button>
                <h2 className="text-xl font-black">My Cart</h2>
              </div>
              <span className="text-purple-600 font-bold text-sm">Share</span>
            </div>

            {/* --- 🚀 NEW: DYNAMIC UPSELL BANNERS --- */}
            {itemTotal > 0 && itemTotal < 100 && (
              <div className="bg-red-50 border-b border-red-100 p-2 text-center">
                <span className="text-red-500 font-bold text-[10px] uppercase tracking-wider">Add ₹{100 - itemTotal} more to avoid the ₹20 Small Cart Fee!</span>
              </div>
            )}
            {itemTotal > 0 && itemTotal < 200 && (
              <div className="bg-purple-50 border-b border-purple-100 p-3 text-center">
                <span className="text-purple-600 font-bold text-xs">Add ₹{200 - itemTotal} more to skip the ₹30 Delivery Charge!</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm"><Clock className="text-purple-600"/><span className="font-black">Delivery in 20 minutes</span></div>

              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">Shipment of {cart.length} item</h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                {cart.map((c, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-800">{c.item.name}</div>
                      <div className="text-[10px] text-gray-400">{c.item.unit}</div>
                      <div className="font-black mt-1 text-gray-900">₹{c.item.price * c.qty}</div>
                    </div>
                    <div className="flex items-center bg-green-100 rounded-lg p-1">
                      <button onClick={() => removeFromCart(c.item.id)} className="px-2 font-bold text-green-800">-</button>
                      <span className="px-2 font-bold text-sm text-green-900">{c.qty}</span>
                      <button onClick={() => addToCart(c.item)} className="px-2 font-bold text-green-800">+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Zeshu Coin Toggle */}
              <div className={`bg-white p-4 rounded-2xl shadow-sm flex items-center border ${useZeshuCoins ? 'border-purple-600 bg-purple-50' : 'border-transparent'}`}>
                <div className="bg-purple-600 text-white font-black p-2 rounded-lg text-sm shadow-sm mr-3">Z</div>
                <div className="flex-1">
                  <div className="font-bold">Zeshu Coins Balance: {coinsBalance}</div>
                  <div className="text-xs text-gray-500">You can save ₹{Math.min(ZESHU_COINS_VAL, itemTotal)}</div>
                </div>
                <button onClick={() => setUseZeshuCoins(!useZeshuCoins)} className={`px-4 py-2 rounded-xl font-bold text-xs ${useZeshuCoins ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                  {useZeshuCoins ? 'REMOVE' : 'APPLY'}
                </button>
              </div>

              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">Bill Details</h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex justify-between text-sm text-gray-500"><span>Items total</span><span className="font-bold text-gray-800">₹{itemTotal}</span></div>
                
                {useZeshuCoins && <div className="flex justify-between text-sm text-purple-600 font-bold"><span>Zeshu Coins</span><span>-₹{zeshuDiscount}</span></div>}
                
                {/* --- 🚀 NEW: SMALL CART FEE DISPLAY --- */}
                {smallCartFee > 0 && <div className="flex justify-between text-sm text-red-500"><span>Small cart fee</span><span className="font-bold">₹{smallCartFee}</span></div>}
                
                <div className="flex justify-between text-sm text-gray-500"><span>Handling charge</span><span className="font-bold text-gray-800">₹{HANDLING_FEE}</span></div>
                
                {/* --- 🚀 UPDATED: DYNAMIC DELIVERY CHARGE --- */}
                <div className="flex justify-between text-sm text-gray-500"><span>Delivery charge</span><span className={`font-bold ${deliveryCharge===0 ? 'text-purple-600' : 'text-gray-800'}`}>{deliveryCharge===0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
                
                <div className="flex justify-between font-black text-lg pt-3 border-t border-gray-100 mt-2"><span>Grand total</span><span>₹{finalCartTotal}</span></div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-bold">Feeding India donation</div>
                  <div className="text-xs text-gray-400 w-4/5">Working towards a malnutrition free India.</div>
                </div>
                <button onClick={() => setIsDonating(!isDonating)} className="flex flex-col items-center">
                  {isDonating ? <CheckSquare className="text-purple-600"/> : <Square className="text-gray-300"/>}
                  <span className="font-bold text-xs mt-1">₹1</span>
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <div className="font-bold">Tip your delivery partner</div>
                <div className="text-xs text-gray-400 mb-3">100% of your tip goes to your partner.</div>
                <div className="flex gap-2">
                  {[20, 30, 50].map(amt => (
                    <button key={amt} onClick={() => setTipAmount(tipAmount === amt ? 0 : amt)} className={`flex-1 py-2 rounded-xl border text-sm font-bold ${tipAmount === amt ? 'bg-purple-50 border-purple-600 text-purple-600' : 'border-gray-200 text-gray-700'}`}>₹{amt}</button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center">
                <div className="bg-gray-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold mr-3">E</div>
                <div className="flex-1">
                  <div className="text-[10px] text-gray-400 uppercase">Delivering to</div>
                  <div className="font-bold text-sm truncate">{currentAddress}</div>
                </div>
                <span className="text-purple-600 font-bold text-sm">Change</span>
              </div>
              <div className="h-10"></div>
            </div>

            <div className="bg-white p-4 border-t border-gray-100 flex justify-between items-center pb-8">
              <div><div className="text-2xl font-black">₹{finalCartTotal}</div><div className="text-[10px] font-black text-purple-600 tracking-widest">TOTAL</div></div>
              <button onClick={handleCartCheckout} disabled={isLoading} className="bg-green-400 text-gray-900 font-black px-8 py-4 rounded-xl flex items-center gap-2 shadow-md">
                {isLoading ? 'Processing...' : 'Proceed To Pay'} <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-gray-400"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-6 text-center">Login to Zeshu</h2>
            {!otpSent ? (
              <div className="space-y-4">
                <div className="flex items-center border-2 border-gray-100 rounded-2xl p-2 bg-gray-50">
                  <span className="font-black text-gray-400 px-3">+91</span>
                  <input type="tel" maxLength={10} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full outline-none font-bold text-lg bg-transparent" placeholder="Mobile Number" />
                </div>
                <button onClick={handleSendOtp} disabled={isLoading || phoneNumber.length !== 10} className="w-full bg-black text-white font-black uppercase py-4 rounded-2xl disabled:opacity-50">
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="number" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full border-2 border-purple-600 rounded-2xl p-4 outline-none font-black text-center text-2xl tracking-[0.5em]" placeholder="------" />
                <button onClick={handleVerifyOtp} disabled={isLoading || otp.length !== 6} className="w-full bg-purple-600 text-white font-black uppercase py-4 rounded-2xl disabled:opacity-50">
                  {isLoading ? 'Verify & Continue' : 'Verify OTP'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <div className="flex justify-between items-center p-4 bg-black text-white z-10"><h2 className="text-lg font-black tracking-widest uppercase">Scan any QR</h2><button onClick={() => setIsScannerOpen(false)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><X size={24} /></button></div>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <Scanner onScan={(r) => { if(r && r.length>0){ const d = parseUpiData(r[0].rawValue); if(d && d.payeeAddress){ setScannedPayee(d); setScanAmount(d.amount); setIsScannerOpen(false); } } }} components={{ audio: false, torch: true }} styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }} />
            <div className="absolute inset-0 pointer-events-none border-[60px] border-black/50"><div className="w-full h-full border-2 border-dashed border-white/50 rounded-3xl relative"><div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-2xl"></div><div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-2xl"></div><div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-2xl"></div><div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-2xl"></div></div></div>
          </div>
          <div className="p-8 bg-black text-center text-white/70 text-sm font-bold">Align the QR code within the frame to scan</div>
        </div>
      )}

      {/* SCANNED PAYEE MODAL */}
      {scannedPayee && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-start mb-6"><div><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paying</h3><h2 className="text-2xl font-black text-gray-900 leading-none mt-1">{scannedPayee.payeeName ? decodeURIComponent(scannedPayee.payeeName) : 'Merchant'}</h2><p className="text-xs text-purple-600 font-bold mt-1">{scannedPayee.payeeAddress}</p></div><button onClick={() => setScannedPayee(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button></div>
            <div className="space-y-6"><div className="relative"><span className="absolute left-0 top-2 text-4xl font-black text-gray-300">₹</span><input type="number" className="w-full text-5xl font-black text-gray-900 bg-transparent border-none outline-none pl-12 py-2 border-b-2 border-gray-100 focus:border-purple-600 transition-colors" placeholder="0" value={scanAmount} onChange={(e) => setScanAmount(e.target.value)} autoFocus /></div><button onClick={() => alert(`Triggering Razorpay for ₹${scanAmount}`)} disabled={!scanAmount || Number(scanAmount) <= 0} className="w-full bg-black text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50">Pay Securely</button></div>
          </div>
        </div>
      )}
      
      {/* FLOATING CART SUMMARY */}
      {cart.length > 0 && activeTab === 'home' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md z-[60]">
          <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center bg-purple-700 text-white p-4 rounded-2xl shadow-lg cursor-pointer" onClick={() => setIsCartOpen(true)}>
            <div className="flex items-center gap-3"><ShoppingBag size={20} /><div className="text-lg font-black">₹{finalCartTotal}</div></div>
            <div className="flex items-center gap-1 font-black uppercase text-sm">View Cart <ChevronRight size={20} /></div>
          </div>
        </div>
      )}
    </div>
  );
}