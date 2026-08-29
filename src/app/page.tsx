"use client";
import React, { useState, useEffect, useRef, useMemo, useContext, createContext } from "react";
import {
  Fingerprint, ShieldCheck, MapPin, Bell, FileText, Stethoscope,
  AlertTriangle, ChevronRight, Check, X, Globe,
  IndianRupee, RefreshCw, Settings2, QrCode, ArrowLeft, Phone,
  Send, Loader2, BadgeCheck, HeartPulse, Navigation
} from "lucide-react";

/* ============================================================
   THEME TOKENS — inlined here (in the real project these live
   in migrant-health.css, imported as `import "./migrant-health.css"`)
   ============================================================ */
const TOKENS = `
  :root {
    --mh-primary: #0F6E4F;
    --mh-primary-deep: #0A4F38;
    --mh-primary-soft: #E4EEE8;
    --mh-accent: #C98A2B;
    --mh-accent-soft: #F3E3C6;
    --mh-paper: #EFF2ED;
    --mh-surface: #FFFFFF;
    --mh-ink: #16211C;
    --mh-ink-muted: #5B665F;
    --mh-danger: #AD3E32;
    --mh-danger-soft: #F3DFDA;
    --mh-border: #D7DDD2;
    --mh-font-sans: 'IBM Plex Sans', -apple-system, sans-serif;
    --mh-font-mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  .mh-spin { animation: mh-spin 0.9s linear infinite; }
  @keyframes mh-spin { to { transform: rotate(360deg); } }
`;

/* ============================================================
   I18N — this is the piece that was missing. Every string the
   Splash's language buttons should affect is looked up here.
   Add a new language by adding one more key to `translations`
   and one more entry to LANGUAGES.
   ============================================================ */
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ml", label: "മലയാളം" },
  { code: "bn", label: "বাংলা" },
];

