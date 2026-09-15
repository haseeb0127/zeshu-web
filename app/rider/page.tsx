"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Power,
  IndianRupee,
  History,
  CheckCircle2,
  Navigation,
  LogOut,
} from "lucide-react";
import { riderSupabase } from "../lib/browser-supabase";
import OrderAlertManager from "../components/OrderAlertManager";

const supabase = riderSupabase();

export default function RiderDashboard() {
  const [authState, setAuthState] = useState<"checking" | "login" | "blocked" | "dashboard">("checking");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isAdminSuspended, setIsAdminSuspended] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  useEffect(() => {
    void loadRider();
  }, []);

  const loadRider = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setSessionUserId(null);
      setRiderId(null);
      setIsOnline(false);
      setIsAdminSuspended(false);
      setAuthState("login");
      return;
    }

    setSessionUserId(user.id);

    const { data, error } = await supabase
      .from("riders")
      .select("id,is_active,admin_suspended")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Rider profile verification failed:", error);
      setAuthMessage("We could not verify your rider profile. Please try again.");
      setAuthState("blocked");
      return;
    }

    if (!data) {
      setAuthMessage("This account is not registered as a Zeshu rider.");
      setAuthState("blocked");
      return;
    }

    setRiderId(data.id);
    setIsOnline(Boolean(data.is_active));
    setIsAdminSuspended(Boolean(data.admin_suspended));
    setAuthState("dashboard");
  };

  const normalizedIndiaPhone = () => {
    const digits = phoneNumber.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  };

  const sendOtp = async () => {
    const phone = normalizedIndiaPhone();
    if (!/^\d{10}$/.test(phone)) {
      setAuthError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError("");
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
    setAuthSubmitting(false);

    if (error) {
      console.error("Rider OTP delivery failed:", error);
      setAuthError("We could not send an OTP. Check the number and try again.");
      return;
    }

    setPhoneNumber(phone);
    setOtpSent(true);
    setAuthMessage("OTP sent. Enter the 6-digit code to continue.");
  };

  const verifyOtp = async () => {
    const phone = normalizedIndiaPhone();
    if (!/^\d{10}$/.test(phone) || !/^\d{6}$/.test(otp)) {
      setAuthError("Enter your 10-digit mobile number and the 6-digit OTP.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError("");
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: otp,
      type: "sms",
    });
    setAuthSubmitting(false);

    if (error || !data.session || !data.user) {
      console.error("Rider OTP verification failed:", error);
      setAuthError("The OTP could not be verified. Please try again.");
      return;
    }

    setAuthState("checking");
    await loadRider();
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

    if (error) {
      if (process.env.NODE_ENV === "development") console.error("Rider orders refresh failed:", error.message);
      setOrdersError("Deliveries could not be refreshed. Please try again.");
    } else if (data) {
      setOrdersError("");
      const active = data.filter(
        (o) =>
          o.status === "READY_FOR_PICKUP" ||
          o.status === "OUT_FOR_DELIVERY" ||
          o.status === "PICKED_UP" ||
          o.status === "picked_up"
      );

      const delivered = data.filter(
        (o) => o.status === "DELIVERED" || o.status === "delivered"
      );

      setOrders(active);
      setHistoryOrders(delivered);
      setTotalEarnings(delivered.reduce((total, order) => total + Number(order.delivery_fee || 0), 0));
    }

    setLoading(false);
  };

  const toggleOnline = async () => {
    if (availabilityUpdating || !sessionUserId || !riderId) return;

    const next = !isOnline;
    if (next && isAdminSuspended) {
      alert("Your rider account has been suspended by admin.");
      return;
    }
    setAvailabilityUpdating(true);

    const { data, error } = await supabase.rpc("rider_set_availability", {
      p_is_active: next,
    });

    if (error) {
      console.error("Rider availability update failed:", error);
      alert(
        error.message?.includes("rider is administratively suspended")
          ? "Your rider account has been suspended by admin."
          : "Could not update rider status."
      );
      setAvailabilityUpdating(false);
      return;
    }

    setIsOnline(typeof data?.is_active === "boolean" ? data.is_active : next);
    setAvailabilityUpdating(false);
  };

  const advanceOrder = async (order: any) => {
    if (!riderId) return;
    const nextStatus = order.status === 'READY_FOR_PICKUP' ? 'PICKED_UP' : order.status === 'PICKED_UP' ? 'OUT_FOR_DELIVERY' : order.status === 'OUT_FOR_DELIVERY' ? 'DELIVERED' : null;
    if (!nextStatus) return;
    const action = nextStatus === 'PICKED_UP' ? 'confirm pickup' : nextStatus === 'OUT_FOR_DELIVERY' ? 'start delivery' : 'complete delivery';
    if (!confirm(`Are you ready to ${action}?`)) return;
    setLoading(true);
    const { error } = await supabase
      .rpc('advance_rider_order_status', { p_order_id: order.id, p_next_status: nextStatus });

    if (error) {
      console.error('Rider status transition failed:', error);
      alert("Could not update delivery status.");
      setLoading(false);
      return;
    }

    await fetchMyOrders();
    setLoading(false);
  };

  const actionLabel = (status: string) => status === 'READY_FOR_PICKUP' ? 'Confirm Pickup' : status === 'PICKED_UP' ? 'Start Delivery' : status === 'OUT_FOR_DELIVERY' ? 'Complete Delivery' : null;

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Rider sign-out failed:", error);
      alert("Could not log out safely. Please try again.");
      return;
    }

    setSessionUserId(null);
    setRiderId(null);
    setIsOnline(false);
    setIsAdminSuspended(false);
    setOrders([]);
    setHistoryOrders([]);
    setShowHistory(false);
    setOtp("");
    setOtpSent(false);
    setAuthError("");
    setAuthMessage("");
    setAuthState("login");
  };

  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="animate-spin w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (authState === "login") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border max-w-md w-full">
          <h1 className="text-2xl font-black text-slate-900 text-center">Zeshu Rider Login</h1>
          <p className="mt-2 text-center text-sm font-medium text-slate-500">Sign in with your registered rider mobile number.</p>
          {authError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{authError}</p>}
          {authMessage && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{authMessage}</p>}
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Mobile number</label>
              <input type="tel" inputMode="numeric" maxLength={13} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="10-digit mobile number" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-bold outline-none focus:border-slate-900" />
            </div>
            {otpSent && <div><label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">OTP</label><input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="6-digit OTP" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xl font-black tracking-[0.4em] outline-none focus:border-slate-900" /></div>}
            {otpSent ? <button onClick={() => void verifyOtp()} disabled={authSubmitting} className="w-full rounded-xl bg-slate-900 py-4 font-black text-white disabled:opacity-60">{authSubmitting ? "Verifying..." : "Verify OTP"}</button> : <button onClick={() => void sendOtp()} disabled={authSubmitting} className="w-full rounded-xl bg-slate-900 py-4 font-black text-white disabled:opacity-60">{authSubmitting ? "Sending..." : "Send OTP"}</button>}
          </div>
        </div>
      </div>
    );
  }

  if (authState === "blocked") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border max-w-md w-full">
          <h1 className="text-2xl font-black text-slate-900">Zeshu Rider</h1>
          <p className="mt-3 text-slate-500 font-medium">{authMessage}</p>
          <button onClick={() => void logout()} className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 font-black text-white">Use another account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <OrderAlertManager supabaseClient={supabase} channelName="rider-order-alerts" filter={sessionUserId ? `assigned_rider_id=eq.${sessionUserId}` : undefined} />
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
          disabled={availabilityUpdating || (!isOnline && isAdminSuspended)}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-xl uppercase ${
            isOnline
              ? "bg-red-500 hover:bg-red-600"
              : "bg-emerald-500 hover:bg-emerald-600"
          } disabled:opacity-60`}
        >
          <Power size={24} />
          {availabilityUpdating ? "Updating..." : isOnline ? "Go Offline" : "Go Online"}
        </button>

        {isAdminSuspended && <p role="alert" className="mt-3 text-center text-sm font-bold text-amber-200">Your rider account has been suspended by admin.</p>}

        <button
          onClick={logout}
          className="w-full mt-3 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="p-6">
        {ordersError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{ordersError}</p>}
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
            <p className="text-slate-500 font-bold text-lg">No assigned deliveries right now</p>
            <p className="mt-2 text-center text-sm text-slate-400">Keep your availability on to receive assignments.</p>
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
                  ₹{Number(order.delivery_fee || 0).toFixed(0)}
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

                {actionLabel(order.status) && <button
                  disabled={loading}
                  onClick={() => advanceOrder(order)}
                  className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CheckCircle2 size={18} />
                  {loading ? 'Updating...' : actionLabel(order.status)}
                </button>}
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
                      +₹{Number(item.delivery_fee || 0).toFixed(0)}
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
