"use client";

import Link from "@/app/components/DocumentLink";
import {useCustomerLanguage} from "@/app/components/CustomerLanguageProvider";
import {useEffect,useState} from "react";
import {ArrowLeft,ArrowUpRight,BadgeCheck,CarFront,Clock3,Droplets,Flame,Receipt,ShieldCheck,Smartphone,Tv,Wifi,Zap} from "lucide-react";

const copy={
  en:{
    kicker:"Digital services · India",title:"Zeshu Pay",sub:"Recharge and bill services in one easy place.",
    lead:"Explore available plans and bill information. Real recharges and bill payments are not enabled yet.",
    badge:"Discovery only · No live transactions",heading:"Explore services",description:"Select a service to view the existing discovery tools. Availability depends on the connected provider.",
    preview:"Explore details",note:"No payment or recharge will be completed. A successful TEST payment is not a completed bill or recharge.",
    footer:"We'll enable transactions only after a verified service-provider agreement, secure checkout, settlement reconciliation, refunds and customer support are ready.",
    how:"How we'll launch safely",one:"1. Confirm regulated provider and service coverage",two:"2. Verify bill and recharge details before payment",three:"3. Test fulfilment, duplicate prevention, refunds and receipts",four:"4. Enable real payments only after approval",
    home:"Back to Zeshu",help:"Payment help",upi:"UPI tools are informational only; Zeshu is not a UPI payment app.",planned:"Not accepting payments",
  },
  te:{
    kicker:"డిజిటల్ సేవలు · భారత్",title:"జెషు పే",sub:"రీచార్జ్ మరియు బిల్లు సేవల వివరాలు ఒకేచోట.",
    lead:"అందుబాటులో ఉన్న ప్లాన్లు, బిల్లు వివరాలు చూడండి. నిజమైన రీచార్జ్ లేదా బిల్లు చెల్లింపు ఇంకా ప్రారంభం కాలేదు.",
    badge:"వివరాల కోసం మాత్రమే · నిజమైన చెల్లింపులు లేవు",heading:"సేవలు చూడండి",description:"వివరాలు చూడటానికి సేవను ఎంచుకోండి. ప్రొవైడర్ అందుబాటుపై ఆధారపడి ఉంటుంది.",
    preview:"వివరాలు చూడండి",note:"ఇక్కడ నిజమైన రీచార్జ్ లేదా చెల్లింపు జరగదు. టెస్ట్ పేమెంట్ అంటే రీచార్జ్ పూర్తి అయినట్లు కాదు.",
    footer:"ధృవీకరించిన ప్రొవైడర్, సురక్షిత చెల్లింపు, సెటిల్‌మెంట్, రీఫండ్ మరియు సహాయం సిద్ధమైన తర్వాతే సేవలు ప్రారంభిస్తాం.",
    how:"సురక్షిత ప్రారంభ ప్రణాళిక",one:"1. సరైన ప్రొవైడర్‌ను నిర్ధారించాలి",two:"2. చెల్లించే ముందు బిల్లు/ప్లాన్ వివరాలు నిర్ధారించాలి",three:"3. రీఫండ్, రసీదు, డూప్లికేట్ నివారణ పరీక్షించాలి",four:"4. అనుమతి తర్వాతే నిజమైన చెల్లింపులు",
    home:"జెషుకు తిరిగి",help:"చెల్లింపు సహాయం",upi:"UPI టూల్స్ సమాచారం కోసం మాత్రమే; జెషు UPI చెల్లింపు యాప్ కాదు.",planned:"ఇంకా చెల్లింపులు అందుబాటులో లేవు",
  },
  hi:{
    kicker:"डिजिटल सेवाएँ · भारत",title:"ज़ेशु पे",sub:"रीचार्ज और बिल सेवाओं की जानकारी एक जगह।",
    lead:"उपलब्ध प्लान और बिल की जानकारी देखें। असली रीचार्ज और बिल भुगतान अभी शुरू नहीं हुए हैं।",
    badge:"केवल जानकारी · असली भुगतान बंद",heading:"सेवाएँ देखें",description:"जानकारी देखने के लिए सेवा चुनें। उपलब्धता जुड़े हुए प्रदाता पर निर्भर है।",
    preview:"जानकारी देखें",note:"यहाँ असली रीचार्ज या बिल भुगतान नहीं होगा। TEST भुगतान से रीचार्ज पूरा नहीं होता।",
    footer:"सत्यापित प्रदाता, सुरक्षित भुगतान, सेटलमेंट, रिफंड और सहायता तैयार होने के बाद ही लेनदेन शुरू होंगे।",
    how:"सुरक्षित लॉन्च योजना",one:"1. अधिकृत प्रदाता और कवरेज की पुष्टि",two:"2. भुगतान से पहले प्लान/बिल की पुष्टि",three:"3. रिफंड, रसीद और डुप्लिकेट रोकथाम की जाँच",four:"4. मंज़ूरी के बाद ही असली भुगतान",
    home:"ज़ेशु होम",help:"भुगतान सहायता",upi:"UPI टूल केवल जानकारी के लिए हैं; ज़ेशु UPI भुगतान ऐप नहीं है।",planned:"भुगतान अभी उपलब्ध नहीं",
  },
  ur:{
    kicker:"ڈیجیٹل خدمات · بھارت",title:"زیشو پے",sub:"ریچارج اور بل کی خدمات کی معلومات ایک جگہ۔",
    lead:"دستیاب پلان اور بل کی معلومات دیکھیں۔ حقیقی ریچارج اور بل کی ادائیگیاں ابھی فعال نہیں ہیں۔",
    badge:"صرف معلومات · حقیقی ادائیگی نہیں",heading:"خدمات دیکھیں",description:"تفصیلات کے لیے سروس منتخب کریں۔ دستیابی متعلقہ فراہم کنندہ پر منحصر ہے۔",
    preview:"تفصیلات دیکھیں",note:"یہاں حقیقی ریچارج یا بل ادائیگی نہیں ہوگی۔ ٹیسٹ ادائیگی سے ریچارج مکمل نہیں ہوتا۔",
    footer:"تصدیق شدہ فراہم کنندہ، محفوظ ادائیگی، حساب، ریفنڈ اور مدد کی تیاری کے بعد ہی لین دین فعال ہوگا۔",
    how:"محفوظ آغاز کا منصوبہ",one:"1. مجاز فراہم کنندہ اور دستیابی کی تصدیق",two:"2. ادائیگی سے پہلے بل اور پلان کی تصدیق",three:"3. ریفنڈ، رسید اور دہری ادائیگی کی جانچ",four:"4. منظوری کے بعد حقیقی ادائیگی",
    home:"زیشو ہوم",help:"ادائیگی میں مدد",upi:"UPI ٹولز صرف معلومات کے لیے ہیں؛ زیشو UPI ادائیگی ایپ نہیں ہے۔",planned:"ادائیگیاں ابھی دستیاب نہیں",
  },
} as const;

