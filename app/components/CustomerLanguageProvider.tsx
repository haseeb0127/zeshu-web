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
    "Search for area, street or landmark": "ప్రాంతం, వీధి లేదా ల్యాండ్‌మార్క్ వెతకండి",
    "Choose delivery location": "డెలివరీ స్థలం ఎంచుకోండి",
    "GPS map fallback active": "GPS మ్యాప్ ప్రత్యామ్నాయం సక్రియంగా ఉంది",
    "Confirm the detected/search result": "గుర్తించిన / వెతికిన స్థానాన్ని నిర్ధారించండి",
    "Place the pin at your delivery entrance": "మీ డెలివరీ ప్రవేశద్వారం వద్ద పిన్ ఉంచండి",
    "Delivery available here": "ఇక్కడ డెలివరీ అందుబాటులో ఉంది",
    "We're not delivering physical products here yet": "ఇక్కడ ఇంకా భౌతిక ఉత్పత్తుల డెలివరీ అందుబాటులో లేదు",
    "Explore digital services": "డిజిటల్ సేవలను చూడండి",
    "Location could not be verified": "స్థానాన్ని ధృవీకరించలేకపోయాం",
    "Checking delivery area…": "డెలివరీ ప్రాంతాన్ని తనిఖీ చేస్తున్నాం…",
    "Check another location": "మరో స్థలాన్ని తనిఖీ చేయండి",
    "Use this location": "ఈ స్థలాన్ని ఉపయోగించండి",
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
    "Snacks": "స్నాక్స్",
    "All delivery": "అన్ని డెలివరీలు",
    "30-min Fresh": "30 నిమిషాల ఫ్రెష్",
    "India Delivery": "ఇండియా డెలివరీ",
    "Fresh locally. India-wide only where delivery remains sensible for both the customer and Zeshu.": "స్థానికంగా తాజా డెలివరీ. కస్టమర్‌కు మరియు Zeshuకు అనుకూలంగా ఉన్న చోట మాత్రమే భారతవ్యాప్తంగా డెలివరీ.",
    "Fresh items show ~30 min only when your location, store and active rider availability qualify.": "మీ ప్రాంతం, స్టోర్ మరియు యాక్టివ్ రైడర్ అందుబాటులో ఉన్నప్పుడు మాత్రమే తాజా వస్తువులకు సుమారు 30 నిమిషాల డెలివరీ చూపబడుతుంది.",
    "Only profitable, shelf-stable products approved for nationwide shipping appear here. Shipping prices will come from a real courier quote before payment.": "దేశవ్యాప్తంగా పంపిణీకి అనుమతించిన సరైన ఉత్పత్తులే ఇక్కడ కనిపిస్తాయి. చెల్లింపుకు ముందు నిజమైన కొరియర్ కోట్ ఆధారంగా షిప్పింగ్ ధర చూపబడుతుంది.",
    "Filters": "ఫిల్టర్లు",
    "Filter products": "ఉత్పత్తులను ఫిల్టర్ చేయండి",
    "Clear all": "అన్నీ క్లియర్ చేయండి",
    "Category": "వర్గం",
    "All categories": "అన్ని వర్గాలు",
    "Brand": "బ్రాండ్",
    "All brands": "అన్ని బ్రాండ్లు",
    "Price": "ధర",
    "Any price": "ఏ ధరైనా",
    "Availability": "అందుబాటు",
    "All products": "అన్ని ఉత్పత్తులు",
    "In stock / available": "స్టాక్‌లో / అందుబాటులో",
    "Rating": "రేటింగ్",
    "Any rating": "ఏ రేటింగ్ైనా",
    "Verified delivered-order ratings only": "డెలివర్ అయిన ఆర్డర్ల ధృవీకరించిన రేటింగ్స్ మాత్రమే",
    "Delivery available": "డెలివరీ అందుబాటులో ఉంది",
    "Jagtial delivery": "జగిత్యాల డెలివరీ",
    "Set a pin to check serviceability": "సర్వీస్ అందుబాటును చూసేందుకు పిన్ సెట్ చేయండి",
    "India-wide services": "భారతవ్యాప్త సేవలు",
    "Scan QR": "QR స్కాన్ చేయండి",
    "Offers": "ఆఫర్లు",
    "Get Zeshu": "Zeshu పొందండి",
    "Physical delivery requires a serviceable Jagtial pin. Digital tools can be used across India where the relevant service is available.": "భౌతిక డెలివరీకి సేవ అందుబాటులో ఉన్న జగిత్యాల పిన్ అవసరం. సంబంధిత సేవ అందుబాటులో ఉన్న చోట డిజిటల్ టూల్స్‌ను భారతదేశమంతటా ఉపయోగించవచ్చు.",
    "Your active order": "మీ యాక్టివ్ ఆర్డర్",
    "Order in progress": "ఆర్డర్ ప్రాసెస్‌లో ఉంది",
    "Order placed": "ఆర్డర్ పెట్టబడింది",
    "Confirmed": "ధృవీకరించబడింది",
    "Being prepared": "తయారు చేస్తున్నారు",
    "Ready for pickup": "పికప్‌కు సిద్ధం",
    "Picked up": "పికప్ అయ్యింది",
    "Out for delivery": "డెలివరీకి బయలుదేరింది",
    "Delivered": "డెలివర్ అయింది",
    "Cancelled": "రద్దు చేయబడింది",
    "Tap to view details": "వివరాలు చూడటానికి ట్యాప్ చేయండి",
    "Ask Zeshu": "Zeshuని అడగండి",
    "Order": "ఆర్డర్",
    "Home": "హోమ్",
    "Services": "సేవలు",
    "Cart": "కార్ట్",
    "available": "అందుబాటులో",
    "Sorted by": "క్రమబద్ధీకరణ",
    "Clear search": "సెర్చ్ క్లియర్ చేయండి",
    "Browse all categories": "అన్ని వర్గాలు చూడండి",
    "Recently purchased": "ఇటీవల కొనుగోలు చేసినవి",
    "Closest matches": "సమీప ఫలితాలు",
    "Checking…": "చూస్తోంది…",
    "Send": "పంపండి",
    "Ask anything about Zeshu…": "Zeshu గురించి ఏదైనా అడగండి…"
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
    "Search for area, street or landmark": "इलाका, सड़क या लैंडमार्क खोजें",
    "Choose delivery location": "डिलीवरी स्थान चुनें",
    "GPS map fallback active": "GPS मैप विकल्प चालू है",
    "Confirm the detected/search result": "मिले हुए स्थान की पुष्टि करें",
    "Place the pin at your delivery entrance": "डिलीवरी प्रवेश स्थान पर पिन रखें",
    "Delivery available here": "यहाँ डिलीवरी उपलब्ध है",
    "We're not delivering physical products here yet": "यहाँ अभी सामान की डिलीवरी उपलब्ध नहीं है",
    "Explore digital services": "डिजिटल सेवाएँ देखें",
    "Location could not be verified": "स्थान सत्यापित नहीं हो सका",
    "Checking delivery area…": "डिलीवरी क्षेत्र जाँच रहे हैं…",
    "Check another location": "दूसरा स्थान जाँचें",
    "Use this location": "यह स्थान इस्तेमाल करें",
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
    "Snacks": "स्नैक्स",
    "All delivery": "सभी डिलीवरी",
    "30-min Fresh": "30-मिनट फ्रेश",
    "India Delivery": "इंडिया डिलीवरी",
    "Fresh locally. India-wide only where delivery remains sensible for both the customer and Zeshu.": "स्थानीय रूप से ताज़ा डिलीवरी। पूरे भारत में केवल वहीं जहाँ ग्राहक और Zeshu दोनों के लिए डिलीवरी उचित हो।",
    "Fresh items show ~30 min only when your location, store and active rider availability qualify.": "लगभग 30 मिनट की फ्रेश डिलीवरी तभी दिखेगी जब आपका स्थान, स्टोर और सक्रिय राइडर उपलब्ध हों।",
    "Only profitable, shelf-stable products approved for nationwide shipping appear here. Shipping prices will come from a real courier quote before payment.": "देशभर की शिपिंग के लिए अनुमोदित उपयुक्त उत्पाद ही यहाँ दिखेंगे। भुगतान से पहले वास्तविक कूरियर कोट से शिपिंग कीमत दिखाई जाएगी।",
    "Filters": "फ़िल्टर",
    "Filter products": "उत्पाद फ़िल्टर करें",
    "Clear all": "सब साफ़ करें",
    "Category": "कैटेगरी",
    "All categories": "सभी कैटेगरी",
    "Brand": "ब्रांड",
    "All brands": "सभी ब्रांड",
    "Price": "कीमत",
    "Any price": "कोई भी कीमत",
    "Availability": "उपलब्धता",
    "All products": "सभी उत्पाद",
    "In stock / available": "स्टॉक में / उपलब्ध",
    "Rating": "रेटिंग",
    "Any rating": "कोई भी रेटिंग",
    "Verified delivered-order ratings only": "केवल डिलीवर हुए ऑर्डर की सत्यापित रेटिंग",
    "Delivery available": "डिलीवरी उपलब्ध",
    "Jagtial delivery": "जगतियाल डिलीवरी",
    "Set a pin to check serviceability": "सेवा उपलब्धता देखने के लिए पिन सेट करें",
    "India-wide services": "पूरे भारत की सेवाएँ",
    "Scan QR": "QR स्कैन करें",
    "Offers": "ऑफ़र",
    "Get Zeshu": "Zeshu पाएं",
    "Physical delivery requires a serviceable Jagtial pin. Digital tools can be used across India where the relevant service is available.": "फिजिकल डिलीवरी के लिए सेवा-योग्य जगतियाल पिन जरूरी है। संबंधित सेवा उपलब्ध होने पर डिजिटल टूल पूरे भारत में इस्तेमाल किए जा सकते हैं।",
    "Your active order": "आपका सक्रिय ऑर्डर",
    "Order in progress": "ऑर्डर जारी है",
    "Order placed": "ऑर्डर प्लेस हो गया",
    "Confirmed": "कन्फर्म",
    "Being prepared": "तैयार किया जा रहा है",
    "Ready for pickup": "पिकअप के लिए तैयार",
    "Picked up": "पिकअप हो गया",
    "Out for delivery": "डिलीवरी के लिए निकला",
    "Delivered": "डिलीवर हो गया",
    "Cancelled": "रद्द",
    "Tap to view details": "विवरण देखने के लिए टैप करें",
    "Ask Zeshu": "Zeshu से पूछें",
    "Order": "ऑर्डर",
    "Home": "होम",
    "Services": "सेवाएँ",
    "Cart": "कार्ट",
    "available": "उपलब्ध",
    "Sorted by": "क्रमबद्ध",
    "Clear search": "खोज साफ़ करें",
    "Browse all categories": "सभी कैटेगरी देखें",
    "Recently purchased": "हाल में खरीदा",
    "Closest matches": "सबसे नज़दीकी परिणाम",
    "Checking…": "जाँच रहे हैं…",
    "Send": "भेजें",
    "Ask anything about Zeshu…": "Zeshu के बारे में कुछ भी पूछें…"
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
    "Search for area, street or landmark": "علاقہ، سڑک یا لینڈ مارک تلاش کریں",
    "Choose delivery location": "ڈیلیوری کی جگہ منتخب کریں",
    "GPS map fallback active": "GPS میپ متبادل فعال ہے",
    "Confirm the detected/search result": "ملنے والی جگہ کی تصدیق کریں",
    "Place the pin at your delivery entrance": "ڈیلیوری کے داخلی مقام پر پن رکھیں",
    "Delivery available here": "یہاں ڈیلیوری دستیاب ہے",
    "We're not delivering physical products here yet": "یہاں ابھی سامان کی ڈیلیوری دستیاب نہیں ہے",
    "Explore digital services": "ڈیجیٹل سروسز دیکھیں",
    "Location could not be verified": "جگہ کی تصدیق نہیں ہو سکی",
    "Checking delivery area…": "ڈیلیوری ایریا چیک کیا جا رہا ہے…",
    "Check another location": "دوسری جگہ چیک کریں",
    "Use this location": "یہ جگہ استعمال کریں",
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
    "Snacks": "اسنیکس",
    "All delivery": "تمام ڈیلیوری",
    "30-min Fresh": "30 منٹ فریش",
    "India Delivery": "انڈیا ڈیلیوری",
    "Fresh locally. India-wide only where delivery remains sensible for both the customer and Zeshu.": "مقامی طور پر تازہ ڈیلیوری۔ پورے بھارت میں صرف وہاں جہاں کسٹمر اور Zeshu دونوں کے لیے مناسب ہو۔",
    "Fresh items show ~30 min only when your location, store and active rider availability qualify.": "تقریباً 30 منٹ کی فریش ڈیلیوری صرف اس وقت دکھائی جائے گی جب آپ کی جگہ، اسٹور اور فعال رائیڈر دستیاب ہوں۔",
    "Only profitable, shelf-stable products approved for nationwide shipping appear here. Shipping prices will come from a real courier quote before payment.": "ملک بھر کی شپنگ کے لیے منظور شدہ مناسب مصنوعات ہی یہاں دکھائی جائیں گی۔ ادائیگی سے پہلے اصل کورئیر کوٹ سے شپنگ قیمت دکھائی جائے گی۔",
    "Filters": "فلٹرز",
    "Filter products": "مصنوعات فلٹر کریں",
    "Clear all": "سب صاف کریں",
    "Category": "کیٹیگری",
    "All categories": "تمام کیٹیگریز",
    "Brand": "برانڈ",
    "All brands": "تمام برانڈز",
    "Price": "قیمت",
    "Any price": "کوئی بھی قیمت",
    "Availability": "دستیابی",
    "All products": "تمام مصنوعات",
    "In stock / available": "اسٹاک میں / دستیاب",
    "Rating": "ریٹنگ",
    "Any rating": "کوئی بھی ریٹنگ",
    "Verified delivered-order ratings only": "صرف ڈیلیور شدہ آرڈرز کی تصدیق شدہ ریٹنگ",
    "Delivery available": "ڈیلیوری دستیاب",
    "Jagtial delivery": "جگتیال ڈیلیوری",
    "Set a pin to check serviceability": "سروس دستیابی چیک کرنے کے لیے پن سیٹ کریں",
    "India-wide services": "پورے بھارت کی سروسز",
    "Scan QR": "QR اسکین کریں",
    "Offers": "آفرز",
    "Get Zeshu": "Zeshu حاصل کریں",
    "Physical delivery requires a serviceable Jagtial pin. Digital tools can be used across India where the relevant service is available.": "فزیکل ڈیلیوری کے لیے سروس والے جگتیال پن کی ضرورت ہے۔ متعلقہ سروس دستیاب ہونے پر ڈیجیٹل ٹولز پورے بھارت میں استعمال کیے جا سکتے ہیں۔",
    "Your active order": "آپ کا فعال آرڈر",
    "Order in progress": "آرڈر جاری ہے",
    "Order placed": "آرڈر کر دیا گیا",
    "Confirmed": "تصدیق شدہ",
    "Being prepared": "تیار کیا جا رہا ہے",
    "Ready for pickup": "پک اپ کے لیے تیار",
    "Picked up": "پک اپ ہو گیا",
    "Out for delivery": "ڈیلیوری کے لیے روانہ",
    "Delivered": "ڈیلیور ہو گیا",
    "Cancelled": "منسوخ",
    "Tap to view details": "تفصیلات دیکھنے کے لیے ٹیپ کریں",
    "Ask Zeshu": "Zeshu سے پوچھیں",
    "Order": "آرڈر",
    "Home": "ہوم",
    "Services": "سروسز",
    "Cart": "کارٹ",
    "available": "دستیاب",
    "Sorted by": "ترتیب",
    "Clear search": "تلاش صاف کریں",
    "Browse all categories": "تمام کیٹیگریز دیکھیں",
    "Recently purchased": "حال ہی میں خریدا",
    "Closest matches": "قریب ترین نتائج",
    "Checking…": "چیک ہو رہا ہے…",
    "Send": "بھیجیں",
    "Ask anything about Zeshu…": "Zeshu کے بارے میں کچھ بھی پوچھیں…"
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
      <span aria-hidden="true" className="text-sm">🌐</span>
      <select
        aria-label={t("Choose language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as CustomerLanguageCode)}
        className="max-w-[96px] bg-transparent text-xs font-black outline-none"
      >
        {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{compact ? option.short : option.label}</option>)}
      </select>
    </label>
  );
}