const translations = {
  en: {
    tagline: "MIGRANT HEALTH & CLAIM ID",
    chooseLanguage: "Choose your language",
    imNewHere: "I'm new here",
    alreadyHaveId: "I already have an ID",

    register_title: "Register",
    register_intro: "We link your Aadhaar and e-Shram records once — after that, your digital ID works at any registered clinic.",
    label_aadhaar: "Aadhaar number",
    placeholder_aadhaar: "12-digit number",
    label_eshram: "e-Shram ID",
    capture_fingerprint: "Capture fingerprint",
    fingerprint_captured: "Fingerprint captured",
    verify_continue: "Verify & continue",

    reg_error_title: "We couldn't verify that",
    reg_error_body: "Your Aadhaar and e-Shram details didn't match. Check the numbers and try again, or ask your Link Worker for help.",
    retry: "Retry",
    contact_link_worker: "Contact Link Worker",

    identity_verified: "Identity verified",
    abha_label: "ABHA health ID",
    auto_linked: "Auto-linked",
    aawaz_label: "Aawaz insurance",
    linked: "Linked",
    confirm_body: "Your worker ID {id} now carries your health record and insurance link everywhere you go for work.",
    generate_id: "Generate my ID",

    login_title: "Log in",
    label_otp: "OTP",
    placeholder_otp: "6-digit code",
    use_fingerprint_instead: "Use fingerprint instead",
    log_in: "Log in",

    login_error_title: "Incorrect OTP",
    login_error_body: "That code didn't match. Request a new one and try again.",
    resend_otp: "Resend OTP",
    back: "Back",

    namaste: "Namaste,",
    tile_digital_id: "My Digital ID",
    tile_claim_status: "Claim Status",
    tile_health_records: "Health Records",
    tile_notifications: "Notifications",

    show_at_clinic: "Show this at the clinic",
    simulate_scan: "Simulate clinic scan",

    redirect_title: "This clinic isn't ABHA-registered",
    redirect_body: "Please visit the nearest government hospital so a doctor can verify and digitally sign your treatment record.",
    nearest_hospital_label: "Nearest govt. hospital",
    map_directions: "Map & directions",
    simulate_doctor_verify: "Simulate doctor verification",

    claim_detail_title: "Claim detail",
    updated_prefix: "Updated",
    reason_for_rejection: "Reason for rejection",
    amount_credited: "Amount credited to your linked account",
    notify_next_stage: "we'll notify you when this moves to the next stage.",
    raise_dispute: "Raise dispute",

    status_sent: "Sent to insurer",
    status_checking: "Under review",
    status_approved: "Approved",
    status_paid: "Paid out",
    status_rejected: "Rejected",
    claim_rejected_short: "Claim rejected",

    dispute_title: "Raise a dispute",
    dispute_intro: "Claim {id} was rejected: {reason}",
    tell_us: "Tell us what happened",
    dispute_placeholder: "Treatment was genuine, please recheck...",
    submit_dispute: "Submit dispute",
    dispute_filed: "Dispute filed",
    reference_prefix: "Reference",
    back_to_claim: "Back to claim",
    under_review_stamp: "under review",
  },
  hi: {
    tagline: "प्रवासी स्वास्थ्य और क्लेम आईडी",
    chooseLanguage: "अपनी भाषा चुनें",
    imNewHere: "मैं यहाँ नया हूँ",
    alreadyHaveId: "मेरे पास पहले से आईडी है",

    register_title: "पंजीकरण करें",
    register_intro: "हम आपके आधार और ई-श्रम रिकॉर्ड को केवल एक बार जोड़ते हैं — इसके बाद आपकी डिजिटल आईडी किसी भी पंजीकृत क्लिनिक में काम करेगी।",
    label_aadhaar: "आधार नंबर",
    placeholder_aadhaar: "12 अंकों की संख्या",
    label_eshram: "ई-श्रम आईडी",
    capture_fingerprint: "फिंगरप्रिंट लें",
    fingerprint_captured: "फिंगरप्रिंट लिया गया",
    verify_continue: "सत्यापित करें और आगे बढ़ें",

    reg_error_title: "हम इसे सत्यापित नहीं कर सके",
    reg_error_body: "आपका आधार और ई-श्रम विवरण मेल नहीं खाया। नंबर जांचें और फिर से प्रयास करें, या मदद के लिए अपने लिंक वर्कर से पूछें।",
    retry: "पुनः प्रयास करें",
    contact_link_worker: "लिंक वर्कर से संपर्क करें",

    identity_verified: "पहचान सत्यापित",
    abha_label: "ABHA स्वास्थ्य आईडी",
    auto_linked: "स्वतः जुड़ा",
    aawaz_label: "आवाज़ बीमा",
    linked: "जुड़ा हुआ",
    confirm_body: "आपकी वर्कर आईडी {id} अब आपके काम पर जाने वाली हर जगह आपका स्वास्थ्य रिकॉर्ड और बीमा लिंक साथ रखती है।",
    generate_id: "मेरी आईडी बनाएं",

    login_title: "लॉग इन करें",
    label_otp: "ओटीपी",
    placeholder_otp: "6 अंकों का कोड",
    use_fingerprint_instead: "इसके बजाय फिंगरप्रिंट का उपयोग करें",
    log_in: "लॉग इन करें",

    login_error_title: "गलत ओटीपी",
    login_error_body: "वह कोड मेल नहीं खाया। नया कोड मांगें और फिर से प्रयास करें।",
    resend_otp: "ओटीपी दोबारा भेजें",
    back: "वापस",

    namaste: "नमस्ते,",
    tile_digital_id: "मेरी डिजिटल आईडी",
    tile_claim_status: "क्लेम स्थिति",
    tile_health_records: "स्वास्थ्य रिकॉर्ड",
    tile_notifications: "सूचनाएं",

    show_at_clinic: "इसे क्लिनिक में दिखाएं",
    simulate_scan: "क्लिनिक स्कैन का अनुकरण करें",

    redirect_title: "यह क्लिनिक ABHA-पंजीकृत नहीं है",
    redirect_body: "कृपया नज़दीकी सरकारी अस्पताल जाएं ताकि डॉक्टर आपके इलाज रिकॉर्ड को सत्यापित कर डिजिटल हस्ताक्षर कर सकें।",
    nearest_hospital_label: "नज़दीकी सरकारी अस्पताल",
    map_directions: "मानचित्र और दिशा-निर्देश",
    simulate_doctor_verify: "डॉक्टर सत्यापन का अनुकरण करें",

    claim_detail_title: "क्लेम विवरण",
    updated_prefix: "अद्यतन",
    reason_for_rejection: "अस्वीकृति का कारण",
    amount_credited: "राशि आपके लिंक किए गए खाते में जमा कर दी गई है",
    notify_next_stage: "जब यह अगले चरण में जाएगा तो हम आपको सूचित करेंगे।",
    raise_dispute: "विवाद दर्ज करें",

    status_sent: "बीमाकर्ता को भेजा गया",
    status_checking: "समीक्षा में",
    status_approved: "स्वीकृत",
    status_paid: "भुगतान किया गया",
    status_rejected: "अस्वीकृत",
    claim_rejected_short: "क्लेम अस्वीकृत",

    dispute_title: "विवाद दर्ज करें",
    dispute_intro: "क्लेम {id} अस्वीकृत कर दिया गया: {reason}",
    tell_us: "हमें बताएं क्या हुआ",
    dispute_placeholder: "इलाज असली था, कृपया दोबारा जांचें...",
    submit_dispute: "विवाद जमा करें",
    dispute_filed: "विवाद दर्ज किया गया",
    reference_prefix: "संदर्भ",
    back_to_claim: "क्लेम पर वापस जाएं",
    under_review_stamp: "समीक्षा में",
  },
  ml: {
    tagline: "കുടിയേറ്റ ആരോഗ്യം & ക്ലെയിം ഐഡി",
    chooseLanguage: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    imNewHere: "ഞാൻ ഇവിടെ പുതിയ ആളാണ്",
    alreadyHaveId: "എനിക്ക് ഇതിനകം ഐഡി ഉണ്ട്",

    register_title: "രജിസ്റ്റർ ചെയ്യുക",
    register_intro: "നിങ്ങളുടെ ആധാർ, ഇ-ശ്രം രേഖകൾ ഞങ്ങൾ ഒരു തവണ ബന്ധിപ്പിക്കുന്നു — അതിനുശേഷം, രജിസ്റ്റർ ചെയ്ത ഏത് ക്ലിനിക്കിലും നിങ്ങളുടെ ഡിജിറ്റൽ ഐഡി പ്രവർത്തിക്കും.",
    label_aadhaar: "ആധാർ നമ്പർ",
    placeholder_aadhaar: "12 അക്ക നമ്പർ",
    label_eshram: "ഇ-ശ്രം ഐഡി",
    capture_fingerprint: "വിരൽ‌പാട് പകർത്തുക",
    fingerprint_captured: "വിരൽ‌പാട് പകർത്തി",
    verify_continue: "പരിശോധിച്ച് തുടരുക",

    reg_error_title: "ഇത് പരിശോധിക്കാൻ ഞങ്ങൾക്ക് കഴിഞ്ഞില്ല",
    reg_error_body: "നിങ്ങളുടെ ആധാർ, ഇ-ശ്രം വിവരങ്ങൾ പൊരുത്തപ്പെട്ടില്ല. നമ്പറുകൾ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക, അല്ലെങ്കിൽ സഹായത്തിനായി നിങ്ങളുടെ ലിങ്ക് വർക്കറോട് ചോദിക്കുക.",
    retry: "വീണ്ടും ശ്രമിക്കുക",
    contact_link_worker: "ലിങ്ക് വർക്കറെ ബന്ധപ്പെടുക",

    identity_verified: "തിരിച്ചറിയൽ പരിശോധിച്ചു",
    abha_label: "ABHA ആരോഗ്യ ഐഡി",
    auto_linked: "സ്വയമേവ ലിങ്ക് ചെയ്തു",
    aawaz_label: "ആവാസ് ഇൻഷുറൻസ്",
    linked: "ലിങ്ക് ചെയ്തു",
    confirm_body: "നിങ്ങളുടെ വർക്കർ ഐഡി {id} ഇപ്പോൾ ജോലിക്കായി പോകുന്ന എല്ലായിടത്തും നിങ്ങളുടെ ആരോഗ്യ രേഖയും ഇൻഷുറൻസ് ലിങ്കും വഹിക്കുന്നു.",
    generate_id: "എന്റെ ഐഡി ഉണ്ടാക്കുക",

    login_title: "ലോഗിൻ ചെയ്യുക",
    label_otp: "ഒടിപി",
    placeholder_otp: "6 അക്ക കോഡ്",
    use_fingerprint_instead: "പകരം വിരൽ‌പാട് ഉപയോഗിക്കുക",
    log_in: "ലോഗിൻ ചെയ്യുക",

    login_error_title: "തെറ്റായ ഒടിപി",
    login_error_body: "ആ കോഡ് പൊരുത്തപ്പെട്ടില്ല. പുതിയൊന്ന് അഭ്യർത്ഥിച്ച് വീണ്ടും ശ്രമിക്കുക.",
    resend_otp: "ഒടിപി വീണ്ടും അയയ്ക്കുക",
    back: "തിരികെ",

    namaste: "നമസ്തേ,",
    tile_digital_id: "എന്റെ ഡിജിറ്റൽ ഐഡി",
    tile_claim_status: "ക്ലെയിം സ്റ്റാറ്റസ്",
    tile_health_records: "ആരോഗ്യ രേഖകൾ",
    tile_notifications: "അറിയിപ്പുകൾ",

    show_at_clinic: "ഇത് ക്ലിനിക്കിൽ കാണിക്കുക",
    simulate_scan: "ക്ലിനിക് സ്കാൻ അനുകരിക്കുക",

    redirect_title: "ഈ ക്ലിനിക് ABHA-യിൽ രജിസ്റ്റർ ചെയ്തിട്ടില്ല",
    redirect_body: "ഒരു ഡോക്ടർക്ക് നിങ്ങളുടെ ചികിത്സാ രേഖ പരിശോധിച്ച് ഡിജിറ്റലായി ഒപ്പിടാൻ കഴിയുന്നതിനായി ദയവായി ഏറ്റവും അടുത്തുള്ള സർക്കാർ ആശുപത്രിയിൽ പോകുക.",
    nearest_hospital_label: "ഏറ്റവും അടുത്തുള്ള സർക്കാർ ആശുപത്രി",
    map_directions: "മാപ്പും വഴിയും",
    simulate_doctor_verify: "ഡോക്ടർ പരിശോധന അനുകരിക്കുക",

    claim_detail_title: "ക്ലെയിം വിശദാംശം",
    updated_prefix: "പുതുക്കി",
    reason_for_rejection: "നിരസിക്കാനുള്ള കാരണം",
    amount_credited: "തുക നിങ്ങളുടെ ലിങ്ക് ചെയ്ത അക്കൗണ്ടിലേക്ക് ക്രെഡിറ്റ് ചെയ്തു",
    notify_next_stage: "ഇത് അടുത്ത ഘട്ടത്തിലേക്ക് നീങ്ങുമ്പോൾ ഞങ്ങൾ നിങ്ങളെ അറിയിക്കും.",
    raise_dispute: "തർക്കം ഉന്നയിക്കുക",

    status_sent: "ഇൻഷുറർക്ക് അയച്ചു",
    status_checking: "അവലോകനത്തിലാണ്",
    status_approved: "അംഗീകരിച്ചു",
    status_paid: "പണം നൽകി",
    status_rejected: "നിരസിച്ചു",
    claim_rejected_short: "ക്ലെയിം നിരസിച്ചു",

    dispute_title: "ഒരു തർക്കം ഉന്നയിക്കുക",
    dispute_intro: "ക്ലെയിം {id} നിരസിച്ചു: {reason}",
    tell_us: "എന്ത് സംഭവിച്ചുവെന്ന് ഞങ്ങളോട് പറയുക",
    dispute_placeholder: "ചികിത്സ യഥാർത്ഥമായിരുന്നു, ദയവായി വീണ്ടും പരിശോധിക്കുക...",
    submit_dispute: "തർക്കം സമർപ്പിക്കുക",
    dispute_filed: "തർക്കം ഫയൽ ചെയ്തു",
    reference_prefix: "റഫറൻസ്",
    back_to_claim: "ക്ലെയിമിലേക്ക് തിരികെ പോകുക",
    under_review_stamp: "അവലോകനത്തിൽ",
  },
  bn: {
    tagline: "অভিবাসী স্বাস্থ্য ও দাবি আইডি",
    chooseLanguage: "আপনার ভাষা বেছে নিন",
    imNewHere: "আমি এখানে নতুন",
    alreadyHaveId: "আমার কাছে ইতিমধ্যে আইডি আছে",

    register_title: "নিবন্ধন করুন",
    register_intro: "আমরা আপনার আধার এবং ই-শ্রম রেকর্ড একবার যুক্ত করি — এরপর আপনার ডিজিটাল আইডি যেকোনো নিবন্ধিত ক্লিনিকে কাজ করবে।",
    label_aadhaar: "আধার নম্বর",
    placeholder_aadhaar: "১২-সংখ্যার নম্বর",
    label_eshram: "ই-শ্রম আইডি",
    capture_fingerprint: "ফিঙ্গারপ্রিন্ট নিন",
    fingerprint_captured: "ফিঙ্গারপ্রিন্ট নেওয়া হয়েছে",
    verify_continue: "যাচাই করুন এবং এগিয়ে যান",

    reg_error_title: "আমরা এটি যাচাই করতে পারিনি",
    reg_error_body: "আপনার আধার ও ই-শ্রম তথ্য মিলছে না। নম্বরগুলো পরীক্ষা করে আবার চেষ্টা করুন, অথবা সাহায্যের জন্য আপনার লিঙ্ক ওয়ার্কারকে জিজ্ঞাসা করুন।",
    retry: "আবার চেষ্টা করুন",
    contact_link_worker: "লিঙ্ক ওয়ার্কারের সাথে যোগাযোগ করুন",

    identity_verified: "পরিচয় যাচাই হয়েছে",
    abha_label: "ABHA স্বাস্থ্য আইডি",
    auto_linked: "স্বয়ংক্রিয়ভাবে যুক্ত",
    aawaz_label: "আওয়াজ বীমা",
    linked: "যুক্ত",
    confirm_body: "আপনার ওয়ার্কার আইডি {id} এখন আপনি কাজের জন্য যেখানেই যান সেখানে আপনার স্বাস্থ্য রেকর্ড ও বীমা লিঙ্ক বহন করে।",
    generate_id: "আমার আইডি তৈরি করুন",

    login_title: "লগ ইন করুন",
    label_otp: "ওটিপি",
    placeholder_otp: "৬-সংখ্যার কোড",
    use_fingerprint_instead: "পরিবর্তে ফিঙ্গারপ্রিন্ট ব্যবহার করুন",
    log_in: "লগ ইন করুন",

    login_error_title: "ভুল ওটিপি",
    login_error_body: "সেই কোডটি মেলেনি। নতুন একটি অনুরোধ করে আবার চেষ্টা করুন।",
    resend_otp: "ওটিপি আবার পাঠান",
    back: "পেছনে",

    namaste: "নমস্তে,",
    tile_digital_id: "আমার ডিজিটাল আইডি",
    tile_claim_status: "দাবির অবস্থা",
    tile_health_records: "স্বাস্থ্য রেকর্ড",
    tile_notifications: "বিজ্ঞপ্তি",

    show_at_clinic: "এটি ক্লিনিকে দেখান",
    simulate_scan: "ক্লিনিক স্ক্যান অনুকরণ করুন",

    redirect_title: "এই ক্লিনিকটি ABHA-নিবন্ধিত নয়",
    redirect_body: "অনুগ্রহ করে নিকটতম সরকারি হাসপাতালে যান যাতে একজন ডাক্তার আপনার চিকিৎসার রেকর্ড যাচাই করে ডিজিটালি স্বাক্ষর করতে পারেন।",
    nearest_hospital_label: "নিকটতম সরকারি হাসপাতাল",
    map_directions: "মানচিত্র ও দিকনির্দেশ",
    simulate_doctor_verify: "ডাক্তার যাচাইকরণ অনুকরণ করুন",

    claim_detail_title: "দাবির বিস্তারিত",
    updated_prefix: "হালনাগাদ",
    reason_for_rejection: "প্রত্যাখ্যানের কারণ",
    amount_credited: "আপনার লিঙ্কড অ্যাকাউন্টে টাকা জমা হয়েছে",
    notify_next_stage: "এটি পরবর্তী ধাপে গেলে আমরা আপনাকে জানাব।",
    raise_dispute: "বিরোধ উত্থাপন করুন",

    status_sent: "বীমাকারীর কাছে পাঠানো হয়েছে",
    status_checking: "পর্যালোচনাধীন",
    status_approved: "অনুমোদিত",
    status_paid: "অর্থ প্রদান করা হয়েছে",
    status_rejected: "প্রত্যাখ্যাত",
    claim_rejected_short: "দাবি প্রত্যাখ্যাত",

    dispute_title: "একটি বিরোধ উত্থাপন করুন",
    dispute_intro: "দাবি {id} প্রত্যাখ্যাত হয়েছে: {reason}",
    tell_us: "কী ঘটেছিল আমাদের বলুন",
    dispute_placeholder: "চিকিৎসা প্রকৃত ছিল, অনুগ্রহ করে আবার পরীক্ষা করুন...",
    submit_dispute: "বিরোধ জমা দিন",
    dispute_filed: "বিরোধ দাখিল হয়েছে",
    reference_prefix: "রেফারেন্স",
    back_to_claim: "দাবিতে ফিরে যান",
    under_review_stamp: "পর্যালোচনাধীন",
  },
};

