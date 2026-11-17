"use client";

import {useEffect,useState} from "react";
import Link from "@/app/components/DocumentLink";
import {ArrowLeft,Leaf,ShieldCheck,TreePine,Clock3} from "lucide-react";
import {useCustomerLanguage} from "@/app/components/CustomerLanguageProvider";

type Impact={programmeStatus:"PLANNING"|"ACTIVE"|"PAUSED";verifiedPlanted:number;plantingReported:number;treeCommitments:number;partner:string|null;partnerWebsite:string|null};
type Words={
 title:string;subtitle:string;intro:string;statusPlanned:string;statusPaused:string;
 statusLive:string;planTitle:string;plan:string;note:string;
 first:string;firstText:string;second:string;secondText:string;
 third:string;thirdText:string;verified:string;reported:string;reservations:string;
 evidence:string;partner:string;pending:string;noOffset:string;back:string;seePartner:string;
};
const translations:Record<"en"|"te"|"hi"|"ur",Words>={
 en:{
  title:"Zeshu Green",subtitle:"Growing a greener future, one small step at a time.",
  intro:"Our goal is one tree for every eligible completed delivery order. The programme is not live yet: funding, a local planting partner, permissions, long-term care and order-level tracking must be confirmed before we count or claim any tree.",
  statusPlanned:"Planting is still being planned",statusPaused:"Planting is temporarily paused",
  statusLive:"Funded tree programme active",planTitle:"A small, honest first milestone",
  plan:"One eligible completed delivery order → one tree goal. Zeshu will fund planting without adding a checkout fee, but only after funding, partner, land permission, care and evidence arrangements are confirmed. Cancellations, refunds and test orders do not qualify.",
  note:"No tree is claimed for a purchase until it is actually planted and independently verified. Checkout adds no tree fee.",
  first:"1. Shop as usual",firstText:"Only eligible real delivered orders after a separately approved start can count. Cancellations, refunds and TEST orders do not.",
  second:"2. Arrange planting",secondText:"Before the programme starts, we will confirm a suitable local planting partner, land permission, species, per-tree funding, long-term care and evidence process.",
  third:"3. Share real evidence",thirdText:"We will publish order-linked planting batches, dates and site evidence only after a partner plants and verifies them. Until then, the programme remains in preparation.",
  verified:"Trees verified planted",reported:"Plantings reported (not yet verified)",reservations:"Previously recorded funded commitments",
  evidence:"Only funded and evidence-backed trees will be counted as planted. The one-tree-per-eligible-delivered-order goal is not active yet.",
  partner:"Planting partner",pending:"No planting partner confirmed yet.",
  noOffset:"This is not a carbon-offset, emissions reduction or carbon-neutrality claim.",
  back:"Back to shopping",seePartner:"Planting partner website",
 },
 te:{
  title:"జెషు గ్రీన్",subtitle:"చిన్న అడుగులతో పచ్చని భవిష్యత్తు.",
  intro:"ప్రతి అర్హమైన పూర్తయిన డెలివరీ ఆర్డర్‌కు ఒక చెట్టు మా లక్ష్యం. నిధులు, స్థానిక భాగస్వామి, అనుమతులు, సంరక్షణ, ఆర్డర్ ట్రాకింగ్ ఖరారు అయ్యే వరకు కార్యక్రమం ప్రారంభం కాదు.",
  statusPlanned:"మొక్కల కార్యక్రమం ప్రణాళికలో ఉంది",statusPaused:"ప్రణాళిక తాత్కాలికంగా నిలిచింది",
  statusLive:"నిధులతో కార్యక్రమం చురుకుగా ఉంది",planTitle:"మొదటి చిన్న లక్ష్యం",
  plan:"ఒక అర్హమైన పూర్తయిన డెలివరీ ఆర్డర్ → ఒక చెట్టు లక్ష్యం. చెక్‌అవుట్‌లో అదనపు రుసుము ఉండదు; నిధులు, భాగస్వామి, స్థలం, అనుమతులు, సంరక్షణ ఖరారు అయిన తర్వాతే ప్రారంభిస్తాం.",
  note:"నిజంగా నాటి ధృవీకరించే వరకు ఆర్డర్‌కు చెట్టు నాటినట్లు చెప్పము. అదనపు రుసుము లేదు.",
  first:"1. సాధారణంగా షాపింగ్ చేయండి",firstText:"ప్రత్యేకంగా ఆమోదించిన ప్రారంభం తర్వాతి నిజమైన డెలివరీ ఆర్డర్లే అర్హం. టెస్ట్, రద్దు, రీఫండ్ ఆర్డర్లు కాదు.",
  second:"2. చెట్లు నాటేందుకు ఏర్పాటు",secondText:"కార్యక్రమం ప్రారంభానికి ముందే స్థానిక భాగస్వామి, స్థల అనుమతి, మొక్కల జాతులు, ప్రతి చెట్టుకు నిధులు, దీర్ఘకాలిక సంరక్షణ, ఆధారాలను ఖరారు చేస్తాం.",
  third:"3. నిజమైన ఆధారాలు",thirdText:"నాటిన తర్వాతే ధృవీకరించిన చిత్రాలు, తేదీలు, స్థలం వెల్లడిస్తాం.",
  verified:"ధృవీకరించిన చెట్లు",reported:"నాటినట్లు తెలిపినవి (ధృవీకరణ పెండింగ్)",reservations:"గతంలో నమోదు చేసిన నిధుల కేటాయింపులు",
  evidence:"నిధులు సమకూరి ఆధారాలతో ధృవీకరించిన చెట్లనే లెక్కిస్తాం. ప్రతి అర్హమైన డెలివరీ ఆర్డర్‌కు ఒక చెట్టు అనేది ఇంకా ప్రారంభం కాని లక్ష్యం.",
  partner:"నాటే భాగస్వామి",pending:"భాగస్వామి ఇంకా ఖరారు కాలేదు.",
  noOffset:"ఇది కార్బన్ ఆఫ్‌సెట్ లేదా కార్బన్ న్యూట్రల్ ప్రకటన కాదు.",
  back:"షాపింగ్‌కు తిరిగి",seePartner:"భాగస్వామి వెబ్‌సైట్",
 },
 hi:{
  title:"ज़ेशु ग्रीन",subtitle:"छोटे कदम, हरियाली की ओर.",
  intro:"हमारा लक्ष्य हर पात्र पूर्ण डिलीवरी ऑर्डर पर एक पेड़ है। फंडिंग, स्थानीय साझेदार, अनुमति, देखभाल और ऑर्डर ट्रैकिंग की पुष्टि होने तक कार्यक्रम शुरू नहीं होगा।",
  statusPlanned:"वृक्षारोपण की योजना बन रही है",statusPaused:"योजना फिलहाल रुकी हुई है",
  statusLive:"फंड वाला वृक्ष कार्यक्रम सक्रिय है",planTitle:"पहला छोटा और सच्चा लक्ष्य",
  plan:"एक पात्र पूर्ण डिलीवरी ऑर्डर → एक पेड़ का लक्ष्य। चेकआउट पर अतिरिक्त शुल्क नहीं होगा; फंडिंग, साझेदार, जगह, अनुमति और देखभाल तय होने के बाद ही शुरू होगा।",
  note:"वास्तव में पेड़ लगने और सत्यापन के पहले किसी खरीद पर पेड़ लगाने का दावा नहीं। कोई अतिरिक्त शुल्क नहीं.",
  first:"1. सामान्य खरीदारी करें",firstText:"अलग से मंजूर शुरुआत के बाद के असली डिलीवर ऑर्डर ही गिने जाएंगे। टेस्ट, रद्द या रिफंड ऑर्डर नहीं.",
  second:"2. वृक्षारोपण की व्यवस्था",secondText:"कार्यक्रम शुरू होने से पहले स्थानीय साझेदार, जगह की अनुमति, प्रजाति, प्रति पेड़ फंडिंग, लंबे समय की देखभाल और प्रमाण तय करेंगे।",
  third:"3. असली प्रमाण साझा करें",thirdText:"पौधे लगाने के बाद ही सत्यापित तस्वीरें, तारीख और स्थान दिखाएंगे.",
  verified:"सत्यापित लगाए गए पेड़",reported:"लगाने की रिपोर्ट (सत्यापन बाकी)",reservations:"पहले दर्ज फंड वाले संकल्प",
  evidence:"केवल फंड किए गए और प्रमाणित पेड़ों को लगाया हुआ गिना जाएगा। हर पात्र डिलीवरी पर एक पेड़ का लक्ष्य अभी शुरू नहीं हुआ है।",
  partner:"वृक्षारोपण साथी",pending:"अभी कोई साथी निश्चित नहीं है.",
  noOffset:"यह कार्बन ऑफसेट या कार्बन-न्यूट्रल दावा नहीं है.",
  back:"खरीदारी पर लौटें",seePartner:"साथी की वेबसाइट",
 },
 ur:{
  title:"زیشو گرین",subtitle:"سرسبز مستقبل کی جانب چھوٹے قدم.",
  intro:"ہمارا مقصد ہر اہل مکمل ڈیلیوری آرڈر پر ایک درخت ہے۔ فنڈنگ، مقامی پارٹنر، اجازت، دیکھ بھال اور آرڈر ٹریکنگ کی تصدیق تک پروگرام شروع نہیں ہوگا۔",
  statusPlanned:"شجرکاری ابھی منصوبے میں ہے",statusPaused:"منصوبہ عارضی طور پر رکا ہے",
  statusLive:"فنڈڈ شجرکاری پروگرام فعال ہے",planTitle:"پہلا چھوٹا، سچا ہدف",
  plan:"ایک اہل مکمل ڈیلیوری آرڈر → ایک درخت کا ہدف۔ چیک آؤٹ پر کوئی اضافی فیس نہیں؛ فنڈنگ، پارٹنر، جگہ، اجازت اور دیکھ بھال طے ہونے کے بعد ہی آغاز ہوگا۔",
  note:"حقیقتاً درخت لگنے اور تصدیق ہونے تک کسی خرید پر شجرکاری کا دعویٰ نہیں۔ کوئی اضافی فیس نہیں.",
  first:"1. معمول کے مطابق خریداری",firstText:"الگ سے منظور شدہ شروعات کے بعد کے حقیقی ڈیلیور آرڈرز ہی گنے جائیں گے۔ ٹیسٹ، منسوخ یا ریفنڈ آرڈرز نہیں.",
  second:"2. شجرکاری کا انتظام",secondText:"پروگرام شروع ہونے سے پہلے مقامی پارٹنر، زمین کی اجازت، درخت کی قسم، فی درخت فنڈنگ، طویل مدتی دیکھ بھال اور ثبوت طے کریں گے.",
  third:"3. حقیقی ثبوت",thirdText:"درخت لگنے کے بعد ہی تصدیق شدہ تصاویر، تاریخ اور جگہ دکھائیں گے.",
  verified:"تصدیق شدہ لگائے گئے درخت",reported:"شجرکاری کی رپورٹ (تصدیق باقی)",reservations:"پہلے درج فنڈڈ ذمہ داریاں",
  evidence:"صرف فنڈڈ اور ثبوت سے تصدیق شدہ درخت ہی شمار ہوں گے۔ ہر اہل ڈیلیوری پر ایک درخت کا ہدف ابھی شروع نہیں ہوا۔",
  partner:"شجرکاری پارٹنر",pending:"ابھی کوئی پارٹنر طے نہیں.",
  noOffset:"یہ کاربن آفسیٹ یا کاربن نیوٹرل دعویٰ نہیں.",
  back:"خریداری پر واپس",seePartner:"پارٹنر کی ویب سائٹ",
 },
};

