"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CustomerLanguageCode = "en" | "te" | "hi" | "ur";

type CustomerLanguageContextValue = {
  language: CustomerLanguageCode;
  setLanguage: (language: CustomerLanguageCode) => void;
  t: (english: string) => string;
  direction: "ltr" | "rtl";
};

const STORAGE_KEY = "zeshu.customer.language";

const LANGUAGE_OPTIONS: Array<{ code: CustomerLanguageCode; label: string; short: string }> = [
  { code: "en", label: "English", short: "EN" },
  { code: "te", label: "తెలుగు", short: "తె" },
  { code: "hi", label: "हिन्दी", short: "हि" },
  { code: "ur", label: "اردو", short: "اردو" },
];

const translations: Record<CustomerLanguageCode, Record<string, string>> = {
  en: {},
  te: {
    "Choose language": "భాషను ఎంచుకోండి",
    "Language": "భాష",
    "Everyday, simply": "ప్రతిరోజూ, సులభంగా",
    "Deliver to": "డెలివరీ చిరునామా",
    "Set delivery location": "డెలివరీ స్థలం ఎంచుకోండి",
    "Location not set": "డెలివరీ స్థలం ఎంచుకోలేదు",
    "Search milk, atta, snacks, recharge...": "పాలు, ఆటా, స్నాక్స్, రీచార్జ్ వెతకండి...",
    "Bills & Services": "బిల్లులు & సేవలు",
    "Scan": "స్కాన్",
    "Account": "ఖాతా",
    "Login": "లాగిన్",
    "My Cart": "నా కార్ట్",
    "Shop by Category": "వర్గం వారీగా కొనండి",
    "Everyday essentials, grouped the way customers shop.": "రోజువారీ అవసరాలను సులభంగా కనుగొనండి.",
    "Quick Picks": "త్వరిత ఎంపికలు",
    "For you": "మీ కోసం",
    "Buy Again": "మళ్లీ కొనండి",
    "Favorites": "ఇష్టమైనవి",
    "Your Favorites": "మీ ఇష్టమైనవి",
    "My Account": "నా ఖాతా",
    "Manage your Zeshu account": "మీ Zeshu ఖాతాను నిర్వహించండి",
    "ZESHU CASH": "ZESHU క్యాష్",
    "Your Orders & Buy Again": "మీ ఆర్డర్లు & మళ్లీ కొనండి",
    "Saved Addresses": "సేవ్ చేసిన చిరునామాలు",
    "Invite & Earn": "ఆహ్వానించండి & సంపాదించండి",
    "Help & Support": "సహాయం & సపోర్ట్",
    "Policies & Trust": "పాలసీలు & నమ్మకం",
    "Zeshu Pass": "Zeshu పాస్",
    "Subscribe & Save": "సబ్‌స్క్రైబ్ & సేవ్",
    "More from Zeshu": "Zeshu నుంచి మరిన్ని",
    "Account Settings": "ఖాతా సెట్టింగులు",
    "Back to My Account": "నా ఖాతాకు తిరిగి వెళ్ళండి",
    "Buy again": "మళ్లీ కొనండి",
    "Reorder": "మళ్లీ ఆర్డర్ చేయండి",
    "Logout": "లాగ్ అవుట్",
    "Coming soon": "త్వరలో",
    "Orders, delivery, payments & more": "ఆర్డర్లు, డెలివరీ, చెల్లింపులు & మరిన్ని",
    "Customer policies and service information": "కస్టమర్ పాలసీలు మరియు సేవల సమాచారం",
    "Personal sign-in information": "వ్యక్తిగత సైన్-ఇన్ సమాచారం",
    "Share your Zeshu invite code": "మీ Zeshu ఆహ్వాన కోడ్‌ను పంచుకోండి",
    "Start a support conversation with the Zeshu team. Never share OTPs, passwords, or payment credentials.": "Zeshu బృందంతో సపోర్ట్ సంభాషణ ప్రారంభించండి. OTPలు, పాస్‌వర్డ్‌లు లేదా చెల్లింపు వివరాలను ఎప్పుడూ పంచుకోకండి.",
    "New conversation": "కొత్త సంభాషణ",
    "All": "అన్నీ",
    "Biscuits": "బిస్కెట్లు",
    "biscuits": "బిస్కెట్లు",
    "Chicken": "చికెన్",
    "dairy": "పాల ఉత్పత్తులు",
    "Dairy": "పాల ఉత్పత్తులు",
    "Drinks": "పానీయాలు",
    "Eggs": "గుడ్లు",
    "Fish & Seafood": "చేపలు & సముద్ర ఆహారం",
    "Fruits": "పండ్లు",
    "Mutton": "మటన్",
    "Vegetables": "కూరగాయలు",
    "Snacks": "స్నాక్స్"
  },
  hi: {
    "Choose language": "भाषा चुनें",
    "Language": "भाषा",
    "Everyday, simply": "हर दिन, आसान",
    "Deliver to": "डिलीवरी पता",
    "Set delivery location": "डिलीवरी स्थान चुनें",
    "Location not set": "डिलीवरी स्थान सेट नहीं है",
    "Search milk, atta, snacks, recharge...": "दूध, आटा, स्नैक्स, रिचार्ज खोजें...",
    "Bills & Services": "बिल और सेवाएँ",
    "Scan": "स्कैन",
    "Account": "अकाउंट",
    "Login": "लॉगिन",
    "My Cart": "मेरी कार्ट",
    "Shop by Category": "कैटेगरी के हिसाब से खरीदें",
    "Everyday essentials, grouped the way customers shop.": "रोज़मर्रा की चीज़ें आसानी से खोजें।",
    "Quick Picks": "त्वरित विकल्प",
    "For you": "आपके लिए",
    "Buy Again": "फिर से खरीदें",
    "Favorites": "पसंदीदा",
    "Your Favorites": "आपके पसंदीदा",
    "My Account": "मेरा अकाउंट",
    "Manage your Zeshu account": "अपना Zeshu अकाउंट मैनेज करें",
    "ZESHU CASH": "ZESHU कैश",
    "Your Orders & Buy Again": "आपके ऑर्डर और फिर से खरीदें",
    "Saved Addresses": "सेव किए पते",
    "Invite & Earn": "आमंत्रित करें और कमाएँ",
    "Help & Support": "मदद और सपोर्ट",
    "Policies & Trust": "नीतियाँ और भरोसा",
    "Zeshu Pass": "Zeshu पास",
    "Subscribe & Save": "सब्सक्राइब करें और बचत करें",
    "More from Zeshu": "Zeshu से और सेवाएँ",
    "Account Settings": "अकाउंट सेटिंग्स",
    "Back to My Account": "मेरे अकाउंट पर वापस जाएँ",
    "Buy again": "फिर से खरीदें",
    "Reorder": "फिर से ऑर्डर करें",
    "Logout": "लॉग आउट",
    "Coming soon": "जल्द आ रहा है",
    "Orders, delivery, payments & more": "ऑर्डर, डिलीवरी, भुगतान और बहुत कुछ",
    "Customer policies and service information": "ग्राहक नीतियाँ और सेवा जानकारी",
    "Personal sign-in information": "व्यक्तिगत साइन-इन जानकारी",
    "Share your Zeshu invite code": "अपना Zeshu आमंत्रण कोड शेयर करें",
    "Start a support conversation with the Zeshu team. Never share OTPs, passwords, or payment credentials.": "Zeshu टीम से सपोर्ट बातचीत शुरू करें। OTP, पासवर्ड या भुगतान की जानकारी कभी साझा न करें।",
    "New conversation": "नई बातचीत",
    "All": "सभी",
    "Biscuits": "बिस्कुट",
    "biscuits": "बिस्कुट",
    "Chicken": "चिकन",
    "dairy": "डेयरी",
    "Dairy": "डेयरी",
    "Drinks": "पेय",
    "Eggs": "अंडे",
    "Fish & Seafood": "मछली और सीफूड",
    "Fruits": "फल",
    "Mutton": "मटन",
    "Vegetables": "सब्ज़ियाँ",
    "Snacks": "स्नैक्स"
  },
  ur: {
    "Choose language": "زبان منتخب کریں",
    "Language": "زبان",
    "Everyday, simply": "ہر روز، آسانی سے",
    "Deliver to": "ڈیلیوری کا پتہ",
    "Set delivery location": "ڈیلیوری کی جگہ منتخب کریں",
    "Location not set": "ڈیلیوری کی جگہ مقرر نہیں",
    "Search milk, atta, snacks, recharge...": "دودھ، آٹا، اسنیکس، ریچارج تلاش کریں...",
    "Bills & Services": "بلز اور سروسز",
    "Scan": "اسکین",
    "Account": "اکاؤنٹ",
    "Login": "لاگ اِن",
    "My Cart": "میری کارٹ",
    "Shop by Category": "کیٹیگری کے حساب سے خریدیں",
    "Everyday essentials, grouped the way customers shop.": "روزمرہ کی ضروری اشیا آسانی سے تلاش کریں۔",
    "Quick Picks": "فوری انتخاب",
    "For you": "آپ کے لیے",
    "Buy Again": "دوبارہ خریدیں",
    "Favorites": "پسندیدہ",
    "Your Favorites": "آپ کے پسندیدہ",
    "My Account": "میرا اکاؤنٹ",
    "Manage your Zeshu account": "اپنا Zeshu اکاؤنٹ منظم کریں",
    "ZESHU CASH": "ZESHU کیش",
    "Your Orders & Buy Again": "آپ کے آرڈرز اور دوبارہ خریدیں",
    "Saved Addresses": "محفوظ پتے",
    "Invite & Earn": "دعوت دیں اور کمائیں",
    "Help & Support": "مدد اور سپورٹ",
    "Policies & Trust": "پالیسیز اور اعتماد",
    "Zeshu Pass": "Zeshu پاس",
    "Subscribe & Save": "سبسکرائب کریں اور بچت کریں",
    "More from Zeshu": "Zeshu کی مزید سروسز",
    "Account Settings": "اکاؤنٹ سیٹنگز",
    "Back to My Account": "میرے اکاؤنٹ پر واپس جائیں",
    "Buy again": "دوبارہ خریدیں",
    "Reorder": "دوبارہ آرڈر کریں",
    "Logout": "لاگ آؤٹ",
    "Coming soon": "جلد آ رہا ہے",
    "Orders, delivery, payments & more": "آرڈرز، ڈیلیوری، ادائیگی اور مزید",
    "Customer policies and service information": "کسٹمر پالیسیز اور سروس کی معلومات",
    "Personal sign-in information": "ذاتی سائن اِن معلومات",
    "Share your Zeshu invite code": "اپنا Zeshu دعوتی کوڈ شیئر کریں",
    "Start a support conversation with the Zeshu team. Never share OTPs, passwords, or payment credentials.": "Zeshu ٹیم سے سپورٹ گفتگو شروع کریں۔ OTP، پاس ورڈ یا ادائیگی کی معلومات کبھی شیئر نہ کریں۔",
    "New conversation": "نئی گفتگو",
    "All": "سب",
    "Biscuits": "بسکٹ",
    "biscuits": "بسکٹ",
    "Chicken": "چکن",
    "dairy": "ڈیری",
    "Dairy": "ڈیری",
    "Drinks": "مشروبات",
    "Eggs": "انڈے",
    "Fish & Seafood": "مچھلی اور سی فوڈ",
    "Fruits": "پھل",
    "Mutton": "مٹن",
    "Vegetables": "سبزیاں",
    "Snacks": "اسنیکس"
  }
};