// NOTE: translations above are a solid first pass for demo purposes,
// but haven't been reviewed by native speakers — get that review
// before this ships to real workers.

const LanguageContext = createContext({ lang: "en", t: (k) => k });
const useT = () => useContext(LanguageContext);

function makeTranslator(lang) {
  const dict = translations[lang] || translations.en;
  return (key, vars) => {
    let str = dict[key] ?? translations.en[key] ?? key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(`{${k}}`, vars[k]);
      });
    }
    return str;
  };
}

function useStatusMeta() {
  const { t } = useT();
  return {
    Sent: { color: "var(--mh-ink-muted)", label: t("status_sent") },
    Checking: { color: "var(--mh-accent)", label: t("status_checking") },
    Approved: { color: "var(--mh-primary)", label: t("status_approved") },
    Paid: { color: "var(--mh-primary-deep)", label: t("status_paid") },
    Rejected: { color: "var(--mh-danger)", label: t("status_rejected") },
  };
}

/* ============================================================
   MOCK API — mirrors the API Contract exactly (field names,
   status enum, response shapes). Simulates latency with a
   short delay. Behavior for branch points (identity verified,
   login valid, clinic ABHA status, claim status) is driven by
   the Demo Controls drawer so a reviewer can walk every screen.
   ============================================================ */
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function makeMockApi(demo) {
  return {
    async register({ aadhaar_number, eshram_id, biometric_hash }) {
      await delay(900);
      if (!demo.identityVerified) {
        const err = new Error("verification_failed");
        err.verified = false;
        throw err;
      }
      const worker_id = "WRK-" + String(Math.floor(10000 + Math.random() * 89999));
      return {
        worker_id,
        abha_id: "12-3456-7890-" + String(Math.floor(1000 + Math.random() * 8999)),
        aawaz_id: "AWZ-KL-" + String(Math.floor(10000 + Math.random() * 89999)),
        qr_payload: `${worker_id}|12-3456-7890-1234|AWZ-KL-88213`,
        status: "success",
      };
    },

    async login({ eshram_id, otp }) {
      await delay(700);
      if (!demo.loginValid) {
        const err = new Error("login_invalid");
        throw err;
      }
      return {
        worker_id: "WRK-00931",
        token: "eyJhbGciOi." + Math.random().toString(36).slice(2),
        status: "success",
      };
    },

    async getWorker(worker_id) {
      await delay(500);
      return {
        worker_id,
        name: "Ramesh Kumar",
        qr_payload: `${worker_id}|12-3456-7890-1234|AWZ-KL-88213`,
        language: demo.language || "en",
      };
    },

    async postTreatmentEvent({ worker_id, facility_id, diagnosis, treatment_cost }) {
      await delay(1000);
      const claim_id = "CLM-" + String(Math.floor(10000 + Math.random() * 89999));
      if (demo.clinicAbha) {
        return {
          claim_id,
          status: "Sent",
          facility_type: "abha_registered",
          redirect_required: false,
        };
      }
      return {
        claim_id,
        status: "Sent",
        facility_type: "non_abha_clinic",
        redirect_required: true,
        nearest_govt_hospital: {
          name: "Govt. Taluk Hospital, Kochi",
          lat: 9.9312,
          lng: 76.2673,
        },
      };
    },

    async getClaims(worker_id, extra) {
      await delay(600);
      const base = [
        { claim_id: "CLM-76210", date: "2026-08-10T09:00:00Z", status: "Paid", amount: 2200, rejection_reason: null },
        { claim_id: "CLM-74108", date: "2026-07-22T13:40:00Z", status: "Rejected", amount: 950, rejection_reason: "Diagnosis code does not match submitted treatment cost." },
      ];
      const claims = extra ? [extra, ...base] : base;
      return { claims };
    },

    async getClaimStatus(claim_id, statusOverride, amount) {
      await delay(500);
      const status = statusOverride || "Sent";
      return {
        claim_id,
        status,
        amount: amount ?? 1800,
        rejection_reason: status === "Rejected" ? "Treatment cost exceeds facility's registered claim ceiling." : null,
        updated_at: new Date().toISOString(),
      };
    },

    async postDispute(claim_id, { reason }) {
      await delay(800);
      return {
        dispute_id: "DIS-" + String(Math.floor(1000 + Math.random() * 8999)),
        status: "under_review",
      };
    },
  };
}

