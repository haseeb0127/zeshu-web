"use client";

import Link from "@/app/components/DocumentLink";
import {useCustomerLanguage} from "@/app/components/CustomerLanguageProvider";
import {ArrowLeft,PauseCircle} from "lucide-react";

// Owner pause: keep an accessible, accurate notice for old bookmarked links,
// but do not advertise a tree goal, track orders or collect planting funds.
const words={
 en:{title:"Zeshu Green is on hold",status:"Programme paused",message:"The Zeshu Green tree initiative is paused by the business owner. It is not accepting orders, contributions, tree commitments or planting requests. There is no tree-planting benefit attached to a Zeshu order.",next:"Zeshu will announce any future programme only after a separate review and explicit approval.",home:"Back to Zeshu"},
 te:{title:"జెషు గ్రీన్ ప్రస్తుతం నిలిపివేయబడింది",status:"కార్యక్రమం నిలిపివేయబడింది",message:"వ్యాపార యజమాని జెషు గ్రీన్ కార్యక్రమాన్ని తాత్కాలికంగా నిలిపివేశారు. ఆర్డర్లు, విరాళాలు, మొక్కల హామీలు లేదా నాటే అభ్యర్థనలు స్వీకరించడం లేదు. జెషులో ఆర్డర్ చేసినందుకు ప్రస్తుతం మొక్కలు నాటడం లేదు.",next:"ప్రత్యేక సమీక్ష మరియు స్పష్టమైన అనుమతి తర్వాతే భవిష్యత్తు కార్యక్రమాన్ని ప్రకటిస్తాం.",home:"జెషుకి తిరిగి వెళ్ళండి"},
 hi:{title:"ज़ेशु ग्रीन अभी रोक दिया गया है",status:"कार्यक्रम स्थगित",message:"व्यवसाय के मालिक ने ज़ेशु ग्रीन वृक्षारोपण पहल रोक दी है। फिलहाल ऑर्डर, योगदान, पेड़ लगाने के वादे या पौधारोपण अनुरोध स्वीकार नहीं किए जा रहे हैं। ज़ेशु के ऑर्डर पर पेड़ लगाने का कोई लाभ नहीं दिया जा रहा है।",next:"किसी भी नए कार्यक्रम की घोषणा अलग समीक्षा और स्पष्ट मंज़ूरी के बाद ही होगी।",home:"ज़ेशु पर वापस जाएँ"},
 ur:{title:"زیشو گرین فی الحال معطل ہے",status:"پروگرام معطل",message:"کاروبار کے مالک نے زیشو گرین شجرکاری پروگرام روک دیا ہے۔ فی الحال آرڈر، عطیات، درخت لگانے کے وعدے یا شجرکاری کی درخواستیں قبول نہیں کی جا رہیں۔ زیشو کے آرڈر کے ساتھ درخت لگانے کا کوئی فائدہ شامل نہیں ہے۔",next:"کسی بھی نئے پروگرام کا اعلان الگ جائزے اور واضح منظوری کے بعد ہی ہوگا۔",home:"زیشو واپس جائیں"},
} as const;
export default function GreenPausedPage(){
 const {language}=useCustomerLanguage();
 const locale=language in words?language:"en";
 const text=words[locale as keyof typeof words];
 return <main dir={locale==="ur"?"rtl":"ltr"} className="min-h-[70vh] bg-[#f7f8f4] px-4 py-12 text-slate-900">
  <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
   <PauseCircle size={40} className="text-slate-600" aria-hidden="true"/>
   <p className="mt-5 text-xs font-black uppercase tracking-widest text-slate-500">{text.status}</p>
   <h1 className="mt-2 text-2xl font-black sm:text-3xl">{text.title}</h1>
   <p className="mt-4 text-sm leading-7 text-slate-700">{text.message}</p>
   <p className="mt-3 text-sm leading-7 text-slate-600">{text.next}</p>
   <Link href="/" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#075e45] px-5 text-sm font-black text-white"><ArrowLeft size={16}/>{text.home}</Link>
  </section>
 </main>;
}
