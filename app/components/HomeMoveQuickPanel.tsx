"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Car, ChevronRight, MapPin, Package, Search, Truck } from "lucide-react";
import { useCustomerLanguage } from "@/app/components/CustomerLanguageProvider";

type Readiness = {
  request_enabled?: boolean;
  compliance_gate?: boolean;
};

const isAvailable = (state: Readiness | undefined) => Boolean(state?.request_enabled && !state?.compliance_gate);

export default function HomeMoveQuickPanel() {
  const { t } = useCustomerLanguage();
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
      label: t("Auto"),
      href: "/move/request?service=Auto",
      icon: <Car size={21} />,
      available: isAvailable(services.AUTO_DRIVER),
      tone: "bg-emerald-50 text-emerald-800",
    },
    {
      label: t("Cab"),
      href: "/move/request?service=Cab",
      icon: <Car size={21} />,
      available: isAvailable(services.CAB_DRIVER),
      tone: "bg-blue-50 text-blue-800",
    },
    {
      label: t("Send parcel"),
      href: "/move/request?service=Bike%20Courier",
      icon: <Package size={21} />,
      available: isAvailable(services.BIKE_COURIER),
      tone: "bg-amber-50 text-amber-800",
    },
    {
      label: t("Mini Truck"),
      href: "/move/request?service=Auto%20%2F%20Mini%20Truck",
      icon: <Truck size={21} />,
      available: isAvailable(services.GOODS_DRIVER),
      tone: "bg-violet-50 text-violet-800",
    },
  ];

  return (
    <section className="mb-5 px-4 md:px-0" aria-labelledby="home-move-title">
      <div className="overflow-hidden rounded-[30px] border border-emerald-100 bg-gradient-to-br from-[#f1fbf5] via-white to-[#f7fbf8] shadow-[0_10px_30px_rgba(7,94,69,.08)]">
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#075E45]">Zeshu Move</p>
              <h2 id="home-move-title" className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">{t("Ride, send & travel")}</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 md:text-sm">{t("Choose a service and continue to the map. Availability is checked near your pickup.")}</p>
            </div>
            <Link href="/move" className="hidden shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-[#075E45] shadow-sm sm:inline-flex">
              {t("All services")} <ChevronRight size={14} />
            </Link>
          </div>

          <Link
            href="/move/request?service=Auto"
            className="mt-4 flex min-h-14 items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 shadow-sm transition active:scale-[.99]"
            aria-label={t("Choose destination with Zeshu Move")}
          >
            <Search size={21} className="shrink-0 text-slate-800" />
            <span className="min-w-0 flex-1 text-base font-black text-slate-950 md:text-lg">{t("Where are you going?")}</span>
            <MapPin size={19} className="shrink-0 text-[#075E45]" />
          </Link>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {shortcuts.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition active:scale-[.98]">
                <span className={`mx-auto grid h-10 w-10 place-items-center rounded-2xl ${item.tone}`}>{item.icon}</span>
                <p className="mt-2 truncate text-[11px] font-black text-slate-900 md:text-xs">{item.label}</p>
                <p className={`mt-1 text-[9px] font-black ${item.available ? "text-emerald-700" : "text-slate-400"}`}>{item.available ? t("Available") : t("Opening soon")}</p>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold leading-4 text-slate-500 md:text-xs">{t("Availability depends on verified Zeshu partners near your pickup.")}</p>
            <Link href="/move" className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-[#075E45] md:text-xs">
              {t("See all")} <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
