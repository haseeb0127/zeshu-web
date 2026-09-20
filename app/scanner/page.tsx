"use client";
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, IndianRupee, ShieldCheck, Image as ImageIcon, Camera, BookUser } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState('Scanned UPI recipient');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [recipientMode, setRecipientMode] = useState<'QR' | 'CONTACT'>('QR');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const handleSuccessfulScan = useCallback(async (text: string) => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
    setRecipientMode('QR');
    setContactPhone('');
    setContactMessage('');
    setScanResult(text);
    setUpiId('');
    setMerchantName('Scanned UPI recipient');
    try {
      if (text.startsWith('upi://')) {
        const url = new URL(text);
        const params = new URLSearchParams(url.search);
        if (params.get('pn')) setMerchantName(decodeURIComponent(params.get('pn')!));
        if (params.get('pa')) setUpiId(params.get('pa')!);
        if (params.get('am')) setAmount(params.get('am')!);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isScanning) return;
    let isMounted = true;
    const startCamera = async () => {
      try {
        if (html5QrCodeRef.current) {
          try { await html5QrCodeRef.current.stop(); } catch {}
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
      } catch {
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
  }, [handleSuccessfulScan, isScanning]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const html5QrCode = html5QrCodeRef.current || new Html5Qrcode("reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccessfulScan(decodedText);
    } catch {
      alert("Could not detect a valid QR code. Try another photo!");
    }
  };

  const chooseContactRecipient = async () => {
    setContactMessage('');
    if (!('contacts' in navigator) || !('ContactsManager' in window)) {
      setContactMessage('Contact picker is not supported on this device. You can still scan a QR.');
      return;
    }
    try {
      const contacts: any[] = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
      const selected = contacts?.[0];
      const phone = String(selected?.tel?.[0] || '').replace(/\D/g, '').slice(-10);
      const nameValue = Array.isArray(selected?.name) ? selected.name[0] : selected?.name;
      const name = String(nameValue || '').trim();
      if (!phone) {
        setContactMessage('That contact does not have a usable mobile number.');
        return;
      }
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop().catch(() => undefined);
      }
      setRecipientMode('CONTACT');
      setMerchantName(name || 'Selected contact');
      setContactPhone(phone);
      setScanResult(null);
      setUpiId('');
      setAmount('');
      setIsScanning(false);
      setContactMessage('Contact selected. No money is sent; payments will be enabled only after verified UPI settlement is available.');
    } catch {
      setContactMessage('Contact selection cancelled.');
    }
  };

  const restartScanner = () => {
    setRecipientMode('QR');
    setContactPhone('');
    setContactMessage('');
    setMerchantName('Scanned UPI recipient');
    setUpiId('');
    setAmount('');
    setScanResult(null);
    setCameraError(null);
    setIsScanning(true);
  };

  // Real QR/contact payment execution is intentionally absent until Zeshu has a verified
  // PSP/UPI settlement integration and server-side reconciliation for those transactions.

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans selection:bg-indigo-500/30">

      <header className="p-4 flex items-center justify-between border-b border-slate-800">
        <button type="button" aria-label="Close scanner and return home" onClick={() => router.push('/')} className="p-2 bg-slate-800 rounded-full active:scale-95 transition-transform">
          <X size={24} className="text-slate-400" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-500" />
          <span className="font-bold text-sm text-slate-300">Zeshu QR • UPI tools</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {isScanning && (
          <div className="w-full max-w-md flex flex-col items-center">
            <h2 className="text-2xl font-black mb-1 tracking-tight text-center">Scan any Shop QR</h2>
            <p className="text-slate-400 text-sm mb-2 text-center">The QR scanner works across India.</p>
            <p className="text-amber-300/90 text-xs mb-6 text-center">QR/contact payment and funded cashback will appear only after a verified payment and settlement integration is enabled.</p>
            
            <div className="w-full aspect-square bg-slate-900 rounded-3xl overflow-hidden border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] relative flex items-center justify-center">
              <div id="reader" className="w-full h-full object-cover"></div>
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center z-20">
                  <Camera size={40} className="text-amber-400 mb-3 animate-bounce" />
                  <p className="text-sm font-bold text-slate-200 mb-4">{cameraError}</p>
                  <label className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-500/30 cursor-pointer">Upload a QR image<input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" /></label>
                </div>
              )}
              {!cameraError && (
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_#6366F1] animate-[scan_2s_ease-in-out_infinite] z-10 pointer-events-none"></div>
              )}
            </div>

            <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
              <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-sm">
                <ImageIcon size={18} className="text-indigo-400" /> Upload QR
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <button type="button" onClick={() => void chooseContactRecipient()} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm">
                <BookUser size={18} className="text-emerald-400" /> Choose contact
              </button>
            </div>
            {contactMessage && <p className="mt-3 text-center text-xs font-bold leading-5 text-slate-400" role="status">{contactMessage}</p>}
          </div>
        )}

        {!isScanning && (
          <div className="w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
              <span className="text-3xl font-black text-indigo-400">{merchantName.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-black mb-1 tracking-tight text-center">{recipientMode === 'CONTACT' ? merchantName : `QR recipient: ${merchantName}`}</h2>
            <p className="text-slate-400 text-xs mb-2 text-center truncate w-full px-4 font-mono">{recipientMode === 'CONTACT' ? `••••••${contactPhone.slice(-4)}` : (upiId || scanResult)}</p>
            <p className="mb-6 max-w-sm text-center text-xs font-bold leading-5 text-amber-300/90">{recipientMode === 'CONTACT' ? 'Contact selected for the future pay-to-contact flow. Zeshu has not sent or moved any money.' : 'QR details were read locally. Payment remains disabled until verified settlement is enabled.'}</p>

            <div className="w-full bg-slate-800/50 border border-slate-700 p-6 rounded-3xl mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Amount preview</label>
              <div className="flex items-center text-5xl font-black text-white">
                <IndianRupee size={40} className="text-slate-500 mr-2" />
                <input type="number" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent border-none outline-none w-full placeholder:text-slate-700" placeholder="0" />
              </div>
            </div>

            <button type="button" disabled className="w-full rounded-2xl bg-slate-800 py-5 text-lg font-black text-slate-500">{recipientMode === 'CONTACT' ? 'Contact payments unavailable' : 'QR payments unavailable'}</button>{/*
              {isProcessing ? (<><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> Opening Secure Gateway...</>) : (`Pay ₹${amount || '0'} with Zeshu`)}
            </button>
            */}<button onClick={restartScanner} className="mt-4 text-xs text-slate-400 font-bold hover:text-white">{recipientMode === 'CONTACT' ? 'Scan a QR instead' : 'Scan Different QR'}</button>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(220px); } }
      `}} />

    </div>
  );
}
