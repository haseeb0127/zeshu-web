"use client";
import React from 'react';

// We define the props so the component knows what data to expect from page.tsx
interface ServiceGridProps {
  services: any[];
  setActiveTab: (tab: string) => void;
  setActiveService: (service: string) => void;
}

export default function ServiceGrid({ services, setActiveTab, setActiveService }: ServiceGridProps) {
  return (
    <div className="bg-white p-6 md:p-10 rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 mx-4 md:mx-0">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl md:text-2xl font-black tracking-tight">Utility & Recharges</h2>
        <span className="text-[#4F46E5] font-extrabold text-xs md:text-sm cursor-pointer hover:bg-[#E0E7FF] bg-[#EEF2FF] px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-colors active:scale-95">
          Explore All
        </span>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-y-8 md:gap-y-10 gap-x-2 md:gap-x-4">
        {services.map((s) => (
          <div 
            key={s.id} 
            onClick={() => { setActiveTab('recharge'); setActiveService(s.id); }} 
            className="flex flex-col items-center gap-2.5 md:gap-3.5 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className={`h-[60px] w-[60px] md:h-[72px] md:w-[72px] rounded-[20px] md:rounded-[24px] flex items-center justify-center transition-all ${s.color}`}>
              {s.icon}
            </div>
            <span className="text-[10px] md:text-[11px] font-black text-[#6B7280] text-center leading-tight group-hover:text-[#111827]">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}