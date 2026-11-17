"use client";

import {useEffect,useState} from "react";
import Link from "@/app/components/DocumentLink";
import {TreePine,ShieldCheck} from "lucide-react";
import {customerSupabase} from "@/app/lib/browser-supabase";
import {useCustomerLanguage} from "@/app/components/CustomerLanguageProvider";

type PublicImpact={programmeStatus:"PLANNING"|"ACTIVE"|"PAUSED"};
type Status="PLEDGED"|"REPORTED"|"VERIFIED"|"VOID"|"INELIGIBLE"|"NOT_RECORDED"|"AWAITING_DELIVERY"|"PAUSED"|"PLANNING";
type OrderImpact={status:Status;proofUrl:string|null};
type Words={
 name:string;cart:string;title:string;planning:string;paused:string;awaiting:string;
 pledged:string;reported:string;verified:string;voided:string;notRecorded:string;
 ineligible:string;unavailable:string;proof:string;details:string;noFee:string;
};
const lang:Record<"en"|"te"|"hi"|"ur",Words>={
 en:{
  name:"Zeshu Green",cart:"Our goal: one tree for every eligible delivered order. Funding and local planting are being prepared; no extra fee.",
  title:"Your order & Zeshu Green",
  planning:"Our goal is one tree for every eligible delivered order. The programme is not live yet; no tree is funded, reserved or planted for this order.",
  paused:"Tree-planting plans are paused. No tree is claimed for this order.",
  awaiting:"Thanks for shopping with Zeshu. Our goal is one tree for each eligible delivered order; funding and planting arrangements are still being prepared.",
  pledged:"A funded future tree commitment is recorded for this order; planting has not happened yet.",
  reported:"A planting was reported by a partner; evidence verification is still pending.",
  verified:"A tree has been planted and independently verified. See the planting evidence.",
  voided:"This order has no active tree commitment.",
  notRecorded:"No verified tree planting or funded reservation is recorded for this order.",
  ineligible:"This order is not eligible for a tree commitment.",
  unavailable:"Tree-planting status cannot be verified right now. No planting is claimed.",
  proof:"See verified planting evidence",details:"Our planting plan",noFee:"No extra fee",
 },
 te:{
  name:"జెషు గ్రీన్",cart:"ప్రతి అర్హమైన డెలివరీ ఆర్డర్‌కు ఒక చెట్టు నాటాలన్నది మా లక్ష్యం. నిధులు, స్థానిక ఏర్పాట్లు సిద్ధమవుతున్నాయి; అదనపు రుసుము లేదు.",
  title:"మీ ఆర్డర్ మరియు జెషు గ్రీన్",
  planning:"ప్రతి అర్హమైన డెలివరీ ఆర్డర్‌కు ఒక చెట్టు మా లక్ష్యం. కార్యక్రమం ఇంకా ప్రారంభం కాలేదు; ఈ ఆర్డర్‌కు చెట్టు నిధులు, కేటాయింపు లేదా నాటడం జరగలేదు.",
  paused:"మొక్కలు నాటే ప్రణాళిక నిలిపివేయబడింది. ఈ ఆర్డర్‌కు చెట్టు నాటినట్లు చెప్పడం లేదు.",
  awaiting:"జెషులో షాపింగ్ చేసినందుకు ధన్యవాదాలు. ప్రతి అర్హమైన డెలివరీ ఆర్డర్‌కు ఒక చెట్టు మా లక్ష్యం; నిధులు, నాటే ఏర్పాట్లు ఇంకా సిద్ధమవుతున్నాయి.",
  pledged:"ఈ ఆర్డర్‌కు భవిష్యత్తు కోసం చెట్టు నిధుల కేటాయింపు ఉంది; ఇంకా నాటలేదు.",
  reported:"మొక్క నాటినట్లు భాగస్వామి తెలిపాడు; ఆధారాల ధృవీకరణ పెండింగ్‌లో ఉంది.",
  verified:"ఒక చెట్టు నాటబడినట్లు ఆధారాలతో ధృవీకరించారు. వివరాలు చూడండి.",
  voided:"ఈ ఆర్డర్‌కు క్రియాశీల చెట్టు కేటాయింపు లేదు.",
  notRecorded:"ఈ ఆర్డర్‌కు ధృవీకరించిన మొక్క నాటడం లేదా నిధుల కేటాయింపు నమోదు కాలేదు.",
  ineligible:"ఈ ఆర్డర్ చెట్టు కార్యక్రమానికి అర్హం కాదు.",
  unavailable:"చెట్టు సమాచారం ప్రస్తుతం ధృవీకరించలేము; నాటినట్లు చెప్పడం లేదు.",
  proof:"ధృవీకరించిన ఆధారాలు",details:"మొక్కల ప్రణాళిక",noFee:"అదనపు రుసుము లేదు",
 },
 hi:{
  name:"ज़ेशु ग्रीन",cart:"हमारा लक्ष्य हर पात्र डिलीवर ऑर्डर पर एक पेड़ लगाना है। फंडिंग और स्थानीय व्यवस्था तैयार की जा रही है; कोई अतिरिक्त शुल्क नहीं।",
  title:"आपका ऑर्डर और ज़ेशु ग्रीन",
  planning:"हर पात्र डिलीवर ऑर्डर पर एक पेड़ हमारा लक्ष्य है। कार्यक्रम अभी शुरू नहीं हुआ है; इस ऑर्डर के लिए पेड़ का फंड या आरक्षण नहीं है।",
  paused:"वृक्षारोपण योजना रुकी हुई है। इस ऑर्डर पर कोई पेड़ लगाने का दावा नहीं है.",
  awaiting:"ज़ेशु से खरीदारी के लिए धन्यवाद। हमारा लक्ष्य हर पात्र डिलीवर ऑर्डर पर एक पेड़ है; फंडिंग और रोपण की व्यवस्था अभी तैयार हो रही है।",
  pledged:"इस ऑर्डर के लिए भविष्य का वित्तपोषित वृक्ष संकल्प दर्ज है; पेड़ अभी नहीं लगा है.",
  reported:"साझेदार ने पौधा लगाने की सूचना दी है; प्रमाण की जाँच बाकी है.",
  verified:"एक पेड़ लगाए जाने का स्वतंत्र सत्यापन हुआ है। प्रमाण देखें.",
  voided:"इस ऑर्डर पर कोई सक्रिय वृक्ष संकल्प नहीं है.",
  notRecorded:"इस ऑर्डर के लिए कोई सत्यापित वृक्षारोपण या वित्तपोषित आरक्षण दर्ज नहीं है.",
  ineligible:"यह ऑर्डर वृक्ष कार्यक्रम के लिए पात्र नहीं है.",
  unavailable:"अभी वृक्षारोपण की स्थिति की पुष्टि नहीं हो सकती; कोई दावा नहीं किया जा रहा है.",
  proof:"सत्यापित रोपण प्रमाण",details:"हमारी वृक्ष योजना",noFee:"कोई अतिरिक्त शुल्क नहीं",
 },
 ur:{
  name:"زیشو گرین",cart:"ہمارا مقصد ہر اہل ڈیلیور آرڈر پر ایک درخت لگانا ہے۔ فنڈنگ اور مقامی انتظام تیار ہو رہا ہے؛ کوئی اضافی فیس نہیں۔",
  title:"آپ کا آرڈر اور زیشو گرین",
  planning:"ہر اہل ڈیلیور آرڈر پر ایک درخت ہمارا مقصد ہے۔ پروگرام ابھی شروع نہیں ہوا؛ اس آرڈر کے لیے فنڈ یا درخت مختص نہیں۔",
  paused:"شجرکاری کا منصوبہ رکا ہوا ہے۔ اس آرڈر کے لیے درخت لگنے کا دعویٰ نہیں۔",
  awaiting:"زیشو سے خریداری کا شکریہ۔ ہمارا مقصد ہر اہل ڈیلیور آرڈر پر ایک درخت ہے؛ فنڈنگ اور شجرکاری کا انتظام ابھی تیار ہو رہا ہے۔",
  pledged:"اس آرڈر کے لیے مستقبل میں شجرکاری کی فنڈڈ ذمہ داری درج ہے؛ ابھی درخت نہیں لگایا گیا۔",
  reported:"پارٹنر نے شجرکاری کی اطلاع دی ہے؛ ثبوت کی تصدیق باقی ہے۔",
  verified:"ایک درخت لگنے کا ثبوت تصدیق شدہ ہے۔ تفصیلات دیکھیں۔",
  voided:"اس آرڈر کے لیے کوئی فعال شجرکاری ذمہ داری نہیں۔",
  notRecorded:"اس آرڈر کے لیے تصدیق شدہ شجرکاری یا فنڈڈ بکنگ درج نہیں۔",
  ineligible:"یہ آرڈر شجرکاری پروگرام کے لیے اہل نہیں۔",
  unavailable:"شجرکاری کی حالت فی الحال تصدیق نہیں ہو سکتی؛ کوئی دعویٰ نہیں۔",
  proof:"تصدیق شدہ شجرکاری کا ثبوت",details:"شجرکاری منصوبہ",noFee:"کوئی اضافی فیس نہیں",
 },
};

