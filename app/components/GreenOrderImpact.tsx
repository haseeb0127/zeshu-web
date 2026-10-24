"use client";

import {useEffect,useState} from "react";
import Link from "@/app/components/DocumentLink";
import {Leaf,ShieldCheck,TreePine} from "lucide-react";
import {customerSupabase} from "@/app/lib/browser-supabase";
import {useCustomerLanguage} from "@/app/components/CustomerLanguageProvider";

type PublicImpact={
 programmeStatus:"PLANNING"|"ACTIVE"|"PAUSED";
 plantingBatch?:{milestoneOrders:number;progressInCurrentBatch:number;ordersUntilNextMilestone:number};
 verifiedPlanted?:number;
};
type OrderStatus="PLEDGED"|"REPORTED"|"VERIFIED"|"VOID"|"INELIGIBLE"|"NOT_RECORDED"|"AWAITING_DELIVERY"|"PAUSED"|"PLANNING";
type OrderImpact={
 status:OrderStatus;treeCount:number;verifiedTreeCount:number;
 proofUrl:string|null;nativeSpecies:string|null;plantingArea:string|null;
};
type Words={
 name:string;cartTitle:string;goal:string;cartPlanning:string;cartActive:string;cartPaused:string;
 explain:string;zeroFee:string;milestone:string;statusHeading:string;
 planning:string;paused:string;awaiting:string;pledged:string;reported:string;verified:string;
 voided:string;notRecorded:string;ineligible:string;unavailable:string;
 proof:string;about:string;oneOrder:string;
};
const lang:Record<"en"|"te"|"hi"|"ur",Words>={
 en:{
  name:"Zeshu Green",cartTitle:"A greener future with Zeshu",goal:"Our goal: 1 native tree per eligible delivered order",
  cartPlanning:"We’re preparing our tree-planting programme. No tree is reserved or planted yet.",
  cartActive:"After an eligible delivery, your order can help reserve one tree for future planting.",
  cartPaused:"The tree programme is paused. No tree is promised for this order.",
  explain:"Planting is planned in batches of 10,000 qualifying orders, with proof and aftercare. One tree per order—not per item. No carbon-offset claim.",
  zeroFee:"No extra tree fee",milestone:"Funded order commitments toward the next 10,000-tree drive",
  statusHeading:"Tree impact for this order",planning:"We’re preparing tree planting. No tree has been reserved for this order yet.",
  paused:"New reservations paused. No tree is recorded for this order.",
  awaiting:"Order confirmed. A tree slot is only reserved after eligible delivery—never on payment alone.",
  pledged:"🌱 Your order has helped reserve one tree for future planting. It has not been planted yet.",
  reported:"🌱 One tree was reported planted for your order. Verification is pending.",
  verified:"🌳 One tree planted, thanks to your order! Planting evidence is verified.",
  voided:"Tree reservation voided; this order has no active tree commitment.",
  notRecorded:"No funded tree reservation is recorded for this order. We cannot claim planting.",
  ineligible:"This order does not qualify for the tree programme.",
  unavailable:"Your tree status cannot be verified now. We won't claim a tree was planted.",
  proof:"View planting evidence",about:"See Zeshu Green plan",oneOrder:"One eligible order supports a maximum of one funded tree slot.",
 },
 te:{
  name:"జెషు గ్రీన్",cartTitle:"జెషుతో పచ్చని భవిష్యత్తు",goal:"మా లక్ష్యం: అర్హమైన డెలివరీ ఆర్డర్‌కు ఒక స్థానిక చెట్టు",
  cartPlanning:"చెట్ల నాటకం ప్రస్తుతం ప్రణాళిక దశలో ఉంది. ఈ కొనుగోలుకు ఇంకా చెట్టు కేటాయించలేదు, నాటలేదు.",
  cartActive:"అర్హమైన ఆర్డర్ డెలివరీ పూర్తయ్యాక భవిష్యత్ నాటకానికి ఒక చెట్టు కోసం నిధులు కేటాయించవచ్చు.",
  cartPaused:"కొత్త చెట్టు కేటాయింపులు ప్రస్తుతం నిలిపివేశారు. ఈ ఆర్డర్‌కు చెట్టు హామీ లేదు.",
  explain:"10,000 అర్హమైన ఆర్డర్లకు ఒక నాటక కార్యక్రమం మా ప్రణాళిక. ఒక ఆర్డర్‌కు ఒక చెట్టు మాత్రమే; ఒక్కో వస్తువుకు కాదు. ధృవీకరణ అవసరం.",
  zeroFee:"చెట్టుకు అదనపు రుసుము లేదు",milestone:"తదుపరి 10,000 చెట్ల లక్ష్యానికి నిధులు ఉన్న ఆర్డర్లు",
  statusHeading:"ఈ ఆర్డర్ చెట్టు స్థితి",planning:"కార్యక్రమం ప్రణాళికలో ఉంది. ఈ ఆర్డర్‌కు చెట్టు కేటాయించలేదు, నాటలేదు.",
  paused:"కొత్త కేటాయింపులు నిలిచాయి. ఈ ఆర్డర్‌కు చెట్టు నమోదు కాలేదు.",
  awaiting:"ఆర్డర్ నిర్ధారితమైంది. అర్హమైన డెలివరీ తర్వాత మాత్రమే చెట్టు కేటాయింపు జరుగుతుంది; చెల్లింపుతో కాదు.",
  pledged:"🌱 మీ ఆర్డర్‌తో భవిష్యత్తులో నాటేందుకు ఒక చెట్టును కేటాయించారు. ఇంకా నాటలేదు.",
  reported:"ఈ ఆర్డర్‌కు చెట్టు నాటినట్లు భాగస్వామి తెలిపాడు. ఆధారాల తనిఖీ పెండింగ్‌లో ఉంది.",
  verified:"🌳 మీ ఆర్డర్ సహాయంతో ఒక చెట్టు నాటబడింది! ఆధారాలు ధృవీకరించబడ్డాయి.",
  voided:"చెట్టు కేటాయింపు రద్దయింది. ప్రస్తుతం ఈ ఆర్డర్‌కు చెట్టు లేదు.",
  notRecorded:"ఈ ఆర్డర్‌కు చెట్టు కేటాయింపు నమోదు కాలేదు. నాటినట్లు చెప్పలేం.",
  ineligible:"ఈ ఆర్డర్ చెట్ల కార్యక్రమానికి అర్హం కాదు.",
  unavailable:"చెట్టు స్థితిని ప్రస్తుతం ధృవీకరించలేకపోతున్నాం. నాటినట్లు చెప్పము.",
  proof:"నాటిన ఆధారాలు చూడండి",about:"జెషు గ్రీన్ ప్రణాళిక",oneOrder:"ఒక అర్హమైన ఆర్డర్‌కు గరిష్ఠంగా ఒక చెట్టు మాత్రమే.",
 },
 hi:{
  name:"ज़ेशु ग्रीन",cartTitle:"ज़ेशु के साथ हरियाली की ओर",goal:"हमारा लक्ष्य: हर पात्र डिलीवर ऑर्डर पर एक देशी पेड़",
  cartPlanning:"पेड़ लगाने की योजना अभी तैयार हो रही है। आज इस खरीद से कोई पेड़ न तो आरक्षित हुआ है, न लगाया गया है।",
  cartActive:"पात्र ऑर्डर डिलीवर होने पर भविष्य के अभियान के लिए एक वित्तपोषित पेड़ का स्थान आरक्षित हो सकता है।",
  cartPaused:"नए पेड़ आरक्षण फिलहाल रुके हैं। इस ऑर्डर पर पेड़ का वादा नहीं है।",
  explain:"10,000 पात्र ऑर्डर पूरे होने पर वृक्षारोपण अभियान की योजना है, सबूत और देखभाल सहित। एक ऑर्डर पर एक पेड़, हर सामान पर नहीं।",
  zeroFee:"पेड़ के लिए कोई अतिरिक्त शुल्क नहीं",milestone:"अगले 10,000 पेड़ों के लक्ष्य तक वित्तपोषित ऑर्डर",
  statusHeading:"इस ऑर्डर का पेड़ योगदान",planning:"कार्यक्रम अभी योजना में है। इस ऑर्डर के लिए न पेड़ आरक्षित है, न लगाया गया है।",
  paused:"नए आरक्षण रुके हैं। इस ऑर्डर पर पेड़ दर्ज नहीं है।",
  awaiting:"ऑर्डर की पुष्टि हुई। पात्र डिलीवरी के बाद ही पेड़ आरक्षित होगा, सिर्फ भुगतान से नहीं।",
  pledged:"आपने भविष्य के 10,000 पेड़ों के अभियान के लिए एक वित्तपोषित स्थान आरक्षित करने में मदद की। पेड़ अभी नहीं लगाया गया है।",
  reported:"साझेदार ने इस ऑर्डर से संबंधित वृक्षारोपण की सूचना दी है। प्रमाण की पुष्टि बाकी है।",
  verified:"धन्यवाद! इस ऑर्डर से जुड़े एक पेड़ के रोपण का प्रमाण सत्यापित है।",
  voided:"पेड़ का आरक्षण रद्द है। इस ऑर्डर पर सक्रिय योगदान नहीं है।",
  notRecorded:"इस ऑर्डर पर वित्तपोषित पेड़ दर्ज नहीं है। रोपण का दावा नहीं किया जा सकता।",
  ineligible:"यह ऑर्डर कार्यक्रम के लिए पात्र नहीं है।",
  unavailable:"पेड़ की स्थिति की पुष्टि अभी नहीं हो सकती। हम गलत दावा नहीं करेंगे।",
  proof:"रोपण का प्रमाण देखें",about:"ज़ेशु ग्रीन योजना देखें",oneOrder:"एक पात्र ऑर्डर पर अधिकतम एक पेड़ का स्थान।",
 },
 ur:{
  name:"زیشو گرین",cartTitle:"زیشو کے ساتھ سرسبز مستقبل",goal:"ہمارا ہدف: ہر اہل ڈیلیور شدہ آرڈر پر ایک مقامی درخت",
  cartPlanning:"درخت لگانے کا منصوبہ ابھی تیار ہو رہا ہے۔ اس خریداری پر آج کوئی درخت مختص یا لگایا نہیں گیا۔",
  cartActive:"اہل آرڈر ڈیلیور ہونے کے بعد مستقبل کی مہم کے لیے ایک فنڈ شدہ درخت کی جگہ مختص ہو سکتی ہے۔",
  cartPaused:"نئے درختوں کی بکنگ فی الحال رکی ہوئی ہے۔ اس آرڈر پر درخت کا وعدہ نہیں۔",
  explain:"منصوبہ ہر 10,000 اہل آرڈرز پر درخت لگانے کی مہم ہے، ثبوت اور دیکھ بھال کے ساتھ۔ ہر آرڈر پر ایک درخت، ہر پروڈکٹ پر نہیں۔",
  zeroFee:"درخت کی کوئی اضافی فیس نہیں",milestone:"اگلی 10,000 درختوں کی مہم کے لیے فنڈ شدہ آرڈرز",
  statusHeading:"اس آرڈر کا درختی حصہ",planning:"منصوبہ تیاری میں ہے۔ اس آرڈر پر کوئی درخت مختص یا لگایا نہیں گیا۔",
  paused:"نئی بکنگ رکی ہوئی ہے۔ اس آرڈر پر درخت درج نہیں۔",
  awaiting:"آرڈر کی تصدیق ہوئی ہے۔ اہل ڈیلیوری کے بعد ہی درخت مختص ہوگا، صرف ادائیگی پر نہیں۔",
  pledged:"آپ نے مستقبل کی 10,000 درختوں کی مہم میں ایک فنڈ شدہ جگہ مختص کرنے میں مدد دی۔ درخت ابھی نہیں لگایا گیا۔",
  reported:"پارٹنر نے اس آرڈر کے لیے درخت لگانے کی اطلاع دی ہے۔ ثبوت کی جانچ باقی ہے۔",
  verified:"شکریہ! اس آرڈر سے متعلق ایک درخت لگانے کے ثبوت کی تصدیق ہو گئی ہے۔",
  voided:"درخت کی بکنگ منسوخ ہو گئی ہے۔ اس آرڈر پر فعال حصہ نہیں۔",
  notRecorded:"اس آرڈر پر کوئی فنڈ شدہ درخت درج نہیں۔ لگانے کا دعویٰ نہیں کر سکتے۔",
  ineligible:"یہ آرڈر درختوں کے پروگرام کے لیے اہل نہیں۔",
  unavailable:"اس وقت درخت کی حالت کی تصدیق نہیں ہو سکتی۔ ہم غلط دعویٰ نہیں کریں گے۔",
  proof:"درخت لگانے کا ثبوت",about:"زیشو گرین منصوبہ",oneOrder:"ہر اہل آرڈر پر زیادہ سے زیادہ ایک درخت۔",
 },
};

