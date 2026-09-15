"use client";
import React from 'react';
import { X } from 'lucide-react';

interface CartDrawerProps {
  isCartOpen: boolean;
  setIsCartOpen: (val: boolean) => void;
  cart: { item: any; qty: number }[];
  removeFromCart: (productId: any) => void;
  addToCart: (product: any) => void;
  itemTotal: number;
  deliveryCharge: number;
  hasZeshuPass: boolean;
  setHasZeshuPass: (val: boolean) => void;
  smallCartFee: number;
  useZeshuCoins: boolean;
  zeshuDiscount: number;
  finalCartTotal: number;
  handleCartCheckout: () => void;
}

export default function CartDrawer({
  isCartOpen,
  setIsCartOpen,
  cart,
  removeFromCart,
  addToCart,
  itemTotal,
  deliveryCharge,
  hasZeshuPass,
  setHasZeshuPass,
  smallCartFee,
  useZeshuCoins,
  zeshuDiscount,
  finalCartTotal,
  handleCartCheckout
}: CartDrawerProps) {
  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[60]" onClick={() => setIsCartOpen(false)}></div>
      <div className="fixed top-0 right-0 h-full w-full md:w-[460px] bg-[#F8F9FC] z-[70] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
        <div className="bg-white px-6 py-5 flex justify-between items-center border-b">
          <h2 className="text-2xl font-black tracking-tighter">My Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2.5 bg-[#F3F4F6] rounded-full active:scale-90"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {cart.map((c, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <img src={c.item.image_url} className="w-16 h-16 object-contain" alt="cart item"/>
              <div className="flex-1"><h4 className="font-bold text-sm">{c.item.name}</h4><p className="text-xs text-gray-500">₹{c.item.price} x {c.qty}</p></div>
              <div className="flex items-center bg-[#059669] text-white rounded-lg px-2"><button onClick={() => removeFromCart(c.item.id)} className="px-2">-</button><span className="px-2">{c.qty}</span><button onClick={() => addToCart(c.item)} className="px-2">+</button></div>
            </div>
          ))}

          <div className="bg-white p-6 rounded-[24px] shadow-sm space-y-4">
            <div className="flex justify-between text-[#4B5563]"><span>Items total</span><span className="font-bold">₹{itemTotal}</span></div>
            <div className="flex justify-between text-[#059669]"><span>Delivery charge</span><span className="font-black">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
            <p className="text-xs font-medium text-[#587065]">Free delivery on orders of ₹299 or more.</p>
            {smallCartFee > 0 && <div className="flex justify-between text-red-500 text-xs"><span>Small cart fee (Add ₹{199-itemTotal} to remove)</span><span>₹{smallCartFee}</span></div>}
            <div className="border-t pt-4 flex justify-between font-black text-xl"><span>Grand total</span><span>₹{finalCartTotal}</span></div>
          </div>
        </div>
        <div className="bg-white p-6 border-t shadow-2xl">
          <button onClick={handleCartCheckout} className="w-full bg-gradient-to-r from-[#059669] to-[#047857] text-white font-bold py-4 rounded-2xl flex justify-between px-6 items-center shadow-lg shadow-green-600/30">
            <span>Proceed to Pay</span><span>₹{finalCartTotal}</span>
          </button>
        </div>
      </div>
    </>
  );
}