/* ============================================================
   Deterministic pseudo-QR renderer (visual only — encodes
   qr_payload into a stamp-like grid, not a scannable code).
   ============================================================ */
function PseudoQR({ payload, size = 168 }) {
  const grid = 21;
  const cells = [];
  let seed = 0;
  for (let i = 0; i < payload.length; i++) seed = (seed * 31 + payload.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const isFinder =
        (x < 5 && y < 5) || (x > grid - 6 && y < 5) || (x < 5 && y > grid - 6);
      let filled;
      if (isFinder) {
        const lx = x < 5 ? x : x - (grid - 6);
        const ly = y < 5 ? y : y > grid - 6 ? y - (grid - 6) : y;
        filled = lx === 0 || lx === 4 || ly === 0 || ly === 4 || (lx >= 2 && lx <= 2 && ly >= 2 && ly <= 2);
      } else {
        filled = rand() > 0.58;
      }
      if (filled) cells.push([x, y]);
    }
  }
  const cell = size / grid;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Worker ID QR code">
      <rect x="0" y="0" width={size} height={size} fill="var(--mh-surface)" />
      {cells.map(([x, y], i) => (
        <rect key={i} x={x * cell} y={y * cell} width={cell} height={cell} fill="var(--mh-ink)" />
      ))}
    </svg>
  );
}

/* ============================================================
   Small shared UI atoms
   ============================================================ */
function Stamp({ children }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      border: "1.5px dashed var(--mh-accent)", color: "var(--mh-accent)",
      borderRadius: 999, padding: "4px 10px", fontFamily: "var(--mh-font-mono)",
      fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, loading, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "14px 18px", borderRadius: 12, border: "none",
        background: disabled ? "#B9C4BE" : "var(--mh-primary)", color: "#fff",
        fontFamily: "var(--mh-font-sans)", fontWeight: 600, fontSize: 15,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 6px 16px -6px rgba(15,110,79,0.55)",
        transition: "transform 0.12s ease", ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {loading ? <Loader2 size={16} className="mh-spin" /> : null}
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, style, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "12px 18px", borderRadius: 12,
        border: "1.5px solid var(--mh-border)", background: "var(--mh-surface)",
        color: "var(--mh-ink)", fontFamily: "var(--mh-font-sans)", fontWeight: 600,
        fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, cursor: "pointer", ...style,
      }}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