export default function ZeshuGreenPage(){
 const {language}=useCustomerLanguage();
 const w=translations[language]||translations.en;
 const [impact,setImpact]=useState<Impact|null>(null);
 const [offline,setOffline]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch('/api/green/impact',{cache:'no-store',signal:controller.signal})
   .then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();})
   .then(result=>{if(!controller.signal.aborted)setImpact(result);})
   .catch(()=>{if(!controller.signal.aborted)setOffline(true);});
  return()=>controller.abort();
 },[]);
 const status=impact?.programmeStatus==='ACTIVE'?w.statusLive:
  impact?.programmeStatus==='PAUSED'?w.statusPaused:w.statusPlanned;
 return <main className="min-h-screen bg-[#f6f9f4] text-[#13241c]" dir={language==='ur'?'rtl':'ltr'}>
  <div className="mx-auto max-w-4xl px-4 pb-20 pt-5 md:px-7 md:pt-10">
   <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-900"><ArrowLeft size={16}/>{w.back}</Link>
   <header className="relative mt-5 overflow-hidden rounded-[28px] bg-[linear-gradient(115deg,#06452f,#0b693f)] px-5 py-9 text-white shadow-lg md:px-10">
    <TreePine className="pointer-events-none absolute -right-8 -top-12 text-emerald-200/20" size={230} strokeWidth={.6}/>
    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold"><Leaf size={15}/>{w.title}</p>
    <h1 className="mt-3 text-3xl font-black md:text-5xl">{w.subtitle}</h1>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">{w.intro}</p>
   </header>
   <p role="status" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950"><Clock3 size={17}/>{offline?'Planting status temporarily unavailable':status}</p>
   <section className="mt-5 rounded-2xl border border-emerald-100 bg-white p-5 md:p-6">
    <h2 className="text-lg font-black text-[#075e45]">{w.planTitle}</h2>
    <p className="mt-2 text-sm leading-7 text-slate-700">{w.plan}</p>
    <p className="mt-3 text-xs font-semibold leading-6 text-slate-600">{w.note}</p>
   </section>
   <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Verified planting records">
    {([
     [w.verified,impact?.verifiedPlanted],
     [w.reported,impact?.plantingReported],
     [w.reservations,impact?.treeCommitments],
    ] as const).map(([label,total])=>
     <div key={label} className="rounded-2xl border border-emerald-100 bg-white px-4 py-5">
      <p className="text-3xl font-black tabular-nums text-emerald-800">{impact?Number(total||0).toLocaleString('en-IN'):'—'}</p>
      <p className="mt-2 text-xs font-semibold text-slate-700">{label}</p>
     </div>)}
   </section>
   <p className="mt-2 inline-flex items-start gap-2 text-xs leading-5 text-slate-600"><ShieldCheck size={15} className="mt-0.5 shrink-0"/>{w.evidence}</p>
   <section className="mt-9">
    <h2 className="text-xl font-black text-emerald-950">{w.title}</h2>
    <div className="mt-3 grid gap-3 md:grid-cols-3">
     {([[w.first,w.firstText],[w.second,w.secondText],[w.third,w.thirdText]] as const).map(([title,body])=>
      <article key={title} className="rounded-2xl border border-emerald-100 bg-white p-5">
       <h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      </article>)}
    </div>
   </section>
   <footer className="mt-8 rounded-2xl bg-emerald-50 p-5">
    <p className="font-black text-emerald-950">{w.partner}</p>
    <p className="mt-2 text-sm text-slate-700">{impact?.partner||w.pending}</p>
    {impact?.partnerWebsite&&<a href={impact.partnerWebsite} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-bold text-emerald-800 underline">{w.seePartner}</a>}
    <p className="mt-3 text-xs leading-5 text-slate-600">{w.noOffset}</p>
   </footer>
  </div>
 </main>;
}
