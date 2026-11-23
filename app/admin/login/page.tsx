"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock } from 'lucide-react';
import { adminSupabase } from '../../lib/browser-supabase';

const supabase = adminSupabase();

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stagingQaAvailable, setStagingQaAvailable] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setStagingQaAvailable(window.location.hostname === 'zeshu-web-staging.asif-mohammed0127.workers.dev');
  }, []);

  const handleStagingAdminLogin = async () => {
    if (!stagingQaAvailable || loading) return;
    setLoading(true);
    try {
      const response = await fetch('/api/staging/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: 'admin' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.tokenHash) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Staging admin sign-in is unavailable.');
      const { data, error } = await supabase.auth.verifyOtp({ token_hash: String(payload.tokenHash), type: 'magiclink' });
      if (error || !data.user) throw new Error('Could not start the staging admin session.');
      const { data: role } = await supabase.from('admin_roles').select('user_id').eq('user_id', data.user.id).eq('role', 'admin').maybeSingle();
      if (!role) throw new Error('Staging admin role is unavailable.');
      router.push('/admin/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Staging admin sign-in is unavailable.');
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("Access Denied: " + error.message);
      setLoading(false);
    } else {
      const { data: role } = await supabase.from('admin_roles').select('user_id').eq('user_id', data.user?.id || '').eq('role', 'admin').maybeSingle();
      if (role) {
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
        
        {stagingQaAvailable && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-black text-emerald-900">Staging test mode</p>
          <p className="mt-1 text-[11px] leading-4 text-emerald-800">Use the isolated staging admin account. No password is required and production is not affected.</p>
          <button type="button" onClick={() => void handleStagingAdminLogin()} disabled={loading} className="mt-3 w-full rounded-xl bg-emerald-700 py-3 text-sm font-black text-white disabled:opacity-60">{loading ? 'Signing in…' : 'Continue as staging admin'}</button>
        </div>}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Email</label>
            <input id="admin-email" type="email" required className="w-full mt-1 p-4 bg-gray-50 rounded-xl outline-none border focus:border-purple-500 font-bold" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
            <div className="relative mt-1">
              <input id="admin-password" type="password" required className="w-full p-4 bg-gray-50 rounded-xl outline-none border focus:border-purple-500 font-bold" value={password} onChange={e => setPassword(e.target.value)} />
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
