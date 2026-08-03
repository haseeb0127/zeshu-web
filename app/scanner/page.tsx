"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Confetti from 'react-confetti';
import { QrCode, X, IndianRupee, Gift, CheckCircle2, ShieldCheck, Image as ImageIcon, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Script from 'next/script'; // Import Script for Razorpay

export default function ScannerPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState('Local Kirana Store');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashbackWon, setCashbackWon] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    if (!isScanning) return;
    let isMounted = true;
    const startCamera = async () => {
      try {
        if (html5QrCodeRef.current) {
          try { await html5QrCodeRef.current.stop(); } catch(e){}
        }
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const devices = await Html5Qrcode.getCameras();
        
        if (!devices || devices.length === 0) {
          setCameraError("No camera detected on this device.");
          return;
        }
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        const selectedCameraId = backCamera ? backCamera.id : devices[0].id;

        if (!isMounted) return;

        await html5QrCode.start(
          selectedCameraId,
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => { handleSuccessfulScan(decodedText); },
          () => {} 
        );
      } catch (err: any) {
        if (isMounted) {
          setCameraError(
            window.location.hostname !== 'localhost' && window.location.protocol === 'http:'
              ? "Browsers block live cameras on HTTP IP addresses. Upload a QR image instead!"
              : "Camera access denied. Check browser permissions."
          );
        }
      }
    };
    const timer = setTimeout(startCamera, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const handleSuccessfulScan = async (text: string) => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
    setScanResult(text);
    try {
      if (text.startsWith('upi://')) {
        const url = new URL(text);
        const params = new URLSearchParams(url.search);
        if (params.get('pn')) setMerchantName(decodeURIComponent(params.get('pn')!));
        if (params.get('am')) setAmount(params.get('am')!);
      }
    } catch (e) {}
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const html5QrCode = html5QrCodeRef.current || new Html5Qrcode("reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccessfulScan(decodedText);
    } catch (err) {
      alert("Could not detect a valid QR code. Try another photo!");
    }
  };

  // 🚀 INTEGRATED RAZORPAY PAYMENT LOGIC
  const processPayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setIsProcessing(true);

    try {
      // 1. Ask Next.js to generate an Order ID
      const orderResponse = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) })
      });
      const orderData = await orderResponse.json();

      // 2. Open Razorpay Gateway
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.amount, 
        currency: orderData.currency || 'INR', 
        name: merchantName, 
        description: "Zeshu UPI QR Payment",
        order_id: orderData.id || orderData.order?.id,
        handler: async function (response: any) { 
          // PAYMENT WAS SUCCESSFUL
          setIsProcessing(false);
          
          // Calculate random cashback
          const txnAmount = Number(amount);
          const randomPercent = Math.random() * (0.05 - 0.01) + 0.01;
          let calculatedCashback = Math.floor(txnAmount * randomPercent);
          if (calculatedCashback < 2) calculatedCashback = 2;
          if (calculatedCashback > 20) calculatedCashback = 20;

          setCashbackWon(calculatedCashback);
          
          try {
            new Audio('https://assets.mixkit.co/active-storage/sfx/2018/2018-preview.mp3').play();
          } catch (e) {}
        },
        theme: { color: "#4F46E5" },
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
         setIsProcessing(false);
         alert("Payment Failed. Please try again.");
      });
      rzp.open();

    } catch (error) { 
      setIsProcessing(false);
      alert("Payment Gateway Error"); 
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans selection:bg-indigo-500/30">
      {cashbackWon !== null && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}

      <header className="p-4 flex items-center justify-between border-b border-slate-800">
        <button onClick={() => router.push('/')} className="p-2 bg-slate-800 rounded-full active:scale-95 transition-transform">
          <X size={24} className="text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-500" />
          <span className="font-bold text-sm text-slate-300">Zeshu Pay • UPI</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {isScanning && (
          <div className="w-full max-w-md flex flex-col items-center">
            <h2 className="text-2xl font-black mb-1 tracking-tight text-center">Scan any Shop QR</h2>
            <p className="text-slate-400 text-sm mb-6 text-center">Pay with Zeshu & win instant cashback</p>
            
            <div className="w-full aspect-square bg-slate-900 rounded-3xl overflow-hidden border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] relative flex items-center justify-center">
              <div id="reader" className="w-full h-full object-cover"></div>
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center z-20">
                  <Camera size={40} className="text-amber-400 mb-3 animate-bounce" />
                  <p className="text-sm font-bold text-slate-200 mb-4">{cameraError}</p>
                  <button onClick={() => handleSuccessfulScan("upi://pay?pa=shop@ybl&pn=Zeshu%20Mart&am=100")} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-500/30">
                    Simulate Successful Scan
                  </button>
                </div>
              )}
              {!cameraError && (
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_#6366F1] animate-[scan_2s_ease-in-out_infinite] z-10 pointer-events-none"></div>
              )}
            </div>

            <div className="mt-6 w-full flex items-center gap-3">
              <label className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-sm">
                <ImageIcon size={18} className="text-indigo-400" /> Upload QR from Gallery
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {!isScanning && !cashbackWon && (
          <div className="w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
              <span className="text-3xl font-black text-indigo-400">{merchantName.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-black mb-1 tracking-tight text-center">Paying {merchantName}</h2>
            <p className="text-slate-400 text-xs mb-8 text-center truncate w-full px-4 font-mono">{scanResult}</p>

            <div className="w-full bg-slate-800/50 border border-slate-700 p-6 rounded-3xl mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Enter Amount</label>
              <div className="flex items-center text-5xl font-black text-white">
                <IndianRupee size={40} className="text-slate-500 mr-2" />
                <input type="number" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent border-none outline-none w-full placeholder:text-slate-700" placeholder="0" />
              </div>
            </div>

            <button onClick={processPayment} disabled={isProcessing || !amount} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-lg shadow-lg shadow-indigo-500/20">
              {isProcessing ? (<><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> Opening Secure Gateway...</>) : (`Pay ₹${amount || '0'} with Zeshu`)}
            </button>
            <button onClick={() => setIsScanning(true)} className="mt-4 text-xs text-slate-400 font-bold hover:text-white">Scan Different QR</button>
          </div>
        )}

        {cashbackWon !== null && (
          <div className="w-full max-w-md flex flex-col items-center text-center animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={48} className="text-emerald-400" />
            </div>
            
            <h2 className="text-3xl font-black mb-2 text-white">Payment Successful</h2>
            <p className="text-slate-400 font-medium mb-10">₹{amount} paid securely to {merchantName}</p>

            <div className="w-full bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/30 p-8 rounded-3xl relative overflow-hidden shadow-2xl shadow-indigo-500/20">
              <Gift size={32} className="text-amber-400 mx-auto mb-4" />
              <p className="text-indigo-200 font-bold mb-1 uppercase tracking-widest text-sm">Super Cashback Won!</p>
              <div className="flex items-center justify-center text-5xl font-black text-white drop-shadow-md mb-2">
                <IndianRupee size={40} className="text-amber-400" />
                <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">{cashbackWon}</span>
              </div>
              <p className="text-indigo-200/80 text-sm">Added directly to your Zeshu Wallet</p>
            </div>

            <button onClick={() => router.push('/')} className="mt-10 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all">Back to Home</button>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(220px); } }
      `}} />

      {/* REQUIRED FOR RAZORPAY TO LOAD IN THE SCANNER PAGE */}
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}