function TextField({ label, value, onChange, placeholder, mono, maxLength, inputMode }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: "var(--mh-ink-muted)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
      }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        style={{
          width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 10,
          border: "1.5px solid var(--mh-border)", fontSize: 16,
          fontFamily: mono ? "var(--mh-font-mono)" : "var(--mh-font-sans)",
          background: "var(--mh-surface)", color: "var(--mh-ink)", outline: "none",
        }}
      />
    </label>
  );
}

function TopBar({ title, onBack }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 14px",
      borderBottom: "1px solid var(--mh-border)", background: "var(--mh-surface)",
    }}>
      {onBack ? (
        <button onClick={onBack} aria-label="Go back" style={{
          border: "none", background: "var(--mh-primary-soft)", borderRadius: 8,
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--mh-primary-deep)",
        }}><ArrowLeft size={16} /></button>
      ) : <div style={{ width: 32 }} />}
      <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 16, color: "var(--mh-ink)" }}>
        {title}
      </div>
    </div>
  );
}

const STATUS_ORDER = ["Sent", "Checking", "Approved", "Paid"];

function StatusTracker({ status }) {
  const { t } = useT();
  const meta = useStatusMeta();
  if (status === "Rejected") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, color: "var(--mh-danger)",
        fontFamily: "var(--mh-font-sans)", fontWeight: 600, fontSize: 13,
      }}>
        <X size={16} /> {t("claim_rejected_short")}
      </div>
    );
  }
  const activeIdx = STATUS_ORDER.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {STATUS_ORDER.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              border: `2px ${i <= activeIdx ? "solid" : "dashed"} ${i <= activeIdx ? "var(--mh-primary)" : "var(--mh-border)"}`,
              background: i <= activeIdx ? "var(--mh-primary)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: i <= activeIdx ? "#fff" : "var(--mh-ink-muted)", flexShrink: 0,
            }}>
              {i < activeIdx ? <Check size={13} /> : <span style={{ fontFamily: "var(--mh-font-mono)", fontSize: 10 }}>{i + 1}</span>}
            </div>
            <div style={{
              fontSize: 10, marginTop: 4, textAlign: "center", width: 54,
              color: i <= activeIdx ? "var(--mh-ink)" : "var(--mh-ink-muted)",
              fontFamily: "var(--mh-font-sans)", fontWeight: i === activeIdx ? 700 : 500,
            }}>{meta[s]?.label}</div>
          </div>
          {i < STATUS_ORDER.length - 1 && (
            <div style={{
              flex: 1, height: 2, marginBottom: 16,
              background: i < activeIdx ? "var(--mh-primary)" : "var(--mh-border)",
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================================================
   PAGE 1 — Splash Screen
   ============================================================ */
function Splash({ language, setLanguage, onNew, onReturning }) {
  const { t } = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "40px 24px 28px", background: "var(--mh-primary-deep)", color: "#fff" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: "var(--mh-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid rgba(255,255,255,0.25)",
        }}>
          <HeartPulse size={34} color="var(--mh-accent-soft)" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 22, letterSpacing: "0.01em" }}>
            Aawaz Swasthya
          </div>
          <div style={{ fontFamily: "var(--mh-font-mono)", fontSize: 11, opacity: 0.7, marginTop: 4, letterSpacing: "0.08em" }}>
            SIH25083 · {t("tagline")}
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={13} /> {t("chooseLanguage")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => setLanguage(l.code)} style={{
              padding: "10px 8px", borderRadius: 10, cursor: "pointer",
              border: language === l.code ? "2px solid var(--mh-accent)" : "1.5px solid rgba(255,255,255,0.25)",
              background: language === l.code ? "rgba(201,138,43,0.18)" : "transparent",
              color: "#fff", fontFamily: "var(--mh-font-sans)", fontWeight: 600, fontSize: 14,
            }}>{l.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onNew} style={{ background: "var(--mh-accent)", boxShadow: "0 6px 16px -6px rgba(201,138,43,0.6)" }}>
          {t("imNewHere")} <ChevronRight size={16} />
        </PrimaryButton>
        <SecondaryButton onClick={onReturning} style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff" }}>
          {t("alreadyHaveId")}
        </SecondaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 2 — Registration
   ============================================================ */
function Registration({ onVerified, onBack, loading }) {
  const { t } = useT();
  const [aadhaar, setAadhaar] = useState("");
  const [eshram, setEshram] = useState("");
  const [bio, setBio] = useState(false);

  const canSubmit = aadhaar.length === 12 && eshram.length >= 6 && bio;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title={t("register_title")} onBack={onBack} />
      <div style={{ padding: 22, flex: 1, overflowY: "auto" }}>
        <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", marginTop: 0, marginBottom: 22 }}>
          {t("register_intro")}
        </p>
        <TextField label={t("label_aadhaar")} value={aadhaar} onChange={setAadhaar} placeholder={t("placeholder_aadhaar")} mono maxLength={12} inputMode="numeric" />
        <TextField label={t("label_eshram")} value={eshram} onChange={setEshram} placeholder="ES-XX-000000" mono maxLength={14} />
        <button onClick={() => setBio(true)} style={{
          width: "100%", padding: "16px", borderRadius: 12, marginBottom: 8,
          border: bio ? "1.5px solid var(--mh-primary)" : "1.5px dashed var(--mh-border)",
          background: bio ? "var(--mh-primary-soft)" : "var(--mh-surface)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          color: bio ? "var(--mh-primary-deep)" : "var(--mh-ink-muted)", cursor: "pointer",
          fontFamily: "var(--mh-font-sans)", fontWeight: 600, fontSize: 14,
        }}>
          <Fingerprint size={18} /> {bio ? t("fingerprint_captured") : t("capture_fingerprint")}
        </button>
      </div>
      <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
        <PrimaryButton disabled={!canSubmit} loading={loading} onClick={() => {
          onVerified({ aadhaar_number: aadhaar, eshram_id: eshram, biometric_hash: "base64_demo_hash" });
        }}>
          {t("verify_continue")}
        </PrimaryButton>
      </div>
    </div>
  );
}

/* PAGE 2a — Registration error */
function RegistrationError({ onRetry, onContactWorker }) {
  const { t } = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: "var(--mh-danger-soft)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
      }}>
        <AlertTriangle size={28} color="var(--mh-danger)" />
      </div>
      <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, color: "var(--mh-ink)", marginBottom: 8 }}>
        {t("reg_error_title")}
      </div>
      <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", maxWidth: 260, marginBottom: 28 }}>
        {t("reg_error_body")}
      </p>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onRetry}><RefreshCw size={15} /> {t("retry")}</PrimaryButton>
        <SecondaryButton onClick={onContactWorker} icon={Phone}>{t("contact_link_worker")}</SecondaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 3 — ID Confirmation
   ============================================================ */
