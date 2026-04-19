"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  BellRing, CheckCircle, LogOut, ShoppingBag, MapPin, 
  IndianRupee, Hash, Send, PackagePlus, Edit, Trash2, Store
} from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const MY_RIDERS = [
  { name: 'Rider 1', id: '7754e8bf-5aff-4b44-901b-fdd28f2113cf' }, 
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedRiders, setSelectedRiders] = useState<{[key: string]: string}>({});
  const [newProduct, setNewProduct] = useState({ name: '', price: '', unit: '', image_url: '' });
  const router = useRouter();

  const fetchData = async () => {
    const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    const { data: productData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (orderData) setOrders(orderData);
    if (productData) setProducts(productData);
    setLoading(false);
  };

  // ✅ FIXED: Cleaned up the brackets and added double-table listening
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-hq-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order Update:', payload);
          // Play sound ONLY if it's a new order (INSERT)
          if (payload.eventType === 'INSERT') {
            const audio = new Audio('/alert.mp3');
            audio.play().catch(() => console.log("Sound blocked! Click 'Enable Audio' button."));
          }
          fetchData(); 
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          console.log('Inventory Updated!');
          fetchData(); // Refresh the Pepsi/Coke list instantly
        }
      )
      .subscribe((status) => {
        console.log("Realtime Status:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, []); // Brackets are now correct

  const assignToRider = async (orderId: string) => {
    const riderId = selectedRiders[orderId];
    if (!riderId) return alert("Select a rider first!");
    await supabase.from('orders').update({ status: 'OUT_FOR_DELIVERY', assigned_rider_id: riderId }).eq('id', orderId);
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('products').insert([{ 
      name: newProduct.name, 
      price: Number(newProduct.price), 
      unit: newProduct.unit, 
      image_url: newProduct.image_url 
    }]);
    if (error) alert(error.message);
    setNewProduct({ name: '', price: '', unit: '', image_url: '' });
  };

  const toggleStock = async (id: string, currentStatus: boolean) => {
    await supabase.from('products').update({ in_stock: !currentStatus }).eq('id', id);
  };

  const deleteProduct = async (id: string) => {
    if(confirm("Are you sure you want to delete this?")) {
      await supabase.from('products').delete().eq('id', id);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-2 rounded-xl">
            <Store size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase text-white">Zeshu HQ</h1>
            <p className="text-[10px] font-bold text-purple-400 tracking-[0.2em] uppercase leading-none">Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)} 
            className={`${audioEnabled ? 'bg-green-500' : 'bg-amber-500'} text-black text-[10px] font-black px-3 py-1.5 rounded-lg transition-all`}
          >
            {audioEnabled ? 'AUDIO LIVE 🔊' : 'ENABLE AUDIO 🔈'}
          </button>
          <button onClick={() => { supabase.auth.signOut(); router.push('/admin/login'); }} className="bg-zinc-800 p-2.5 rounded-xl"><LogOut size={20} color="white" /></button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-4 border-b border-slate-200 pb-px">
          <button onClick={() => setActiveTab('orders')} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'orders' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Live Orders</button>
          <button onClick={() => setActiveTab('inventory')} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'inventory' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Inventory</button>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'orders' ? (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Order</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Address</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Items</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Amount</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order) => (
                    <tr key={order.id} className={`transition-colors ${order.status === 'PENDING' ? 'bg-purple-50/30' : 'hover:bg-slate-50'}`}>
                      <td className="p-5 font-mono text-[11px] font-bold">{order.id.split('-')[0].toUpperCase()}</td>
                      <td className="p-5 text-sm font-bold truncate max-w-[200px]">{order.delivery_address}</td>
                      <td className="p-5 text-xs text-slate-500">{order.items?.map((i:any) => `${i.qty}x ${i.item.name}`).join(', ')}</td>
                      <td className="p-5 text-xl font-black text-purple-600">₹{order.total_paid}</td>
                      <td className="p-5">
                        {order.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <select onChange={(e) => setSelectedRiders({...selectedRiders, [order.id]: e.target.value})} className="border p-2 rounded-xl text-xs font-bold bg-white">
                              <option value="">Assign to...</option>
                              {MY_RIDERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <button onClick={() => assignToRider(order.id)} className="bg-purple-600 text-white p-2 rounded-xl active:scale-90 transition-transform"><Send size={16}/></button>
                          </div>
                        )}
                        {order.status === 'OUT_FOR_DELIVERY' && <span className="text-orange-500 font-black text-xs uppercase">Out For Delivery</span>}
                        {order.status === 'DELIVERED' && <span className="text-emerald-600 font-black text-xs uppercase">Delivered</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            <form onSubmit={addProduct} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                <input required type="text" placeholder="Amul Taaza Milk" className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                <input required type="number" placeholder="30" className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                <input required type="text" placeholder="500 ml" className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
                <input required type="text" placeholder="https://..." className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
              </div>
              <button type="submit" className="h-[48px] bg-black text-white font-black uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><PackagePlus size={18}/> Add Item</button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map(p => (
                <div key={p.id} className={`bg-white p-4 rounded-2xl border ${p.in_stock ? 'border-slate-100' : 'border-red-200 bg-red-50/30'}`}>
                  <img src={p.image_url} alt={p.name} className={`h-24 w-full object-contain mb-2 ${!p.in_stock && 'grayscale opacity-50'}`} />
                  <div className="text-[10px] text-slate-400">{p.unit}</div>
                  <div className="font-bold text-sm leading-tight h-10 truncate">{p.name}</div>
                  <div className="font-black text-lg mt-2 text-purple-600">₹{p.price}</div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => toggleStock(p.id, p.in_stock)} className={`flex-1 text-[10px] font-black uppercase py-2 rounded-lg transition-colors ${p.in_stock ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                      {p.in_stock ? 'In Stock' : 'Out of Stock'}
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 bg-slate-100 text-red-500 rounded-lg active:scale-90 transition-transform"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}