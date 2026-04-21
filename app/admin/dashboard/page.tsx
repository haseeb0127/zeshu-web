"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  LogOut, Send, PackagePlus, Trash2, Store, IndianRupee, Wallet, CheckCircle2, Image as ImageIcon, PlusCircle
} from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const MY_RIDERS = [
  { name: 'Rider 1', id: '7754e8bf-5aff-4b44-901b-fdd28f2113cf' }, 
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'payouts' | 'banners'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]); // 🚀 Added Banners State
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedRiders, setSelectedRiders] = useState<{[key: string]: string}>({});
  
  // Consolidated product state
  const [newProduct, setNewProduct] = useState({ 
    name: '', price: '', unit: '', image_url: '', category: 'General', quantity: '', weight: ''    
  });

  // Banner states
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isBannerLoading, setIsBannerLoading] = useState(false);
  
  const router = useRouter();

  const fetchData = async () => {
    const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
    const { data: productData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data: bannerData } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
    
    if (orderData) setOrders(orderData);
    if (productData) setProducts(productData);
    if (bannerData) setBanners(bannerData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin-hq-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const audio = new Audio('/alert.mp3');
            audio.play().catch(() => console.log("Sound blocked!"));
          }
          fetchData(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const assignToRider = async (orderId: string) => {
    const riderId = selectedRiders[orderId];
    if (!riderId) return alert("Select a rider first!");
    await supabase.from('orders').update({ status: 'OUT_FOR_DELIVERY', assigned_rider_id: riderId }).eq('id', orderId);
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('products').insert([{ 
      name: newProduct.name, 
      price: Number(newProduct.price), 
      unit: newProduct.unit, 
      image_url: newProduct.image_url, 
      category: newProduct.category,
      quantity: Number(newProduct.quantity),
      weight: newProduct.weight
    }]);
    setNewProduct({ name: '', price: '', unit: '', image_url: '', category: 'General', quantity: '', weight: '' });
  };

  const deleteProduct = async (id: string) => {
    if(confirm("Are you sure you want to delete this?")) await supabase.from('products').delete().eq('id', id);
  };

  const toggleStock = async (id: string, currentStatus: boolean) => {
    await supabase.from('products').update({ in_stock: !currentStatus }).eq('id', id);
  };

  // 🚀 Banner Management Functions
  const handleAddBanner = async () => {
    if (!newImageUrl) return;
    setIsBannerLoading(true);
    const { error } = await supabase.from('banners').insert([{ image_url: newImageUrl }]);
    setIsBannerLoading(false);
    if (!error) {
      setNewImageUrl('');
      fetchData();
      alert("Banner Added!");
    } else {
      alert("Error adding banner");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if(!confirm("Delete this banner?")) return;
    await supabase.from('banners').delete().eq('id', id);
    fetchData();
  };

  const riderPayouts = useMemo(() => {
    const payouts: Record<string, { id: string, name: string, total: number, deliveries: number }> = {};
    
    orders.forEach(order => {
      if (order.status === 'DELIVERED' && order.payout_status !== 'PAID' && order.assigned_rider_id) {
        if (!payouts[order.assigned_rider_id]) {
          const riderName = MY_RIDERS.find(r => r.id === order.assigned_rider_id)?.name || 'Unknown Rider';
          payouts[order.assigned_rider_id] = { id: order.assigned_rider_id, name: riderName, total: 0, deliveries: 0 };
        }
        payouts[order.assigned_rider_id].total += (Number(order.delivery_fee) || 30);
        payouts[order.assigned_rider_id].deliveries += 1;
      }
    });
    return Object.values(payouts);
  }, [orders]);

  const markRiderPaid = async (riderId: string) => {
    if(confirm("Confirm you have transferred the money to this rider?")) {
      await supabase.from('orders').update({ payout_status: 'PAID' }).eq('assigned_rider_id', riderId).eq('status', 'DELIVERED').neq('payout_status', 'PAID');
      fetchData(); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-2 rounded-xl"><Store size={24} /></div>
          <div><h1 className="font-black text-xl tracking-tighter uppercase text-white">Zeshu HQ</h1><p className="text-[10px] font-bold text-purple-400 tracking-[0.2em] uppercase leading-none">Command Center</p></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setAudioEnabled(!audioEnabled)} className={`${audioEnabled ? 'bg-green-500' : 'bg-amber-500'} text-black text-[10px] font-black px-3 py-1.5 rounded-lg transition-all`}>{audioEnabled ? 'AUDIO LIVE 🔊' : 'ENABLE AUDIO 🔈'}</button>
          <button onClick={() => { supabase.auth.signOut(); router.push('/admin/login'); }} className="bg-zinc-800 p-2.5 rounded-xl"><LogOut size={20} color="white" /></button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-4 border-b border-slate-200 pb-px overflow-x-auto no-scrollbar">
          {['orders', 'inventory', 'payouts', 'banners'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
           <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-100">
                   <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order / Items</th>
                   <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                   <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {orders.map((order) => (
                   <tr key={order.id} className={order.status === 'PENDING' ? 'bg-purple-50/30' : 'hover:bg-slate-50'}>
                     <td className="p-5">
                       <div className="font-mono text-xs font-bold">#{order.id.split('-')[0].toUpperCase()}</div>
                       <div className="text-xs text-slate-500 mt-1">{order.items?.map((i:any) => `${i.qty}x ${i.item.name}`).join(', ')}</div>
                     </td>
                     <td className="p-5 font-black text-xs">{order.status}</td>
                     <td className="p-5">
                       {order.status === 'PENDING' && (
                         <div className="flex gap-2">
                           <select onChange={(e) => setSelectedRiders({...selectedRiders, [order.id]: e.target.value})} className="border p-2 rounded-xl text-xs font-bold bg-white"><option value="">Assign Rider...</option>{MY_RIDERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                           <button onClick={() => assignToRider(order.id)} className="bg-purple-600 text-white p-2 rounded-xl"><Send size={16}/></button>
                         </div>
                       )}
                       {order.status === 'DELIVERED' && <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${order.payout_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{order.payout_status || 'UNPAID'}</span>}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in">
            <form onSubmit={addProduct} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div className="col-span-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Name</label><input required placeholder="Milk" className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Price</label><input required type="number" placeholder="30" className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label><input required placeholder="Dairy" className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Stock Qty</label><input required type="number" placeholder="100" className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Weight</label><input required placeholder="500g" className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.weight} onChange={e => setNewProduct({...newProduct, weight: e.target.value})} /></div>
              <div className="col-span-2 md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Image URL</label><input required placeholder="https://..." className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} /></div>
              <button type="submit" className="h-[48px] bg-black text-white font-black uppercase rounded-xl flex items-center justify-center gap-2"><PackagePlus size={18}/> Add</button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col">
                  <div className="text-[9px] font-black text-purple-600 bg-purple-50 self-start px-2 py-1 rounded mb-2 uppercase">{p.category || 'General'}</div>
                  <img src={p.image_url} alt={p.name} className="h-24 w-full object-contain mb-2" />
                  <div className="font-bold text-sm leading-tight flex-1">{p.name}</div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-[10px] font-bold text-slate-500">Weight: {p.weight || 'N/A'}</div>
                    <div className={`text-[10px] font-bold ${p.quantity < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                      Stock: {p.quantity || 0}
                    </div>
                  </div>

                  <div className="font-black text-lg mt-1">₹{p.price}</div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => toggleStock(p.id, p.in_stock)} className={`flex-1 text-[10px] font-black uppercase py-2 rounded-lg ${p.in_stock ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>{p.in_stock ? 'In Stock' : 'Out'}</button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 bg-slate-100 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYOUTS TAB */}
        {activeTab === 'payouts' && (
          <div className="space-y-4 animate-in fade-in">
            {riderPayouts.length === 0 ? (
              <div className="bg-white p-10 rounded-[32px] text-center border border-slate-200"><Wallet className="mx-auto text-slate-300 mb-4" size={48}/><h3 className="font-black text-xl">All Caught Up!</h3><p className="text-slate-500">No unpaid deliveries at the moment.</p></div>
            ) : (
              riderPayouts.map(payout => (
                <div key={payout.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-purple-100 rounded-full flex items-center justify-center"><Wallet className="text-purple-600"/></div>
                    <div>
                      <div className="font-black text-lg">{payout.name}</div>
                      <div className="text-sm font-bold text-slate-500">{payout.deliveries} Unpaid Deliveries</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Due</div>
                      <div className="text-3xl font-black text-red-500">₹{payout.total}</div>
                    </div>
                    <button onClick={() => markRiderPaid(payout.id)} className="bg-black text-white h-14 px-6 rounded-2xl font-black uppercase flex items-center gap-2 active:scale-95 transition-all"><CheckCircle2 size={18}/> Mark Paid</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 🚀 BANNERS TAB */}
        {activeTab === 'banners' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-4">Add New Promotional Banner</h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Paste Image URL (e.g. https://.../promo.jpg)" 
                  value={newImageUrl} 
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 outline-none font-medium"
                />
                <button onClick={handleAddBanner} disabled={isBannerLoading} className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <PlusCircle size={20}/> {isBannerLoading ? 'Adding...' : 'Add Banner'}
                </button>
              </div>
              {newImageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-gray-500 mb-2">Preview:</p>
                  <img src={newImageUrl} alt="Preview" className="h-32 rounded-xl object-cover border border-gray-200" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-6">Live Banners ({banners.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map((banner) => (
                  <div key={banner.id} className="border border-gray-200 rounded-2xl overflow-hidden group relative">
                    <img src={banner.image_url} alt="Banner" className="w-full h-40 object-cover" />
                    <button onClick={() => handleDeleteBanner(banner.id)} className="absolute top-3 right-3 bg-white/90 p-2 rounded-lg text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}
                {banners.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-500 flex flex-col items-center">
                    <ImageIcon size={40} className="mb-3 text-gray-300" />
                    <p>No banners live. The App will use defaults.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}