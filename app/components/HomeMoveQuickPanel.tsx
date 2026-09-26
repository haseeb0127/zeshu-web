"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BusFront, Car, ChevronRight, MapPin, Package, Search } from "lucide-react";

type Readiness = {
  request_enabled?: boolean;
  compliance_gate?: boolean;
};

const statusLabel = (state: Readiness | undefined, fallback = "Opening soon") => {
  if (!state) return fallback;
  if (state.request_enabled && !state.compliance_gate) return "Available";
  return fallback;
};

export default function HomeMoveQuickPanel() {
  const [services, setServices] = useState<Record<string, Readiness>>({});

  useEffect(() => {
    let active = true;
    void fetch("/api/move/matching/readiness", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setServices(payload?.services && typeof payload.services === "object" ? payload.services : {});
      })
      .catch(() => {
        if (active) setServices({});
      });

    return () => { active = false; };
  }, []);

  const shortcuts = [
    {
      label: "Auto",
      href: "/move/request?service=Auto",
      icon: <Car size={21} />,
      status: statusLabel(services.AUTO_DRIVER),
      tone: "bg-emerald-50 text-emerald-800",
    },
    {
      label: "Cab",
      href: "/move/request?service=Cab",
      icon: <Car size={21} />,
      status: statusLabel(services.CAB_DRIVER),
      tone: "bg-blue-50 text-blue-800",
    },
    {
      label: "Send parcel",
      href: "/move/request?service=Bike%20Courier",
      icon: <Package size={21} />,
      status: statusLabel(services.BIKE_COURIER),
      tone: "bg-amber-50 text-amber-800",
    },
    {
      label: "Travel",
      href: "/move",
      icon: <BusFront size={21} />,
      status: "Explore",
      tone: "bg-violet-50 text-violet-800",
    },
  ];

  return (
    <section className="mb-6 px-4 md:px-0" aria-labelledby="home-move-title">
      <div className="overflow-hidden rounded-[30px] border border-emerald-100 bg-gradient-to-br from-[#f1fbf5] via-white to-[#f7fbf8] shadow-[0_10px_30px_rgba(7,94,69,.08)]">
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#075E45]">Zeshu Move</p>
              <h2 id="home-move-title" className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">Ride, send & travel</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 md:text-sm">Choose a service and continue to the map. Availability is checked for your area before a live request starts.</p>
            </div>
            <Link href="/move" className="hidden shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-[#075E45] shadow-sm sm:inline-flex">
              All services <ChevronRight size={14} />
            </Link>
          </div>

          <Link
            href="/move/request?service=Auto"
            className="mt-4 flex min-h-14 items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 shadow-sm transition active:scale-[.99]"
            aria-label="Choose destination with Zeshu Move"
          >
            <Search size={21} className="shrink-0 text-slate-800" />
            <span className="min-w-0 flex-1 text-base font-black text-slate-950 md:text-lg">Where are you going?</span>
            <MapPin size={19} className="shrink-0 text-[#075E45]" />
          </Link>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {shortcuts.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition active:scale-[.98]">
                <span className={`mx-auto grid h-10 w-10 place-items-center rounded-2xl ${item.tone}`}>{item.icon}</span>
                <p className="mt-2 truncate text-[11px] font-black text-slate-900 md:text-xs">{item.label}</p>
                <p className={`mt-1 text-[9px] font-black ${item.status === "Available" ? "text-emerald-700" : "text-slate-400"}`}>{item.status}</p>
              </Link>
            ))}
          </div>

          <Link href="/move" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[#075E45] sm:hidden">
            See all Move & Travel services <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
