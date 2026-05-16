"use client";
import React from 'react';
import { Search, Zap, ChevronDown, ShoppingBag, User, X, Mic } from 'lucide-react';

// We strictly define the wiring to the main page here
interface HeaderProps {
  isScrolled: boolean;
  setActiveTab: (tab: string) => void;
  handleAutoDetectLocation: () => void;
  isDetectingLoc: boolean;
  currentAddress: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: any;
  setIsAccountOpen: (val: boolean) => void;
  setIsAuthModalOpen: (val: boolean) => void;
  setIsCartOpen: (val: boolean) => void;
  cartLength: number;
  finalCartTotal: number;
}

export default function Header({
  isScrolled,
  setActiveTab,
  handleAutoDetectLocation,
  isDetectingLoc,
  currentAddress,
  searchQuery,
  setSearchQuery,
  user,
  setIsAccountOpen,
  setIsAuthModalOpen,
  setIsCartOpen,
  cartLength,
  finalCartTotal
}: HeaderProps) {
  return (
    <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-2xl shadow-sm border-b border-gray-200/40' : 'bg-white border-b border-gray-100'}`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-0 md:h-[88px] flex flex-col md:flex-row items-center justify-between gap-3 md:gap-8">
        
        {/* Top Row on Mobile: Logo + Location + Icons */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer md:border-r border-gray-200/60 md:pr-6 active:scale-[0.97] transition-transform" onClick={() => setActiveTab('home')}>
              <div className="bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white font-black p-2 md:p-2.5 rounded-xl md:rounded-2xl text-xl md:text-2xl tracking-tighter shadow-sm">Z</div>
              <div className="hidden md:flex flex-col"><span className="text-[22px] font-black tracking-tighter leading-none">ZESHU</span><span className="text-[10px] font-extrabold text-[#6366F1] tracking-[0.2em] uppercase mt-0.5">Super App</span></div>
            </div>
            <div className="flex flex-col cursor-pointer max-w-[160px] md:max-w-[220px] group active:scale-[0.97] transition-transform" onClick={handleAutoDetectLocation}>
              <div className="font-black text-[13px] md:text-[15px] flex items-center gap-1.5">Delivery in 12 min <Zap size={14} className="text-[#F59E0B] fill-[#F59E0B]"/></div>
              <div className="flex items-center text-[10px] md:text-xs text-[#6B7280] mt-0.5 font-medium truncate">
                {isDetectingLoc ? <div className="h-1.5 w-16 bg-gray-200 animate-pulse rounded-full"></div> : currentAddress}
                <ChevronDown size={14} className="ml-1"/>
              </div>
            </div>
          </div>
          
          {/* Mobile Only Actions (Now includes Login!) */}
          <div className="md:hidden flex items-center gap-3">
            <button 
              onClick={() => user ? setIsAccountOpen(true) : setIsAuthModalOpen(true)} 
              className="p-2.5 bg-gray-100 rounded-full active:scale-95 transition-transform text-gray-700 border border-gray-200"
            >
              <User size={20} />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative p-2.5 bg-gray-100 rounded-full active:scale-95 transition-transform border border-gray-200"
            >
              <ShoppingBag size={20} className="text-gray-700" />
              {cartLength > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] font-black w-5 h-5 flex items-center justify-center border-2 border-white">{cartLength}</span>}
            </button>
          </div>

        </div>

        {/* Search Bar */}
        <div className="w-full md:flex-1 max-w-3xl order-last md:order-none mt-1 md:mt-0">
          <div className="bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-all rounded-[14px] md:rounded-[20px] flex items-center px-4 py-3 md:py-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6366F1]/20 cursor-text">
            <Search className="text-[#9CA3AF] w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
            <input type="text" placeholder="Search 'protein powder', 'midnight snacks'..." className="bg-transparent border-none outline-none flex-1 ml-2 md:ml-3 text-[14px] md:text-[16px] font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery ? <X size={16} className="cursor-pointer text-gray-500" onClick={() => setSearchQuery('')}/> : <Mic size={18} className="text-[#6366F1] cursor-pointer hover:scale-110 transition-transform" title="Voice Search"/>}
          </div>
        </div>

        {/* Desktop Only Actions (Fixed Z-Index & Click) */}
        <div className="hidden md:flex items-center gap-5 shrink-0 z-50">
          <button 
            onClick={() => user ? setIsAccountOpen(true) : setIsAuthModalOpen(true)} 
            className="flex items-center gap-2 text-[#4B5563] font-extrabold text-sm active:scale-95 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <User size={20}/>{user ? 'Account' : 'Login'}
          </button>
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="bg-gradient-to-b from-[#059669] to-[#047857] text-white px-5 py-3.5 rounded-[20px] flex items-center gap-3 font-bold text-sm min-w-[120px] justify-center active:scale-[0.96] shadow-lg shadow-green-600/20 cursor-pointer"
          >
            <ShoppingBag size={22} /> {cartLength > 0 ? `₹${finalCartTotal}` : 'My Cart'}
          </button>
        </div>

      </div>
    </header>
  );
}