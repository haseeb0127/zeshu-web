"use client";

/**
 * Decorative dining artwork for the Zeshu Dine homepage banner.
 * Drawn as a responsive SVG rather than loading an unlicensed restaurant photo.
 * Does not imply a specific restaurant, verified menu or guaranteed ready time.
 */
export default function DineBannerArtwork() {
  return <div data-dine-artwork aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    <div className="absolute -right-[6%] -top-[25%] h-[130%] w-[75%] rounded-full bg-[radial-gradient(circle,rgba(255,201,128,.35),rgba(255,159,65,.07)_55%,transparent_76%)]" />
    <svg viewBox="0 0 1000 575" preserveAspectRatio="xMidYMid slice" className="absolute inset-y-0 right-[-5%] h-full w-[82%] md:right-0 md:w-[69%]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="dine-table" cx=".5" cy=".5" r=".75">
          <stop stopColor="#9b5824"/><stop offset=".65" stopColor="#5b3115"/><stop offset="1" stopColor="#331d11"/>
        </radialGradient>
        <radialGradient id="dine-plate" cx=".42" cy=".31" r=".8">
          <stop stopColor="#fffefd"/><stop offset=".56" stopColor="#f7f2e5"/><stop offset=".8" stopColor="#ddd5c7"/><stop offset="1" stopColor="#aaa395"/>
        </radialGradient>
        <radialGradient id="dine-rice" cx=".35" cy=".2" r=".8">
          <stop stopColor="#ffe8a3"/><stop offset=".36" stopColor="#fcb84e"/><stop offset=".7" stopColor="#cb6d22"/><stop offset="1" stopColor="#79390f"/>
        </radialGradient>
        <linearGradient id="dine-metal" x1="0" y1="0" x2=".9" y2="1">
          <stop stopColor="#ffffff"/><stop offset=".2" stopColor="#b8c4c6"/><stop offset=".46" stopColor="#fbffff"/><stop offset=".8" stopColor="#87999b"/><stop offset="1" stopColor="#edf3f1"/>
        </linearGradient>
        <linearGradient id="dine-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7cc744"/><stop offset="1" stopColor="#275a25"/>
        </linearGradient>
        <filter id="dine-shadow" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="21"/><feOffset dx="13" dy="22"/><feComponentTransfer><feFuncA type="linear" slope=".5"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="dine-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
        <clipPath id="dine-food-clip"><ellipse cx="594" cy="318" rx="195" ry="128" /></clipPath>
      </defs>
      {/* Deep mahogany table and soft restaurant light */}
      <rect x="185" y="10" width="820" height="570" rx="44" fill="url(#dine-table)" opacity=".52" transform="rotate(-10 595 295)"/>
      <path d="M290 22L1000 160M255 110L1000 248M225 200L1000 335M195 295L1000 430" stroke="#ffcd8f" strokeOpacity=".09" strokeWidth="7"/>
      <ellipse cx="618" cy="472" rx="355" ry="66" fill="#110e0b" opacity=".49" filter="url(#dine-soft)"/>
      {/* Plated fresh rice meal */}
      <g transform="rotate(-13 594 322)" filter="url(#dine-shadow)">
        <ellipse cx="594" cy="322" rx="283" ry="207" fill="#b5a999"/>
        <ellipse cx="590" cy="314" rx="275" ry="204" fill="url(#dine-plate)"/>
        <ellipse cx="589" cy="314" rx="226" ry="166" fill="#f4f0e5" stroke="#d3ccbe" strokeWidth="12"/>
        <ellipse cx="594" cy="318" rx="194" ry="132" fill="url(#dine-rice)"/>
        <g clipPath="url(#dine-food-clip)">
          {/* Biryani-grain highlights and warm roasted texture */}
          {Array.from({length:56},(_,i)=>{
            const a=i*2.39996, radius=Math.sqrt((i+.5)/56);
            const x=594+Math.cos(a)*169*radius,y=318+Math.sin(a)*110*radius;
            const rot=(i*53)%175;
            return <ellipse key={i} cx={x} cy={y} rx={i%7===0?16:10} ry={i%5===0?4.8:3.1}
              transform={`rotate(${rot} ${x} ${y})`} fill={i%6===0?"#6d3313":i%4===0?"#f7d68a":i%3===0?"#fff0af":"#f7a840"} opacity={i%6===0?".74":".91"}/>;
          })}
          <path d="M454 344q38-43 92-24t89 4q49-10 106 14" fill="none" stroke="#a84719" strokeWidth="29" strokeLinecap="round" opacity=".64"/>
          <path d="M478 291q63-65 125-13t101-8" fill="none" stroke="#ffdb74" strokeWidth="15" strokeLinecap="round" opacity=".55"/>
          <ellipse cx="506" cy="366" rx="42" ry="24" fill="#7a3d1a" transform="rotate(23 506 366)"/>
          <ellipse cx="679" cy="275" rx="48" ry="26" fill="#91451a" transform="rotate(-24 679 275)"/>
          <ellipse cx="615" cy="361" rx="35" ry="20" fill="#ba5522" transform="rotate(15 615 361)"/>
        </g>
        {/* Fresh coriander leaves */}
        <g fill="url(#dine-leaf)" stroke="#1b5127" strokeWidth="2">
          <path d="M569 284q-23-32-46-15 3 22 34 29-30-1-37 24 32 20 54-20 9 34 31 32 15-26-17-42 26-5 20-28-21-13-39 20Z"/>
          <path d="M660 376q-12-25-33-13 0 21 24 26-23-2-29 17 26 18 40-13 7 26 25 26 14-21-11-34 20-1 19-19-19-11-35 10Z"/>
        </g>
        <circle cx="505" cy="256" r="9" fill="#d84928"/><circle cx="721" cy="338" r="8" fill="#d84928"/>
        <ellipse cx="592" cy="314" rx="268" ry="198" fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth="7"/>
      </g>
      {/* Polished cutlery */}
      <g transform="translate(835 175) rotate(28)" filter="url(#dine-shadow)">
        <rect x="11" y="92" width="15" height="226" rx="7" fill="url(#dine-metal)"/>
        <path d="M3 0v77q0 25 15 25t15-25V0M-9 0v58q0 32 25 32M45 0v58q0 32-25 32" fill="none" stroke="url(#dine-metal)" strokeWidth="9" strokeLinecap="round"/>
      </g>
      {/* Warm floating kitchen clock marker */}
      <g transform="translate(814 63)" filter="url(#dine-shadow)">
        <circle r="60" fill="#f7d6a3" opacity=".19"/>
        <circle r="47" fill="#fff9eb" stroke="#ffe3ac" strokeWidth="5"/>
        <circle r="36" fill="none" stroke="#e7c58c" strokeWidth="2.5"/>
        <path d="M0-25V0l19 10" fill="none" stroke="#9e581e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle r="5" fill="#9e581e"/>
      </g>
      <ellipse cx="755" cy="31" rx="75" ry="16" fill="#ffe5a7" opacity=".18" filter="url(#dine-soft)"/>
    </svg>
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(33,21,10,.97)_0%,rgba(49,25,12,.88)_37%,rgba(67,31,10,.18)_70%,transparent_96%)]"/>
    <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,.09),transparent_29%,transparent_75%,rgba(255,202,137,.11))]"/>
  </div>;
}