function IdConfirmation({ worker, onGenerate }) {
  const { t } = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <Stamp><BadgeCheck size={12} /> {t("identity_verified")}</Stamp>
      </div>
      <div style={{
        background: "var(--mh-surface)", border: "1.5px solid var(--mh-border)", borderRadius: 16,
        padding: 20, marginBottom: 16,
      }}>
        <Row icon={ShieldCheck} label={t("abha_label")} value={worker.abha_id} sub={t("auto_linked")} />
        <Row icon={HeartPulse} label={t("aawaz_label")} value={worker.aawaz_id} sub={t("linked")} last />
      </div>
      <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", flex: 1 }}>
        {t("confirm_body", { id: worker.worker_id })}
      </p>
      <PrimaryButton onClick={onGenerate}>{t("generate_id")} <ChevronRight size={16} /></PrimaryButton>
    </div>
  );
}

function Row({ icon: Icon, label, value, sub, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: last ? 0 : 16, marginBottom: last ? 0 : 16, borderBottom: last ? "none" : "1px dashed var(--mh-border)" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--mh-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color="var(--mh-primary-deep)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--mh-ink-muted)", fontFamily: "var(--mh-font-sans)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
        <div style={{ fontFamily: "var(--mh-font-mono)", fontSize: 14, color: "var(--mh-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
      <div style={{ fontSize: 11, color: "var(--mh-primary)", fontWeight: 700, fontFamily: "var(--mh-font-sans)", flexShrink: 0 }}>{sub}</div>
    </div>
  );
}

/* ============================================================
   PAGE 2b / 2c — Login + Login error
   ============================================================ */
function Login({ onLoggedIn, onBack, loading }) {
  const { t } = useT();
  const [eshram, setEshram] = useState("ES-KL-004521");
  const [otp, setOtp] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title={t("login_title")} onBack={onBack} />
      <div style={{ padding: 22, flex: 1 }}>
        <TextField label={t("label_eshram")} value={eshram} onChange={setEshram} mono />
        <TextField label={t("label_otp")} value={otp} onChange={setOtp} placeholder={t("placeholder_otp")} mono maxLength={6} inputMode="numeric" />
        <SecondaryButton icon={Fingerprint} onClick={() => {}}>{t("use_fingerprint_instead")}</SecondaryButton>
      </div>
      <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
        <PrimaryButton disabled={otp.length < 4} loading={loading} onClick={() => {
          onLoggedIn({ eshram_id: eshram, otp });
        }}>{t("log_in")}</PrimaryButton>
      </div>
    </div>
  );
}

function LoginError({ onResend, onBack }) {
  const { t } = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--mh-danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <X size={28} color="var(--mh-danger)" />
      </div>
      <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{t("login_error_title")}</div>
      <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", maxWidth: 250, marginBottom: 28 }}>
        {t("login_error_body")}
      </p>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onResend}><Send size={15} /> {t("resend_otp")}</PrimaryButton>
        <SecondaryButton onClick={onBack}>{t("back")}</SecondaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 4 — Home
   ============================================================ */
function HomeScreen({ worker, onDigitalId, onClaimStatus }) {
  const { t } = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "22px 20px 18px", background: "var(--mh-primary-deep)", color: "#fff", borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.75, fontFamily: "var(--mh-font-sans)" }}>{t("namaste")}</div>
            <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 20 }}>{worker.name}</div>
          </div>
          <button aria-label="Notifications" style={{ background: "rgba(255,255,255,0.14)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
            <Bell size={16} />
          </button>
        </div>
        <div style={{ marginTop: 14, fontFamily: "var(--mh-font-mono)", fontSize: 11, opacity: 0.65, letterSpacing: "0.04em" }}>{worker.worker_id}</div>
      </div>

      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
        <Tile icon={QrCode} label={t("tile_digital_id")} onClick={onDigitalId} featured />
        <Tile icon={FileText} label={t("tile_claim_status")} onClick={onClaimStatus} />
        <Tile icon={HeartPulse} label={t("tile_health_records")} onClick={() => {}} />
        <Tile icon={Bell} label={t("tile_notifications")} onClick={() => {}} />
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, onClick, featured }) {
  return (
    <button onClick={onClick} style={{
      border: featured ? "none" : "1.5px solid var(--mh-border)",
      background: featured ? "var(--mh-primary)" : "var(--mh-surface)",
      color: featured ? "#fff" : "var(--mh-ink)",
      borderRadius: 16, padding: "20px 14px", display: "flex", flexDirection: "column",
      alignItems: "flex-start", gap: 22, cursor: "pointer", textAlign: "left",
      boxShadow: featured ? "0 8px 20px -8px rgba(15,110,79,0.6)" : "none",
    }}>
      <Icon size={22} color={featured ? "var(--mh-accent-soft)" : "var(--mh-primary)"} />
      <span style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 14 }}>{label}</span>
    </button>
  );
}

/* ============================================================
   PAGE 5 — QR code screen (+ clinic scan simulation)
   ============================================================ */
function QrScreen({ worker, onBack, onScanned, scanning }) {
  const { t } = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title={t("tile_digital_id")} onBack={onBack} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "var(--mh-surface)", border: "1.5px solid var(--mh-border)", borderRadius: 20, padding: 18, marginBottom: 20 }}>
          <PseudoQR payload={worker.qr_payload} />
        </div>
        <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, color: "var(--mh-ink)" }}>{worker.name}</div>
        <div style={{ fontFamily: "var(--mh-font-mono)", fontSize: 12, color: "var(--mh-ink-muted)", marginTop: 4 }}>{worker.worker_id}</div>
        <div style={{ marginTop: 16 }}>
          <Stamp>{t("show_at_clinic")}</Stamp>
        </div>
      </div>
      <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
        <PrimaryButton loading={scanning} onClick={onScanned} style={{ background: "var(--mh-accent)", boxShadow: "0 6px 16px -6px rgba(201,138,43,0.6)" }}>
          <Stethoscope size={16} /> {t("simulate_scan")}
        </PrimaryButton>
      </div>
    </div>
  );
}

/* PAGE 5a — Redirect notice */
function RedirectNotice({ hospital, onDoctorVerify, verifying }) {
  const { t } = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--mh-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <MapPin size={26} color="var(--mh-accent)" />
        </div>
        <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, color: "var(--mh-ink)" }}>
          {t("redirect_title")}
        </div>
        <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", marginTop: 8 }}>
          {t("redirect_body")}
        </p>
      </div>
      <div style={{ background: "var(--mh-surface)", border: "1.5px solid var(--mh-border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--mh-ink-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 6 }}>{t("nearest_hospital_label")}</div>
        <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 600, fontSize: 15, color: "var(--mh-ink)" }}>{hospital.name}</div>
        <div style={{ fontFamily: "var(--mh-font-mono)", fontSize: 11, color: "var(--mh-ink-muted)", marginTop: 4 }}>{hospital.lat.toFixed(4)}, {hospital.lng.toFixed(4)}</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SecondaryButton icon={Navigation}>{t("map_directions")}</SecondaryButton>
        <PrimaryButton loading={verifying} onClick={onDoctorVerify}>{t("simulate_doctor_verify")}</PrimaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 6 — Claim status
   ============================================================ */
