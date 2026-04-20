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
import { Scanner } from '@yudiel/react-qr-scanner'; 

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
  const [scannedPayee, setScannedPayee] = useState<any>(null); 
  const [scanAmount, setScanAmount] = useState('');

  const currentServiceObj = SERVICES.find(s => s.id === activeService) || SERVICES[0];
  const isPlanBased = activeService === 'mobile' || activeService === 'dth'; 

  const ZESHU_COINS_VAL = 50;
  const HANDLING_FEE = 5;

  // PRODUCT CATEGORY LOGIC
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

  // REALTIME ORDER TRACKER EFFECT
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
    <div className="max-w-screen-xl mx-auto w-full bg-slate-50 min-h-screen pb-40 font-sans antialiased text-gray-900 overflow-hidden relative">
      
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
          
          {/* LIVE ORDER TRACKER */}
          {myOrders.length > 0 && myOrders[0].status !== 'DELIVERED' && (
            <section className="bg-white p-5 rounded-3xl shadow-lg border-2 border-purple-100 mb-6 animate-pulse">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-purple-600">Live Order Status</h2>
                <span className="text-[10px] font-bold bg-purple-100 px-2 py-1 rounded-lg text-purple-600">#{myOrders[0].id.split('-')[0].toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
                <div className={`absolute top-1/2 left-0 h-1 bg-purple-600 -translate-y-1/2 z-0 transition-all duration-500`} style={{ width: myOrders[0].status === 'PENDING' ? '30%' : '70%' }}></div>
                <div className="z-10 flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${myOrders[0].status === 'PENDING' || 'OUT_FOR_DELIVERY' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}><Clock size={14}/></div>
                  <span className="text-[9px] font-black mt-2 uppercase">Packing</span>
                </div>
                <div className="z-10 flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${myOrders[0].status === 'OUT_FOR_DELIVERY' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}><Car size={14}/></div>
                  <span className="text-[9px] font-black mt-2 uppercase">On the Way</span>
                </div>
                <div className="z-10 flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-400`}><CheckCircle size={14}/></div>
                  <span className="text-[9px] font-black mt-2 uppercase">Arrived</span>
                </div>
              </div>
              {myOrders[0].status === 'OUT_FOR_DELIVERY' && (
                <div className="mt-4 bg-purple-50 p-3 rounded-xl flex items-center gap-3 border border-purple-100">
                  <div className="animate-bounce"><Car size={20} className="text-purple-600"/></div>
                  <p className="text-xs font-bold text-purple-700">Rider is arriving in 10 mins!</p>
                </div>
              )}
            </section>
          )}

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
            
            {/* CATEGORY SCROLL BAR */}
            {products.length > 0 && (
              <div className="flex overflow-x-auto gap-2 mb-6 no-scrollbar pb-2">
                {productCategories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-full whitespace-nowrap text-xs font-black uppercase tracking-wider transition-all ${activeCategory === cat ? 'bg-black text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
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
              <p className="text-gray-400 text-sm">No products found in {activeCategory}</p>
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
                      
                      {/* ADDED CATEGORY AND WEIGHT DISPLAY HERE */}
                      <div className="text-[10px] text-gray-400 mb-1 font-bold uppercase">
                        {p.category || 'General'} • {p.weight || 'N/A'}
                      </div>
                      
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Operator</label>
                    <select className="w-full mt-1 p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700" value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
                      <option value="">Choose Provider</option>
                      {Object.keys(OPERATORS_DATA[activeService] || {}).map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                )}
                {activeService === 'upi' ? (
                  <button onClick={handleUpiSearch} disabled={isLoading} className="w-full p-3 border-2 border-dashed border-sky-200 rounded-2xl text-sky-600 text-xs font-black uppercase">
                    {isLoading ? 'Searching...' : 'Search Bank Network'}
                  </button>
                ) : isPlanBased ? (
                  <button onClick={fetchOffers} className="w-full p-3 border-2 border-dashed border-purple-200 rounded-2xl text-purple-600 text-xs font-black uppercase">
                    View Offers
                  </button>
                ) : (
                  <button onClick={fetchBillDetails} disabled={isLoading} className="w-full p-3 border-2 border-dashed border-purple-200 rounded-2xl text-purple-600 text-xs font-black uppercase">
                    {isLoading ? 'Fetching...' : 'Fetch Bill Details'}
                  </button>
                )}
                <div className={(fetchedBill && !isPlanBased) || activeService === 'upi' ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Amount</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-4 text-xl font-bold text-gray-400">₹</span>
                    <input type="number" className="w-full p-4 pl-10 bg-gray-50 rounded-2xl outline-none font-black text-2xl" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} readOnly={(fetchedBill && !isPlanBased) || activeService === 'upi'} />
                  </div>
                </div>
                {activeService !== 'upi' && (
                  <button onClick={handleRecharge} disabled={isLoading} className="w-full bg-black text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl mt-4">
                    {isLoading ? 'Processing...' : `Proceed to Pay ₹${rechargeAmount || 0}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CART MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col justify-end">
          <div className="bg-gray-50 w-full h-[90vh] rounded-t-[32px] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="bg-white p-5 rounded-t-[32px] flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsCartOpen(false)}><X size={24}/></button>
                <h2 className="text-xl font-black">My Cart</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {cart.map((c, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-gray-800">{c.item.name}</div>
                      <div className="font-black mt-1 text-gray-900">₹{c.item.price * c.qty}</div>
                    </div>
                    <div className="flex items-center bg-green-100 rounded-lg p-1">
                      <button onClick={() => removeFromCart(c.item.id)} className="px-2 font-bold">-</button>
                      <span className="px-2 font-bold">{c.qty}</span>
                      <button onClick={() => addToCart(c.item)} className="px-2 font-bold">+</button>
                    </div>
                  </div>
               ))}
               <div className="bg-white p-4 rounded-2xl font-black text-lg flex justify-between">
                 <span>Grand Total</span>
                 <span>₹{finalCartTotal}</span>
               </div>
            </div>
            <div className="bg-white p-4 border-t pb-8">
              <button onClick={handleCartCheckout} className="w-full bg-green-400 text-gray-900 font-black py-4 rounded-xl shadow-md">
                Proceed To Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-6 text-center">Login</h2>
            {!otpSent ? (
              <div className="space-y-4">
                <input type="tel" maxLength={10} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-4 border-2 rounded-2xl" placeholder="Mobile Number" />
                <button onClick={handleSendOtp} className="w-full bg-black text-white font-black py-4 rounded-2xl">Send OTP</button>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="number" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full border-2 rounded-2xl p-4 text-center text-2xl" placeholder="------" />
                <button onClick={handleVerifyOtp} className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl">Verify OTP</button>
              </div>
            )}
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