const categories=[
  {id:"mobile",label:"Mobile Recharge",desc:"Prepaid plans and operator discovery",icon:Smartphone,shade:"bg-emerald-50 text-emerald-700"},
  {id:"electricity",label:"Electricity",desc:"Biller and bill details where available",icon:Zap,shade:"bg-amber-50 text-amber-700"},
  {id:"dth",label:"DTH",desc:"TV subscription and plan information",icon:Tv,shade:"bg-orange-50 text-orange-700"},
  {id:"fastag",label:"FASTag",desc:"Vehicle toll account discovery",icon:CarFront,shade:"bg-teal-50 text-teal-700"},
  {id:"lpg",label:"Gas Booking",desc:"LPG and consumer number information",icon:Flame,shade:"bg-rose-50 text-rose-700"},
  {id:"water",label:"Water Bill",desc:"Supported water billers and due amounts",icon:Droplets,shade:"bg-cyan-50 text-cyan-700"},
  {id:"broadband",label:"Broadband",desc:"Internet and fibre bill information",icon:Wifi,shade:"bg-violet-50 text-violet-700"},
  {id:"upi",label:"UPI Tools",desc:"Explore QR and UPI information, not payments",icon:BadgeCheck,shade:"bg-blue-50 text-blue-700"},
] as const;