export default function GreenOrderImpact({orderId,orderStatus}:{
 orderId?:string;orderStatus?:string;
}){
 const {language}=useCustomerLanguage();
 const w=lang[language]||lang.en;
 const [publicImpact,setPublicImpact]=useState<PublicImpact|null>(null);
 const [impact,setImpact]=useState<OrderImpact|null>(null);
 const [loading,setLoading]=useState(Boolean(orderId));
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let alive=true;
  fetch('/api/green/impact',{cache:'no-store'})
   .then(r=>r.ok?r.json():null)
   .then(body=>{if(alive&&body?.programmeStatus)setPublicImpact(body);})
   .catch(()=>{});
  return()=>{alive=false};
 },[]);
 useEffect(()=>{
  if(!orderId){setLoading(false);setImpact(null);return;}
  let alive=true;
  setLoading(true);setFailed(false);setImpact(null);
  const load=async()=>{
   try{
    const {data:{session}}=await customerSupabase().auth.getSession();
    if(!session?.access_token)throw new Error('NO_CUSTOMER_SESSION');
    const r=await fetch('/api/green/orders/'+encodeURIComponent(orderId),{
      headers:{Authorization:'Bearer '+session.access_token},
      cache:'no-store',
    });
    if(!r.ok)throw new Error('IMPACT_UNAVAILABLE');
    const body=await r.json();
    if(alive)setImpact(body);
   }catch{if(alive)setFailed(true);}
   finally{if(alive)setLoading(false);}
  };
  void load();
  return()=>{alive=false};
 },[orderId,orderStatus]);
 const stage=publicImpact?.programmeStatus;
 // Present the pledge briefly. The 10,000-order planting milestone is tracked in Green HQ
 // and explained on the optional Green details page, not as checkout progress.
 const heading=orderId?w.statusHeading:w.cartTitle;
 const statusMessage=(()=>{
  if(!orderId)return stage==='ACTIVE'?w.cartActive:stage==='PAUSED'?w.cartPaused:w.cartPlanning;
  if(loading||failed||!impact)return w.unavailable;
  const messages:Record<OrderStatus,string>={
   PLANNING:w.planning,PAUSED:w.paused,AWAITING_DELIVERY:w.awaiting,PLEDGED:w.pledged,
   REPORTED:w.reported,VERIFIED:w.verified,VOID:w.voided,NOT_RECORDED:w.notRecorded,
   INELIGIBLE:w.ineligible,
  };
  return messages[impact.status]||w.unavailable;
 })();
 return <section data-green-impact={orderId?'order':'cart'}
   className="rounded-2xl border border-emerald-200 bg-[#f3faf5] p-4 text-left shadow-sm"
   aria-label={heading}>
   <div className="flex items-start gap-3">
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-[#08784b]">
      <TreePine size={23} aria-hidden="true"/>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-black text-[#16402b]">{heading} <span className="font-semibold text-[#347155]">· {w.name}</span></p>
      <p className="mt-1 text-sm font-extrabold leading-5 text-[#075e45]">{w.goal}</p>
      <p className="mt-2 text-xs leading-5 text-[#335444]" role="status">{statusMessage}</p>
    </div>
   </div>
   {orderId&&impact?.status==='VERIFIED'&&impact.proofUrl&&
    <a href={impact.proofUrl} target="_blank" rel="noopener noreferrer"
       className="mt-3 inline-flex gap-1.5 text-sm font-bold text-[#006745] underline underline-offset-2">
       <ShieldCheck size={16} aria-hidden="true"/>{w.proof}
    </a>}
   <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
     <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#37624b]">
       <Leaf size={13} aria-hidden="true"/>{w.zeroFee}
     </span>
     <Link href="/green" className="text-[11px] font-bold text-[#075e45] underline underline-offset-2">{w.about}</Link>
   </div>
 </section>;
}