const CustomerLanguageContext = createContext<CustomerLanguageContextValue | null>(null);

function detectDeviceLanguage(): CustomerLanguageCode {
  if (typeof navigator === "undefined") return "en";
  const values = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const value of values) {
    const code = String(value || "").toLowerCase().split("-")[0];
    if (code === "te" || code === "hi" || code === "ur" || code === "en") return code;
  }
  return "en";
}

export function CustomerLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<CustomerLanguageCode>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as CustomerLanguageCode | null;
      if (saved && LANGUAGE_OPTIONS.some((option) => option.code === saved)) {
        setLanguageState(saved);
      } else {
        setLanguageState(detectDeviceLanguage());
      }
    } catch {
      setLanguageState(detectDeviceLanguage());
    }
  }, []);

  useEffect(() => {
    const direction = language === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dataset.customerLanguage = language;
  }, [language]);

  const setLanguage = useCallback((next: CustomerLanguageCode) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Local storage may be unavailable in private/restricted browser contexts.
    }
  }, []);

  const t = useCallback((english: string) => translations[language]?.[english] || english, [language]);
  const direction: "ltr" | "rtl" = language === "ur" ? "rtl" : "ltr";
  const value = useMemo(() => ({ language, setLanguage, t, direction }), [direction, language, setLanguage, t]);

  return <CustomerLanguageContext.Provider value={value}>{children}</CustomerLanguageContext.Provider>;
}

export function useCustomerLanguage() {
  const context = useContext(CustomerLanguageContext);
  if (!context) throw new Error("useCustomerLanguage must be used inside CustomerLanguageProvider");
  return context;
}

export function LanguageSwitcher({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { language, setLanguage, t } = useCustomerLanguage();
  return (
    <label className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-black text-slate-700 shadow-sm ${className}`}>
      {!compact && <span className="hidden xl:inline">{t("Language")}</span>}
      <span aria-hidden="true" className="text-sm">अ/A</span>
      <select
        aria-label={t("Choose language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as CustomerLanguageCode)}
        className="max-w-[84px] bg-transparent text-xs font-black outline-none"
      >
        {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{compact ? option.short : option.label}</option>)}
      </select>
    </label>
  );
}
