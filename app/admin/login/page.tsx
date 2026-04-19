"use client";
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("Access Denied: " + error.message);
      setLoading(false);
    } else {
      // 🔒 Optional: Check if this specific email is authorized as an admin
      if (data.user?.email === "admin@zeshu.in") { // Replace with your actual email
        router.push('/admin/dashboard');
      } else {
        alert("Unauthorized account.");
        await supabase.auth.signOut();
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-purple-600 p-4 rounded-2xl shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-center mb-2">Zeshu Command Center</h1>
        <p className="text-gray-500 text-center text-sm mb-8">Authorized Personnel Only</p>
        
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Email</label>
            <input type="email" required className="w-full mt-1 p-4 bg-gray-50 rounded-xl outline-none border focus:border-purple-500 font-bold" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
            <div className="relative mt-1">
              <input type="password" required className="w-full p-4 bg-gray-50 rounded-xl outline-none border focus:border-purple-500 font-bold" value={password} onChange={e => setPassword(e.target.value)} />
              <Lock size={18} className="absolute right-4 top-4 text-gray-400" />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-black text-white font-black py-4 rounded-xl mt-4 hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}