export default function GreenOrderImpact({orderId,orderStatus}:{
 orderId?:string;orderStatus?:string;
}){
 const {language}=useCustomerLanguage();
 const words=lang[language]||lang.en;
 const [mode,setMode]=useState<PublicImpact["programmeStatus"]>("PLANNING");
 const [impact,setImpact]=useState<OrderImpact|null>(null);
 const [loading,setLoading]=useState(Boolean(orderId));
 useEffect(()=>{
  let live=true;
  void fetch('/api/green/impact',{cache:'no-store'})
   .then(r=>r.ok?r.json():null).then(data=>{
    if(live && (data?.programmeStatus==='ACTIVE'||data?.programmeStatus==='PAUSED'))
     setMode(data.programmeStatus);
   }).catch(()=>{});
  return()=>{live=false;};
 },[]);
 useEffect(()=>{
  if(!orderId){setImpact(null);setLoading(false);return;}
  let live=true;
  setLoading(true);setImpact(null);
  const read=async()=>{
   try{
    const {data:{session}}=await customerSupabase().auth.getSession();
    if(!session?.access_token)return;
    const response=await fetch('/api/green/orders/'+encodeURIComponent(orderId),{
      cache:'no-store',headers:{Authorization:'Bearer '+session.access_token},
    });
    if(response.ok && live)setImpact(await response.json());
   }catch{}finally{if(live)setLoading(false);}
  };
  void read();return()=>{live=false;};
 },[orderId,orderStatus]);
 const description=(()=>{
  if(!orderId)return mode==='PAUSED'?words.paused:words.cart;
  if(loading||!impact)return words.unavailable;
  return ({
   PLANNING:words.planning,PAUSED:words.paused,AWAITING_DELIVERY:words.awaiting,
   PLEDGED:words.pledged,REPORTED:words.reported,VERIFIED:words.verified,
   VOID:words.voided,NOT_RECORDED:words.notRecorded,INELIGIBLE:words.ineligible,
  } as Record<Status,string>)[impact.status]||words.unavailable;
 })();
 if(!orderId)return <section data-green-impact="cart" aria-label={words.name}
  className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-[#f3faf5] px-3 py-2.5 text-left">
   <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-[#08784b]"><TreePine size={19} aria-hidden="true"/></span>
   <div className="min-w-0">
    <p className="text-xs font-extrabold leading-4 text-[#075e45]">{words.name} 🌱</p>
    <p className="mt-0.5 text-xs leading-4 text-[#37624b]" role="status">{description}</p>
   </div>
  </section>;
 return <section data-green-impact="order" aria-label={words.title}
  className="rounded-xl border border-emerald-200 bg-[#f3faf5] px-3 py-3 text-left">
  <p className="text-sm font-extrabold text-[#075e45]">🌱 {words.name}</p>
  <p className="mt-1 text-xs leading-5 text-[#335444]" role="status">{description}</p>
  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#37624b]">
   <span>{words.noFee}</span>
   {impact?.status==='VERIFIED'&&impact.proofUrl?
    <a href={impact.proofUrl} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1 font-bold underline"><ShieldCheck size={13}/>{words.proof}</a>
    :<Link href="/green" className="font-bold underline underline-offset-2">{words.details}</Link>}
  </div>
 </section>;
}
