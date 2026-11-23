import {Leaf,TreePine} from "lucide-react";

export default function GreenBannerArtwork(){
 return <div data-green-banner-artwork="true" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
  <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-[#a8e86b]/20 blur-2xl"/>
  <div className="absolute bottom-[-5.5rem] right-[4%] text-[#b6ee75]/90 drop-shadow-[0_12px_20px_rgba(0,0,0,.2)]">
   <TreePine size={260} strokeWidth={1.15}/>
  </div>
  <div className="absolute bottom-[-2.5rem] right-[37%] text-[#6bc98b]/75 drop-shadow-[0_10px_16px_rgba(0,0,0,.2)]">
   <TreePine size={150} strokeWidth={1.2}/>
  </div>
  <div className="absolute right-[14%] top-[16%] rotate-[-18deg] text-[#e2ffbd]/90"><Leaf size={36}/></div>
  <div className="absolute right-[43%] top-[26%] rotate-[22deg] text-[#9ee6a9]/80"><Leaf size={24}/></div>
  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,38,27,.98)_0%,rgba(1,46,33,.82)_38%,rgba(1,49,34,.18)_68%,transparent_92%)]"/>
 </div>;
}