function ClaimStatusScreen({ claims, onBack, onOpenClaim, loading }) {
  const { t } = useT();
  const meta = useStatusMeta();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title={t("tile_claim_status")} onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--mh-ink-muted)" }}><Loader2 className="mh-spin" /></div>}
        {!loading && claims.map((c) => (
          <button key={c.claim_id} onClick={() => onOpenClaim(c)} style={{
            width: "100%", textAlign: "left", background: "var(--mh-surface)",
            border: "1.5px solid var(--mh-border)", borderRadius: 14, padding: 16,
            marginBottom: 12, cursor: "pointer",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--mh-font-mono)", fontSize: 13, color: "var(--mh-ink)" }}>{c.claim_id}</span>
              <span style={{
                fontFamily: "var(--mh-font-sans)", fontSize: 11, fontWeight: 700, padding: "3px 10px",
                borderRadius: 999, color: "#fff", background: meta[c.status]?.color,
              }}>{meta[c.status]?.label || c.status}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--mh-ink-muted)", fontFamily: "var(--mh-font-sans)" }}>
                {new Date(c.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 2, fontFamily: "var(--mh-font-mono)", fontWeight: 700, fontSize: 14, color: "var(--mh-ink)" }}>
                <IndianRupee size={12} />{c.amount}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ClaimDetail({ claim, onBack, onRaiseDispute }) {
  const { t } = useT();
  const meta = useStatusMeta();
  const statusMeta = meta[claim.status];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title={t("claim_detail_title")} onBack={onBack} />
      <div style={{ padding: 22, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--mh-font-mono)", fontSize: 14, color: "var(--mh-ink-muted)" }}>{claim.claim_id}</span>
          <span style={{ display: "flex", alignItems: "center", fontFamily: "var(--mh-font-mono)", fontWeight: 700, fontSize: 22, color: "var(--mh-ink)" }}>
            <IndianRupee size={16} />{claim.amount}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--mh-ink-muted)", marginBottom: 26, fontFamily: "var(--mh-font-sans)" }}>
          {t("updated_prefix")} {new Date(claim.updated_at || claim.date).toLocaleString("en-IN")}
        </div>

        <div style={{ background: "var(--mh-surface)", border: "1.5px solid var(--mh-border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <StatusTracker status={claim.status} />
        </div>

        {claim.status === "Rejected" ? (
          <div style={{ background: "var(--mh-danger-soft)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--mh-danger)", fontSize: 13, marginBottom: 6, fontFamily: "var(--mh-font-sans)" }}>
              <AlertTriangle size={15} /> {t("reason_for_rejection")}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--mh-ink)", fontFamily: "var(--mh-font-sans)" }}>{claim.rejection_reason}</p>
          </div>
        ) : claim.status === "Paid" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--mh-primary-deep)", fontFamily: "var(--mh-font-sans)", fontSize: 13, fontWeight: 600 }}>
            <Check size={16} /> {t("amount_credited")}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--mh-ink-muted)", fontFamily: "var(--mh-font-sans)" }}>
            {statusMeta?.label} — {t("notify_next_stage")}
          </div>
        )}
      </div>
      {claim.status === "Rejected" && (
        <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
          <PrimaryButton onClick={onRaiseDispute} style={{ background: "var(--mh-danger)" }}>{t("raise_dispute")}</PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* PAGE 6a — Rejection / dispute */
function DisputeScreen({ claim, onBack, onSubmit, submitting, result }) {
  const { t } = useT();
  const [reason, setReason] = useState("");
  if (result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--mh-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Check size={28} color="var(--mh-primary-deep)" />
        </div>
        <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{t("dispute_filed")}</div>
        <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", marginBottom: 6 }}>
          {t("reference_prefix")} <span style={{ fontFamily: "var(--mh-font-mono)" }}>{result.dispute_id}</span>
        </p>
        <Stamp>{t("under_review_stamp")}</Stamp>
        <div style={{ marginTop: 30, width: "100%" }}>
          <PrimaryButton onClick={onBack}>{t("back_to_claim")}</PrimaryButton>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title={t("dispute_title")} onBack={onBack} />
      <div style={{ padding: 22, flex: 1 }}>
        <div style={{ background: "var(--mh-danger-soft)", borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 12, color: "var(--mh-danger)", fontFamily: "var(--mh-font-sans)" }}>
          {t("dispute_intro", { id: claim.claim_id, reason: claim.rejection_reason })}
        </div>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mh-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            {t("tell_us")}
          </div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={5} placeholder={t("dispute_placeholder")} style={{
            width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 12,
            border: "1.5px solid var(--mh-border)", fontFamily: "var(--mh-font-sans)", fontSize: 14, resize: "none",
          }} />
        </label>
      </div>
      <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
        <PrimaryButton disabled={reason.trim().length < 6} loading={submitting} onClick={() => onSubmit(reason)}>{t("submit_dispute")}</PrimaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   Demo controls drawer — lets a reviewer force each branch
   point in the flowchart so every screen can be reached.
   This is a dev-only overlay, so it's intentionally left in
   English regardless of the selected app language.
   ============================================================ */
function DemoDrawer({ demo, setDemo, open, setOpen }) {
  return (
    <>
      <button onClick={() => setOpen(!open)} aria-label="Demo controls" style={{
        position: "absolute", top: 10, right: -46, width: 36, height: 36, borderRadius: 10,
        border: "1px solid var(--mh-border)", background: "var(--mh-surface)", color: "var(--mh-ink-muted)",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 20,
      }}>
        <Settings2 size={16} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: 52, right: -260, width: 240, background: "var(--mh-surface)",
          border: "1px solid var(--mh-border)", borderRadius: 14, padding: 16, zIndex: 20,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)", fontFamily: "var(--mh-font-sans)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--mh-ink-muted)", marginBottom: 12 }}>
            Demo controls
          </div>
          <DemoToggle label="Identity check" a="Verified" b="Fails" value={demo.identityVerified} onChange={(v) => setDemo((d) => ({ ...d, identityVerified: v }))} />
          <DemoToggle label="OTP login" a="Valid" b="Invalid" value={demo.loginValid} onChange={(v) => setDemo((d) => ({ ...d, loginValid: v }))} />
          <DemoToggle label="Clinic type" a="ABHA-registered" b="Not registered" value={demo.clinicAbha} onChange={(v) => setDemo((d) => ({ ...d, clinicAbha: v }))} />
          <div style={{ fontSize: 10, color: "var(--mh-ink-muted)", marginBottom: 6 }}>Force claim status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Sent", "Checking", "Approved", "Paid", "Rejected"].map((s) => (
              <button key={s} onClick={() => setDemo((d) => ({ ...d, claimStatus: s }))} style={{
                fontSize: 10, padding: "4px 8px", borderRadius: 999, cursor: "pointer",
                border: demo.claimStatus === s ? "1.5px solid var(--mh-primary)" : "1px solid var(--mh-border)",
                background: demo.claimStatus === s ? "var(--mh-primary-soft)" : "transparent",
                color: "var(--mh-ink)",
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function DemoToggle({ label, a, b, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: "var(--mh-ink-muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--mh-border)" }}>
        {[[true, a], [false, b]].map(([v, txt]) => (
          <button key={txt} onClick={() => onChange(v)} style={{
            flex: 1, padding: "6px 4px", fontSize: 11, border: "none", cursor: "pointer",
            background: value === v ? "var(--mh-primary)" : "transparent",
            color: value === v ? "#fff" : "var(--mh-ink-muted)", fontWeight: 600,
          }}>{txt}</button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP — screen state machine mirrors the flowchart edges.
   `language` lives here and is handed down through
   LanguageContext so every screen's t() call re-renders with
   the right strings the moment a Splash button is tapped.
   ============================================================ */
export default function MigrantHealthApp() {
  const [screen, setScreen] = useState("splash");
  const [language, setLanguage] = useState("en");
  const [worker, setWorker] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activeClaim, setActiveClaim] = useState(null);
  const [pendingTreatment, setPendingTreatment] = useState(null); // {claim_id, hospital?}
  const [disputeResult, setDisputeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [demo, setDemo] = useState({
    identityVerified: true, loginValid: true, clinicAbha: false, claimStatus: "Checking",
  });
  const api = useRef(makeMockApi(demo));
  useEffect(() => { api.current = makeMockApi(demo); }, [demo]);

  const t = useMemo(() => makeTranslator(language), [language]);
  const ctxValue = useMemo(() => ({ lang: language, t }), [language, t]);

  const go = (s) => setScreen(s);

  const handleRegisterSubmit = async (payload) => {
    setLoading(true);
    try {
      const res = await api.current.register(payload);
      setWorker({ ...res, name: "Ramesh Kumar", language });
      go("confirm");
    } catch {
      go("reg-error");
    } finally { setLoading(false); }
  };

  const handleLoginSubmit = async (payload) => {
    setLoading(true);
    try {
      const res = await api.current.login(payload);
      const w = await api.current.getWorker(res.worker_id);
      setWorker({ ...w, abha_id: "12-3456-7890-1234", aawaz_id: "AWZ-KL-88213", token: res.token });
      go("home");
    } catch {
      go("login-error");
    } finally { setLoading(false); }
  };

  const openClaimStatus = async () => {
    go("claims");
    setLoading(true);
    const extra = pendingTreatment ? {
      claim_id: pendingTreatment.claim_id,
      date: new Date().toISOString(),
      status: demo.claimStatus,
      amount: 1800,
      rejection_reason: demo.claimStatus === "Rejected" ? "Treatment cost exceeds facility's registered claim ceiling." : null,
    } : null;
    const res = await api.current.getClaims(worker.worker_id, extra);
    setClaims(res.claims);
    setLoading(false);
  };

  const openClaimDetail = async (claim) => {
    setLoading(true);
    const res = await api.current.getClaimStatus(claim.claim_id, claim.status, claim.amount);
    setActiveClaim(res);
    setLoading(false);
    go("claim-detail");
  };

  const handleScan = async () => {
    setLoading(true);
    const res = await api.current.postTreatmentEvent({
      worker_id: worker.worker_id, facility_id: "FAC-2291",
      diagnosis: "Fever, dehydration", treatment_cost: 1800,
    });
    setLoading(false);
    if (res.redirect_required) {
      setPendingTreatment({ claim_id: res.claim_id, hospital: res.nearest_govt_hospital });
      go("redirect");
    } else {
      setPendingTreatment({ claim_id: res.claim_id });
      openClaimStatus();
    }
  };

  const handleDoctorVerify = async () => {
    setLoading(true);
    await delay(900);
    setLoading(false);
    openClaimStatus();
  };

  const handleDispute = async (reason) => {
    setLoading(true);
    const res = await api.current.postDispute(activeClaim.claim_id, { reason });
    setDisputeResult(res);
    setLoading(false);
  };

  let content;
  switch (screen) {
    case "splash":
      content = <Splash language={language} setLanguage={setLanguage} onNew={() => go("register")} onReturning={() => go("login")} />;
      break;
    case "register":
      content = <Registration loading={loading} onBack={() => go("splash")} onVerified={handleRegisterSubmit} />;
      break;
    case "reg-error":
      content = <RegistrationError onRetry={() => go("register")} onContactWorker={() => alert("Connecting to your nearest Link Worker...")} />;
      break;
    case "confirm":
      content = <IdConfirmation worker={worker} onGenerate={() => go("home")} />;
      break;
    case "login":
      content = <Login loading={loading} onBack={() => go("splash")} onLoggedIn={handleLoginSubmit} />;
      break;
    case "login-error":
      content = <LoginError onResend={() => go("login")} onBack={() => go("login")} />;
      break;
    case "home":
      content = <HomeScreen worker={worker} onDigitalId={() => go("qr")} onClaimStatus={openClaimStatus} />;
      break;
    case "qr":
      content = <QrScreen worker={worker} scanning={loading} onBack={() => go("home")} onScanned={handleScan} />;
      break;
    case "redirect":
      content = <RedirectNotice hospital={pendingTreatment?.hospital} verifying={loading} onDoctorVerify={handleDoctorVerify} />;
      break;
    case "claims":
      content = <ClaimStatusScreen claims={claims} loading={loading} onBack={() => go("home")} onOpenClaim={openClaimDetail} />;
      break;
    case "claim-detail":
      content = activeClaim ? (
        <ClaimDetail claim={activeClaim} onBack={() => go("claims")} onRaiseDispute={() => { setDisputeResult(null); go("dispute"); }} />
      ) : null;
      break;
    case "dispute":
      content = <DisputeScreen claim={activeClaim} submitting={loading} result={disputeResult} onBack={() => go("claim-detail")} onSubmit={handleDispute} />;
      break;
    default:
      content = null;
  }

  return (
    <LanguageContext.Provider value={ctxValue}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 640, fontFamily: "var(--mh-font-sans)" }}>
        <style>{TOKENS}</style>

        <div style={{ position: "relative" }}>
          {/* perforated tear-off edge, like a torn passbook page */}
          <div style={{
            position: "absolute", top: -1, left: 24, right: 24, height: 10,
            backgroundImage: "radial-gradient(circle, var(--mh-paper) 3px, transparent 3.5px)",
            backgroundSize: "14px 10px", backgroundRepeat: "repeat-x", zIndex: 2,
          }} />
          <div style={{
            width: 360, height: 720, background: "var(--mh-paper)", borderRadius: 34,
            border: "8px solid var(--mh-ink)", overflow: "hidden", position: "relative",
            boxShadow: "0 30px 60px -20px rgba(0,0,0,0.35)",
          }}>
            <div style={{ height: "100%", background: "var(--mh-paper)" }}>
              {content}
            </div>
          </div>
          <DemoDrawer demo={demo} setDemo={setDemo} open={drawerOpen} setOpen={setDrawerOpen} />
        </div>
      </div>
    </LanguageContext.Provider>
  );
}