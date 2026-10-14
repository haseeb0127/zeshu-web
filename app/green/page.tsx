"use client";

import {useEffect,useState} from "react";
import Link from "@/app/components/DocumentLink";
import {ArrowLeft,ArrowRight,CheckCircle2,Leaf,ShieldCheck,Sprout,TreePine,Clock3} from "lucide-react";
import {useCustomerLanguage,type CustomerLanguageCode} from "@/app/components/CustomerLanguageProvider";

type Impact={
 programmeStatus:"PLANNING"|"ACTIVE"|"PAUSED";treeCommitments:number;
 plantingReported:number;verifiedPlanted:number;isPlantingLive:boolean;
 partner:string|null;partnerWebsite:string|null;
};
const dictionaries={
 en:{
  program:"Zeshu Green",badge:"A transparent tree-planting initiative",
  mission:"Our goal: one tree for every eligible delivered order.",
  intro:"Shop for what you need. Help us grow a greener future—once verified planting partners and funding are in place.",
  statusPreparing:"Preparing the planting programme",statusPaused:"Temporarily paused",statusLive:"Funded planting programme active",
  truth:"No tree planting is claimed until a partner supplies verifiable planting evidence.",
  verified:"Verified trees planted",reserved:"Tree slots reserved",reported:"Plantings reported",how:"How it will work",
  oneTitle:"1. Complete a real order",oneText:"Only eligible, genuinely delivered orders placed after the programme starts count. Cancellations, refunds and TEST orders do not.",
  twoTitle:"2. A funded tree slot is reserved",twoText:"Zeshu or a sponsor covers the actual planting and care cost. No extra donation or checkout charge is added to your order.",
  threeTitle:"3. We verify and publish progress",threeText:"A vetted local planting partner reports the native species, planting area and evidence. We count a tree as verified planted only after proof.",
  commitment:"Our promise is accuracy, not inflated numbers",
  note:"The campaign is not active yet. No historical orders are included, and the displayed totals never count an order as a planted tree by itself.",
  activeNote:"One funded tree slot is reserved per newly eligible delivered order while the approved quota remains. Planting and survival are separately verified.",
  faq:"Why not show ‘one order = one tree planted’ immediately?",
  faqText:"Because planting happens later and trees need care. We distinguish commitments, partner planting reports, and evidence-backed verified plantings.",
  back:"Back to shopping",partnerTitle:"Planting partner",partnerPending:"Verification and funding in progress",
  noOffset:"This is not a carbon-offset or carbon-neutral claim.",disclosure:"Impact totals are from verified programme records, not estimates.",
  seePartner:"View partner website",
 },
 te:{
  program:"జెషు గ్రీన్",badge:"పారదర్శక చెట్ల పెంపకం కార్యక్రమం",
  mission:"మా లక్ష్యం: అర్హత గల ప్రతి డెలివరీ ఆర్డర్‌కు ఒక చెట్టు.",
  intro:"భాగస్వామి ధృవీకరణ మరియు నిధులు సిద్ధమైన తర్వాత చెట్ల నాటడం ప్రారంభమవుతుంది.",
  statusPreparing:"చెట్ల నాటే కార్యక్రమం సిద్ధమవుతోంది",statusPaused:"తాత్కాలికంగా నిలిపివేయబడింది",statusLive:"నిధులతో చెట్ల నాటే కార్యక్రమం ప్రారంభమైంది",
  truth:"భాగస్వామి ధృవీకరించదగిన ఆధారం ఇచ్చే వరకు చెట్టు నాటినట్లు ప్రకటించము.",
  verified:"ధృవీకరించిన చెట్లు",reserved:"కేటాయించిన చెట్ల స్థానాలు",reported:"నాటినట్లు నివేదించినవి",how:"ఇది ఎలా పనిచేస్తుంది",
  oneTitle:"1. నిజమైన ఆర్డర్ పూర్తిచేయండి",oneText:"కార్యక్రమం మొదలైన తర్వాత పూర్తిగా డెలివరీ అయిన అర్హత గల ఆర్డర్లే లెక్కలోకి వస్తాయి. టెస్ట్ ఆర్డర్లు, రద్దులు, రీఫండ్లు కాదు.",
  twoTitle:"2. చెట్టుకు నిధులు కేటాయిస్తాం",twoText:"జెషు లేదా స్పాన్సర్ చెట్టు నాటడం, సంరక్షణ ఖర్చును భరిస్తారు. వినియోగదారుకు అదనపు చార్జీ లేదు.",
  threeTitle:"3. ఆధారాలను ధృవీకరిస్తాం",threeText:"భాగస్వామి స్థానిక జాతి, ప్రాంతం, నాటిన ఆధారాలను అందిస్తారు. ధృవీకరించిన తర్వాతే చెట్టును లెక్కిస్తాం.",
  commitment:"నిజమైన గణాంకాలే మా లక్ష్యం",note:"కార్యక్రమం ఇంకా ప్రారంభం కాలేదు. పాత ఆర్డర్లు చెట్లు నాటినట్లు లెక్కించబడవు.",
  activeNote:"నిధుల కోటా ఉన్నంత వరకు అర్హత గల కొత్త డెలివరీ ఆర్డర్‌కు ఒక చెట్టు కేటాయిస్తాం.",
  faq:"ప్రతి ఆర్డర్‌కు వెంటనే ఒక చెట్టు నాటినట్లు ఎందుకు చెప్పము?",
  faqText:"చెట్టు నాటడానికి సమయం, సంరక్షణ అవసరం. కేటాయించినవి, నివేదించినవి, ధృవీకరించినవి వేర్వేరుగా చూపిస్తాం.",
  back:"షాపింగ్‌కు తిరిగి",partnerTitle:"చెట్ల నాటే భాగస్వామి",partnerPending:"ధృవీకరణ మరియు నిధుల ఏర్పాటులో ఉంది",
  noOffset:"ఇది కార్బన్ ఆఫ్‌సెట్ లేదా కార్బన్ న్యూట్రల్ ప్రకటన కాదు.",disclosure:"గణాంకాలు ధృవీకరించిన రికార్డుల ఆధారంగా చూపిస్తాం.",
  seePartner:"భాగస్వామి వెబ్‌సైట్",
 },
 hi:{
  program:"ज़ेशु ग्रीन",badge:"पारदर्शी वृक्षारोपण पहल",
  mission:"हमारा लक्ष्य: हर पात्र डिलीवर हुए ऑर्डर पर एक पेड़।",
  intro:"सत्यापित पौधरोपण साझेदार और पर्याप्त फंड मिलने के बाद ही कार्यक्रम शुरू होगा।",
  statusPreparing:"वृक्षारोपण कार्यक्रम की तैयारी जारी है",statusPaused:"फिलहाल रुका हुआ है",statusLive:"वित्तपोषित वृक्षारोपण कार्यक्रम सक्रिय है",
  truth:"विश्वसनीय रोपण प्रमाण मिलने तक हम पेड़ लग जाने का दावा नहीं करेंगे।",
  verified:"सत्यापित लगाए गए पेड़",reserved:"पेड़ों के लिए आरक्षित स्थान",reported:"रोपण की रिपोर्ट",how:"यह कैसे काम करेगा",
  oneTitle:"1. वास्तविक ऑर्डर पूरा करें",oneText:"कार्यक्रम शुरू होने के बाद के पात्र और डिलीवर किए गए ऑर्डर ही गिने जाएंगे। टेस्ट, रद्द और रिफंड ऑर्डर नहीं।",
  twoTitle:"2. पेड़ के लिए फंड आरक्षित होगा",twoText:"ज़ेशु या प्रायोजक रोपण व देखभाल का खर्च उठाएगा। ग्राहक पर अतिरिक्त शुल्क नहीं लगेगा।",
  threeTitle:"3. प्रमाण जांचकर परिणाम दिखाएंगे",threeText:"साझेदार स्थानीय प्रजाति, स्थान और रोपण प्रमाण देगा। प्रमाणित होने पर ही पेड़ गिना जाएगा।",
  commitment:"सही आंकड़े, बढ़ा-चढ़ाकर नहीं",note:"कार्यक्रम अभी सक्रिय नहीं है। पुराने ऑर्डर लगाए गए पेड़ नहीं माने जाएंगे।",
  activeNote:"फंड उपलब्ध रहने तक हर पात्र नए डिलीवर किए गए ऑर्डर के लिए एक पेड़ आरक्षित होगा।",
  faq:"हर ऑर्डर पर तुरंत पेड़ लगने का दावा क्यों नहीं?",
  faqText:"रोपण बाद में होता है और पेड़ की देखभाल जरूरी है। आरक्षित, रिपोर्ट किए गए और प्रमाणित पेड़ अलग दिखाएंगे।",
  back:"खरीदारी पर लौटें",partnerTitle:"रोपण साझेदार",partnerPending:"साझेदार सत्यापन और फंड की तैयारी जारी",
  noOffset:"यह कार्बन ऑफसेट या कार्बन-न्यूट्रल दावा नहीं है।",disclosure:"ये आंकड़े सत्यापित रिकॉर्ड पर आधारित हैं, अनुमान पर नहीं।",
  seePartner:"साझेदार वेबसाइट",
 },
 ur:{
  program:"زیشو گرین",badge:"شفاف شجرکاری پروگرام",
  mission:"ہمارا ہدف: ہر اہل مکمل ڈیلیور شدہ آرڈر پر ایک درخت۔",
  intro:"تصدیق شدہ شجرکاری پارٹنر اور فنڈز دستیاب ہونے کے بعد پروگرام شروع ہوگا۔",
  statusPreparing:"شجرکاری پروگرام کی تیاری جاری ہے",statusPaused:"عارضی طور پر روک دیا گیا ہے",statusLive:"فنڈ شدہ شجرکاری پروگرام فعال ہے",
  truth:"قابلِ تصدیق ثبوت کے بغیر درخت لگنے کا دعویٰ نہیں کیا جائے گا۔",
  verified:"تصدیق شدہ لگائے گئے درخت",reserved:"درختوں کے لیے مختص جگہیں",reported:"شجرکاری کی رپورٹس",how:"یہ کیسے کام کرے گا",
  oneTitle:"1. حقیقی آرڈر مکمل کریں",oneText:"پروگرام شروع ہونے کے بعد کے اہل ڈیلیور شدہ آرڈرز ہی گنے جائیں گے۔ ٹیسٹ، منسوخ اور ریفنڈ آرڈر نہیں۔",
  twoTitle:"2. درخت کے لیے فنڈ مختص ہوگا",twoText:"زیشو یا اسپانسر شجرکاری اور دیکھ بھال کا خرچ اٹھائے گا۔ صارف سے اضافی رقم نہیں لی جائے گی۔",
  threeTitle:"3. ثبوت کے ساتھ پیش رفت دکھائیں گے",threeText:"پارٹنر مقامی قسم، جگہ اور شجرکاری کا ثبوت فراہم کرے گا۔ تصدیق کے بعد ہی درخت شمار ہوگا۔",
  commitment:"بڑھا چڑھا کر نہیں، حقیقی اعداد",note:"پروگرام ابھی شروع نہیں ہوا۔ پرانے آرڈر لگائے گئے درخت شمار نہیں ہوں گے۔",
  activeNote:"فنڈڈ کوٹہ دستیاب ہونے تک ہر نئے اہل ڈیلیور شدہ آرڈر کے لیے ایک درخت مختص ہوگا۔",
  faq:"ہر آرڈر کے ساتھ فوری درخت لگنے کا دعویٰ کیوں نہیں؟",
  faqText:"شجرکاری بعد میں ہوتی ہے اور درختوں کی دیکھ بھال ضروری ہے۔ مختص، رپورٹ شدہ اور تصدیق شدہ درخت الگ دکھائیں گے۔",
  back:"شاپنگ پر واپس",partnerTitle:"شجرکاری پارٹنر",partnerPending:"تصدیق اور فنڈز کی تیاری جاری ہے",
  noOffset:"یہ کاربن آفسیٹ یا کاربن نیوٹرل دعویٰ نہیں ہے۔",disclosure:"اعداد تصدیق شدہ ریکارڈز کی بنیاد پر ہیں، اندازوں پر نہیں۔",
  seePartner:"پارٹنر ویب سائٹ",
 },
} as const;

