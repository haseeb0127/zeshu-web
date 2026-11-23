"use client";

import { Check } from "lucide-react";
import { useCustomerLanguage } from "./CustomerLanguageProvider";

const stages = [
  ["PENDING", "Order placed"],
  ["CONFIRMED", "Confirmed"],
  ["PREPARING", "Being prepared"],
  ["READY_FOR_PICKUP", "Ready for pickup"],
  ["PICKED_UP", "Picked up"],
  ["OUT_FOR_DELIVERY", "Out for delivery"],
  ["DELIVERED", "Delivered"],
] as const;

export default function OrderStatusTimeline({ status }: { status?: string }) {
  const { t } = useCustomerLanguage();
  const visibleStages = status === "CANCELLED" ? [...stages.slice(0, -1), ["CANCELLED", "Cancelled"] as const] : stages;
  const activeIndex = Math.max(0, visibleStages.findIndex(([value]) => value === status));
  return (
    <ol className="space-y-0" aria-label={t("Order progress")}>
      {visibleStages.map(([value, label], index) => {
        const complete = index <= activeIndex;
        const current = index === activeIndex;
        return <li key={value} className="relative flex gap-3 pb-5 last:pb-0">
          {index < visibleStages.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-16px)] w-px ${complete ? "bg-[#075E45]" : "bg-[#dce5df]"}`} />}
          <span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${complete ? "border-[#075E45] bg-[#075E45] text-white" : "border-[#cbd5cf] bg-white text-transparent"}`}>
            {complete && <Check size={14} strokeWidth={3} />}
          </span>
          <span className="pt-1"><span className={`block text-sm font-bold ${current ? "text-[#064936]" : complete ? "text-[#25332b]" : "text-[#7a887f]"}`}>{t(label)}</span>{current && <span className="text-xs text-[#587065]">{t("Current order status")}</span>}</span>
        </li>;
      })}
    </ol>
  );
}
