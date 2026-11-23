"use client";

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { useCustomerLanguage } from "./CustomerLanguageProvider";

export default function ShareZeshuButton() {
  const { t } = useCustomerLanguage();
  const [status, setStatus] = useState("");

  const share = async () => {
    const shareData = {
      title: "Get Zeshu",
      text: t("Try Zeshu for Jagtial delivery and India-wide digital tools."),
      url: "https://zeshu.in/app",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setStatus(t("Share sheet opened."));
        return;
      }
      await navigator.clipboard?.writeText("Get Zeshu: https://zeshu.in/app");
      setStatus(t("Zeshu app link copied."));
    } catch {
      setStatus("");
    }
  };

  return (
    <div>
      <button type="button" onClick={() => void share()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#075E45] bg-white px-5 py-3.5 text-sm font-black text-[#075E45] shadow-sm active:scale-[.98]">
        <Share2 size={18} aria-hidden="true" /> {t("Share Zeshu")}
      </button>
      {status && <p className="mt-2 text-center text-xs font-bold text-slate-500" role="status">{status}</p>}
    </div>
  );
}