export default function ZeshuPayPage(){
  const {t,language}=useCustomerLanguage();
  const [searchTerm,setSearchTerm]=useState("");
  useEffect(()=>{setSearchTerm(new URLSearchParams(window.location.search).get("q")||"");},[]);
  const matches=categories.filter(item=>[item.id,item.label,item.desc].join(" ").toLowerCase().includes(searchTerm.trim().toLowerCase()));
  const lang=(language in copy?language:"en") as keyof typeof copy;
  const w=copy[lang];
  const markIntent=()=>{
    // A one-use marker allows an explicit category click from the installed app,
    // without making a PWA restart or page refresh reopen checkout/services.
    try{window.sessionStorage.setItem("zeshu:pay:service-intent","1");}catch{}
  };
  return <main dir={lang==="ur"?"rtl":"ltr"} className="min-h-screen bg-[#f1f8fc] pb-16 text-slate-900">
    <div className="bg-[linear-gradient(125deg,#094d79,#0b7897)] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-bold"><ArrowLeft size={18}/>{w.home}</Link>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-black"><Receipt size={13} className="me-1 inline"/>{w.kicker}</span>
        </div>
        <div className="mt-9 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Need it? Zeshu it.</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">{w.title}</h1>
          <p className="mt-3 text-lg font-semibold text-emerald-50 sm:text-xl">{w.sub}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100">{w.lead}</p>
        </div>
      </div>
    </div>
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div role="status" className="-mt-5 relative flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
        <ShieldCheck className="shrink-0 text-amber-600" size={23}/>
        <div className="min-w-0 flex-1"><p className="text-sm font-black text-amber-900">{w.badge}</p><p className="mt-1 text-xs leading-5 text-slate-600">{w.note}</p></div>
      </div>
      <section aria-label="Shared Zeshu account" className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-cyan-100 bg-white p-4"><p className="text-xs font-black uppercase tracking-widest text-[#09658a]">Zeshu Cash</p><p className="mt-2 text-sm font-semibold text-slate-800">Your Zeshu Cash belongs to the same Zeshu account across departments.</p><p className="mt-2 text-xs text-slate-500">No amount is shown here without a verified signed-in balance; digital bill payments are still disabled.</p></div>
        <div className="rounded-2xl border border-cyan-100 bg-white p-4"><p className="text-xs font-black uppercase tracking-widest text-[#09658a]">Saved billers &amp; receipts</p><p className="mt-2 text-sm font-semibold text-slate-800">Transaction history will appear after real verified bill-pay transactions are enabled.</p><p className="mt-2 text-xs text-slate-500">No fabricated paid bills, UTRs or saved numbers are displayed.</p></div>
      </section>
      <section aria-labelledby="pay-service-heading" className="mt-9 scroll-mt-36">
        <h2 id="pay-service-heading" className="text-2xl font-black">{w.heading}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{w.description}</p>
        {searchTerm && <div className="mt-4 flex items-center justify-between gap-2 text-sm"><span>{matches.length} service categories for <strong>{searchTerm}</strong></span><button type="button" onClick={()=>setSearchTerm("")} className="font-bold text-[#09658a] underline">Show all</button></div>}
        {matches.length===0 && <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">No bill or recharge category matches that search. Check the name or ask Zeshu Help.</p>}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {matches.map(item=><Link key={item.id} data-pay-service={item.id}
             href={`/?view=services&service=${item.id}`} onClick={markIntent}
             className="group flex min-h-[180px] flex-col rounded-2xl border border-[#dce8df] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#075e45] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#075e45]">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${item.shade}`}><item.icon size={25}/></span>
            <h3 className="mt-3 text-sm font-black sm:text-base">{t(item.label)}</h3>
            <p className="mt-1 flex-1 text-xs leading-5 text-slate-600">{lang==="en"?item.desc:w.planned}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#075e45]">{w.preview}<ArrowUpRight size={14}/></span>
          </Link>)}
        </div>
        <p className="mt-4 text-xs font-semibold leading-6 text-slate-500">{w.upi}</p>
      </section>
      <section aria-labelledby="pay-safety-heading" className="mt-10 scroll-mt-36 rounded-3xl border border-[#dce8df] bg-white p-5 sm:p-8">
        <div className="flex items-center gap-2 text-[#075e45]"><Clock3 size={20}/><h2 id="pay-safety-heading" className="text-lg font-black">{w.how}</h2></div>
        <ol className="mt-4 grid gap-3 text-sm font-medium leading-6 text-slate-700 sm:grid-cols-2">
          {[w.one,w.two,w.three,w.four].map((step,i)=><li key={i} className="rounded-xl bg-emerald-50/70 p-4">{step}</li>)}
        </ol>
        <p className="mt-5 text-sm leading-6 text-slate-600">{w.footer}</p>
        <Link href="/help" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#075e45] px-5 text-sm font-black text-white">{w.help}<ArrowUpRight size={16}/></Link>
      </section>
    </div>
  </main>;
}