export default function ZeshuGreenPage(){
 const {language}=useCustomerLanguage();
 const text=dictionaries[language as CustomerLanguageCode]||dictionaries.en;
 const [impact,setImpact]=useState<Impact|null>(null);
 const [unavailable,setUnavailable]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch('/api/green/impact',{cache:'no-store',signal:controller.signal}).then(async r=>{
    if(!r.ok)throw Error('Unavailable');
    return await r.json();
  }).then(x=>{if(!controller.signal.aborted)setImpact(x as Impact);})
   .catch(()=>{if(!controller.signal.aborted)setUnavailable(true);});
  return ()=>controller.abort();
 },[]);
 const active=impact?.programmeStatus==='ACTIVE';
 const state=impact?.programmeStatus==='PAUSED'?text.statusPaused:active?text.statusLive:text.statusPreparing;
 const stages=[
  {icon:CheckCircle2,title:text.oneTitle,description:text.oneText},
  {icon:Sprout,title:text.twoTitle,description:text.twoText},
  {icon:ShieldCheck,title:text.threeTitle,description:text.threeText},
 ];
 return <main className="min-h-screen bg-[#f6f9f4] text-[#13241c]" dir={language==='ur'?'rtl':'ltr'}>
  <div className="mx-auto max-w-5xl px-4 pb-20 pt-5 md:px-7 md:pt-10">
   <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-900"><ArrowLeft size={16}/>{text.back}</Link>
   <section className="relative mt-5 overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_88%_20%,#317e42,transparent_52%),linear-gradient(120deg,#06452f,#073b28)] px-6 py-9 text-white shadow-xl md:px-12 md:py-14">
    <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 text-[#e3ff9d]/15"><TreePine size={300} strokeWidth={.65}/></div>
    <p className="relative inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold"><Leaf size={16}/>{text.badge}</p>
    <h1 className="relative mt-4 text-[42px] font-black leading-tight tracking-tight md:text-6xl">{text.program}</h1>
    <h2 className="relative mt-3 max-w-[680px] text-xl font-bold leading-snug text-[#dfffac] md:text-3xl">{text.mission}</h2>
    <p className="relative mt-4 max-w-[610px] text-sm leading-7 text-white/85 md:text-base">{text.intro}</p>
    <p data-green-status className="relative mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-xs font-extrabold"><Clock3 size={17}/>{state}</p>
   </section>
   <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium leading-6 text-amber-950" role="status">
    {impact?(active?text.activeNote:text.note):unavailable?'Tree programme records are temporarily unavailable. No planting count can be verified.':text.statusPreparing}
   </p>
   <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Tree programme impact">
    {[{icon:TreePine,value:impact?.verifiedPlanted,label:text.verified},{icon:Sprout,value:impact?.treeCommitments,label:text.reserved},{icon:Leaf,value:impact?.plantingReported,label:text.reported}].map(item=>
     <div key={item.label} className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
      <item.icon size={28} className="text-emerald-700" aria-hidden="true"/>
      <p className="mt-3 text-4xl font-black tabular-nums text-[#075e45]">{impact?item.value?.toLocaleString('en-IN'):'—'}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{item.label}</p>
     </div>)}
   </div>
   <p className="mt-3 flex items-center gap-2 text-xs text-slate-600"><ShieldCheck size={15}/>{text.disclosure}</p>
   <section className="mt-11">
    <h2 className="text-2xl font-black text-[#074c34] md:text-3xl">{text.how}</h2>
    <div className="mt-5 grid gap-4 md:grid-cols-3">
     {stages.map(s=><article key={s.title} className="rounded-[25px] border border-emerald-100 bg-white p-5 shadow-sm">
      <s.icon size={28} className="text-emerald-700"/>
      <h3 className="mt-3 text-base font-black">{s.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{s.description}</p>
     </article>)}
    </div>
   </section>
   <section className="mt-9 rounded-[24px] border border-emerald-100 bg-white p-6">
    <h2 className="text-lg font-black">{text.partnerTitle}</h2>
    <p className="mt-2 text-sm text-slate-700">{active&&impact.partner?impact.partner:text.partnerPending}</p>
    {active&&impact.partnerWebsite&&<a href={impact.partnerWebsite} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-bold text-emerald-700 underline">{text.seePartner}<ArrowRight size={15}/></a>}
   </section>
   <section className="mt-8 rounded-[24px] bg-[#e3f4e6] p-6">
    <h2 className="text-xl font-black">{text.commitment}</h2>
    <p className="mt-3 font-semibold text-emerald-950">{text.truth}</p>
    <h3 className="mt-5 font-bold">{text.faq}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-700">{text.faqText}</p>
    <p className="mt-4 text-xs font-semibold text-emerald-900">{text.noOffset}</p>
   </section>
  </div>
 </main>;
}
