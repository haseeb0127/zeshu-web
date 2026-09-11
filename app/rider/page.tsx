"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  MapPin,
  Power,
  IndianRupee,
  History,
  CheckCircle2,
  Navigation,
  LogOut,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RiderDashboard() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRider();
  }, []);

  const loadRider = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setError("Please login as a rider.");
      return;
    }

    setSessionUserId(session.user.id);

    const { data, error } = await supabase
      .from("riders")
      .select("id,is_active")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error || !data) {
      setError("Rider account not found.");
      return;
    }

    setRiderId(data.id);
    setIsOnline(Boolean(data.is_active));
  };

  useEffect(() => {
    if (!riderId) return;

    fetchMyOrders();

    const channel = supabase
      .channel(`rider-orders-${riderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `rider_id=eq.${riderId}`,
        },
        () => {
          fetchMyOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId]);

  const fetchMyOrders = async () => {
    if (!riderId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("rider_id", riderId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const active = data.filter(
        (o) =>
          o.status === "OUT_FOR_DELIVERY" ||
          o.status === "PICKED_UP" ||
          o.status === "picked_up"
      );

      const delivered = data.filter(
        (o) => o.status === "DELIVERED" || o.status === "delivered"
      );

      setOrders(active);
      setHistoryOrders(delivered);
      setTotalEarnings(delivered.length * 30);
    }

    setLoading(false);
  };

  const toggleOnline = async () => {
    if (!sessionUserId || !riderId) return;

    const next = !isOnline;

    const { error } = await supabase
      .from("riders")
      .update({ is_active: next })
      .eq("id", riderId)
      .eq("user_id", sessionUserId);

    if (error) {
      alert("Could not update rider status.");
      return;
    }

    setIsOnline(next);
  };

  const markDelivered = async (orderId: string) => {
    if (!riderId) return;

    if (!confirm("Are you at the customer's location?")) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: "DELIVERED" })
      .eq("id", orderId)
      .eq("rider_id", riderId);

    if (error) {
      alert("Could not update delivery status.");
      return;
    }

    fetchMyOrders();
  };

  const openGoogleMaps = (address: string) => {
    if (!address) return;

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`,
      "_blank"
    );
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border max-w-md w-full">
          <h1 className="text-2xl font-black text-slate-900 mb-3">
            Zeshu Rider
          </h1>
          <p className="text-slate-500 font-medium">{error}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl font-black"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-slate-900 pt-8 pb-6 px-6 rounded-b-[40px] shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-white text-2xl font-black tracking-wider">
              ZESHU RIDER
            </h1>
            <p className="text-slate-400 text-sm font-bold">
              Live Dispatch
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="bg-slate-800 px-4 py-2 rounded-full flex items-center gap-1">
              <IndianRupee size={14} className="text-emerald-500" />
              <span className="text-emerald-500 font-black">
                Today: ₹{totalEarnings}
              </span>
            </div>

            <button
              onClick={() => setShowHistory(true)}
              className="bg-slate-700 px-4 py-2 rounded-full flex items-center gap-2 text-slate-300 text-xs font-black uppercase"
            >
              <History size={12} />
              History
            </button>
          </div>
        </div>

        <button
          onClick={toggleOnline}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-xl uppercase ${
            isOnline
              ? "bg-red-500 hover:bg-red-600"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          <Power size={24} />
          {isOnline ? "Go Offline" : "Go Online"}
        </button>

        <button
          onClick={logout}
          className="w-full mt-3 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="p-6">
        <h2 className="text-slate-500 font-black uppercase tracking-widest text-sm mb-4">
          {isOnline ? "Active Deliveries" : "You are Offline"}
        </h2>

        {!isOnline ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Power size={64} className="text-slate-400 mb-4" />
            <p className="text-slate-500 font-bold text-lg">
              Go online to receive orders
            </p>
          </div>
        ) : loading && orders.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <MapPin size={40} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-bold text-lg">
              Waiting for orders...
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 mb-4"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="bg-slate-100 text-slate-600 font-black text-xs px-3 py-1.5 rounded-lg">
                  #{order.id.split("-")[0].toUpperCase()}
                </span>

                <span className="text-emerald-500 font-black text-xl">
                  ₹30
                </span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <MapPin
                  className="text-slate-900 shrink-0"
                  size={24}
                />

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Drop Location
                  </p>

                  <p className="font-bold text-slate-900">
                    {order.delivery_address || "Address missing"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    openGoogleMaps(order.delivery_address)
                  }
                  className="flex-1 bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  Navigate
                </button>

                <button
                  onClick={() => markDelivered(order.id)}
                  className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Delivered
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showHistory && (
        <div className="fixed inset-0 bg-slate-50 z-50">
          <div className="bg-white p-6 pt-10 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Today's History
              </h2>
              <p className="text-emerald-500 font-bold">
                Total Earned: ₹{totalEarnings}
              </p>
            </div>

            <button
              onClick={() => setShowHistory(false)}
              className="p-3 bg-slate-100 rounded-full"
            >
              <History size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto h-full pb-32">
            {historyOrders.length === 0 ? (
              <p className="text-center text-slate-400 font-bold mt-10">
                No deliveries completed.
              </p>
            ) : (
              historyOrders.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border mb-4 flex justify-between items-center"
                >
                  <div>
                    <p className="text-[10px] font-black text-slate-400 mb-1">
                      #{item.id.split("-")[0].toUpperCase()}
                    </p>

                    <p className="font-bold text-sm max-w-[200px] truncate">
                      {item.delivery_address}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-emerald-500 font-black text-lg">
                      +₹30
                    </p>

                    <p className="text-[9px] font-black mt-1 text-amber-500">
                      {item.payout_status === "PAID"
                        ? "PAID OUT"
                        : "PENDING PAY"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}