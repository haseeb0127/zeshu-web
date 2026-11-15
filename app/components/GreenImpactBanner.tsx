"use client";

import Link from "@/app/components/DocumentLink";
import { ArrowUpRight, Leaf, TreePine } from "lucide-react";
import { useCustomerLanguage } from "@/app/components/CustomerLanguageProvider";

const copy = {
  en: {
    eyebrow: "A greener journey with Zeshu",
    title: "Small steps. A greener tomorrow.",
    body: "Our first goal is to explore planting 1–2 suitable local trees after 1,000 eligible delivered orders.",
    note: "A transparent community goal—not one tree per order. No extra checkout fee.",
    cta: "Discover Zeshu Green",
  },
  te: {
    eyebrow: "జెషుతో పచ్చని ప్రయాణం",
    title: "చిన్న అడుగులు. పచ్చని రేపటి కోసం.",
    body: "మొదటి 1,000 అర్హమైన డెలివరీ ఆర్డర్ల తర్వాత స్థానికంగా సరిపోయే 1–2 చెట్లు నాటే అవకాశాన్ని పరిశీలించడం మా తొలి లక్ష్యం.",
    note: "ఇది పారదర్శకమైన సామూహిక లక్ష్యం—ప్రతి ఆర్డర్‌కు ఒక చెట్టు కాదు. అదనపు ఛార్జీ లేదు.",
    cta: "జెషు గ్రీన్ గురించి తెలుసుకోండి",
  },
  hi: {
    eyebrow: "ज़ेशु के साथ हरियाली की ओर",
    title: "छोटे कदम। हरियाली भरा कल।",
    body: "हमारा पहला लक्ष्य 1,000 पात्र डिलीवर ऑर्डरों के बाद स्थानीय रूप से उपयुक्त 1–2 पेड़ लगाने की संभावना तलाशना है।",
    note: "यह एक पारदर्शी सामुदायिक लक्ष्य है—हर ऑर्डर पर एक पेड़ नहीं। कोई अतिरिक्त शुल्क नहीं।",
    cta: "ज़ेशु ग्रीन के बारे में जानें",
  },
  ur: {
    eyebrow: "زیشو کے ساتھ سرسبز سفر",
    title: "چھوٹے قدم، سرسبز کل۔",
    body: "ہمارا پہلا ہدف 1,000 اہل ڈیلیور آرڈرز کے بعد مقامی طور پر موزوں 1–2 درخت لگانے کے امکان کا جائزہ لینا ہے۔",
    note: "یہ ایک شفاف اجتماعی ہدف ہے، ہر آرڈر پر ایک درخت نہیں۔ کوئی اضافی فیس نہیں۔",
    cta: "زیشو گرین کے بارے میں جانیں",
  },
} as const;

export default function GreenImpactBanner() {
  const { language } = useCustomerLanguage();
  const words = copy[language as keyof typeof copy] ?? copy.en;

  return (
    <section aria-label="Zeshu Green community planting goal" className="relative isolate mx-4 mb-5 overflow-hidden rounded-[24px] border border-emerald-900/10 bg-[linear-gradient(112deg,#063d2d_0%,#08734d_58%,#15905c_100%)] px-5 py-6 text-white shadow-[0_12px_34px_rgba(5,72,48,.16)] md:mx-0 md:px-8 md:py-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 opacity-20">
        <TreePine className="h-64 w-64" strokeWidth={0.8} />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-28 h-40 w-40 rounded-full bg-lime-300/20 blur-3xl" />
      <div className="relative z-10 flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-emerald-100">
        <Leaf size={15} aria-hidden="true" /> {words.eyebrow}
      </div>
      <div className="relative z-10 mt-3 grid items-end gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black leading-tight tracking-tight md:text-3xl">{words.title}</h2>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-emerald-50 md:text-base">{words.body}</p>
          <p className="mt-2 text-xs font-medium leading-5 text-emerald-100/90">{words.note}</p>
        </div>
        <Link href="/green" className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#075E45] shadow-lg transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          {words.cta} <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
