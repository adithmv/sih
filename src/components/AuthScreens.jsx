import { BadgeCheck, Fingerprint, HeartPulse, IdCard, LogIn, Phone, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { ActionButton, PageHeading } from "./GovLayout";

export function WelcomeScreen({ language, setLanguage, onNew, onReturning }) {
  const languages = [
    ["en", "English"], ["hi", "हिन्दी"], ["ml", "മലയാളം"], ["bn", "বাংলা"],
  ];
  return <>
    <section className="welcome-panel">
      <div className="welcome-copy">
        <span className="eyebrow">Unified citizen service</span>
        <h1>Your health identity.<br />Your claim rights.</h1>
        <p>Use one secure worker ID to access linked ABHA records, Aawaz insurance, treatment referrals and claim updates.</p>
        <div className="language-block">
          <strong>Select your preferred language</strong>
          <div className="language-grid">{languages.map(([code, label]) => <button key={code} className={language === code ? "active" : ""} onClick={() => setLanguage(code)}>{label}</button>)}</div>
        </div>
        <div className="welcome-actions">
          <ActionButton onClick={onNew}><UserPlus size={18} /> Register as a worker</ActionButton>
          <ActionButton secondary onClick={onReturning}><LogIn size={18} /> Sign in</ActionButton>
        </div>
      </div>
      <aside className="service-summary" aria-label="Portal services">
        <div className="summary-title"><ShieldCheck size={24} /><span><strong>Secure linked services</strong><small>One portal, verified records</small></span></div>
        <ServicePoint icon={IdCard} title="Digital worker ID" text="Carry your verified health and insurance identity." />
        <ServicePoint icon={HeartPulse} title="Treatment support" text="Receive the correct referral at registered facilities." />
        <ServicePoint icon={BadgeCheck} title="Claim tracking" text="See each stage and raise a dispute when required." />
        <div className="security-note">Your Aadhaar number is verified securely and is not displayed on this portal.</div>
      </aside>
    </section>
    <section id="services" className="info-strip"><div><strong>ABHA linked</strong><span>National digital health records</span></div><div><strong>Aawaz protected</strong><span>Kerala migrant worker insurance</span></div><div><strong>Claim assistance</strong><span>Transparent status and disputes</span></div></section>
  </>;
}

function ServicePoint({ icon: Icon, title, text }) {
  return <div className="service-point"><span><Icon size={21} /></span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

export function RegistrationScreen({ onSubmit, onBack, loading }) {
  const [aadhaar, setAadhaar] = useState("");
  const [eshram, setEshram] = useState("");
  const [fingerprint, setFingerprint] = useState(false);
  const valid = /^\d{12}$/.test(aadhaar) && eshram.trim().length >= 5 && fingerprint;
  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ aadhaar_number: aadhaar, eshram_id: eshram.trim(), biometric_hash: "demo-biometric-captured" }); };
  return <section className="task-layout">
    <div><PageHeading eyebrow="Worker registration" title="Create your health service ID" description="Complete the three verification steps below. Fields marked * are mandatory." onBack={onBack} />
      <form className="gov-card form-card" onSubmit={submit}>
        <div className="form-section-title"><span>1</span><div><strong>Identity details</strong><small>As shown on your official documents</small></div></div>
        <label className="field"><span>Aadhaar number *</span><input inputMode="numeric" maxLength={12} value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))} placeholder="Enter 12-digit Aadhaar number" /><small>Used only for identity verification.</small></label>
        <label className="field"><span>e-Shram UAN *</span><input value={eshram} onChange={(e) => setEshram(e.target.value)} placeholder="Enter your e-Shram ID" /></label>
        <div className="form-section-title"><span>2</span><div><strong>Biometric consent</strong><small>Confirm your identity using fingerprint</small></div></div>
        <button type="button" className={fingerprint ? "biometric captured" : "biometric"} onClick={() => setFingerprint(true)}><Fingerprint size={28} /><span><strong>{fingerprint ? "Fingerprint captured" : "Capture fingerprint"}</strong><small>{fingerprint ? "Biometric confirmation received" : "Place your finger on the connected scanner"}</small></span>{fingerprint && <BadgeCheck />}</button>
        <label className="consent"><input type="checkbox" checked={fingerprint} readOnly /> I consent to verification of these details for migrant health and insurance services.</label>
        <div className="form-actions"><ActionButton type="submit" loading={loading} disabled={!valid}>Verify and continue</ActionButton></div>
      </form>
    </div>
    <HelpPanel />
  </section>;
}

export function LoginScreen({ onSubmit, onBack, loading }) {
  const [eshram, setEshram] = useState(""); const [otp, setOtp] = useState("");
  const valid = eshram.trim().length >= 5 && otp.length >= 4;
  return <section className="task-layout"><div><PageHeading eyebrow="Secure sign in" title="Access your worker account" description="Enter your e-Shram ID and the OTP sent to your registered mobile number." onBack={onBack} />
    <form className="gov-card form-card" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit({ eshram_id: eshram.trim(), otp }); }}>
      <label className="field"><span>e-Shram UAN *</span><input value={eshram} onChange={(e) => setEshram(e.target.value)} placeholder="Enter your e-Shram ID" /></label>
      <label className="field"><span>One-time password *</span><input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="Enter OTP" /></label>
      <div className="inline-help">Demo OTP: <strong>123456</strong></div>
      <div className="form-actions"><ActionButton type="submit" loading={loading} disabled={!valid}>Sign in securely</ActionButton></div>
    </form></div><HelpPanel /></section>;
}

export function ConfirmationScreen({ worker, onContinue }) {
  return <section className="narrow-page"><PageHeading eyebrow="Registration complete" title="Your identity has been verified" description="Your health and insurance services are now linked." />
    <div className="gov-card success-card"><BadgeCheck size={46} /><h2>Worker ID created successfully</h2><div className="reference-number"><span>Worker ID</span><strong>{worker?.worker_id}</strong></div>
      <dl><div><dt>ABHA health ID</dt><dd>{worker?.abha_id || "Linked"}</dd></div><div><dt>Aawaz insurance</dt><dd>{worker?.aawaz_id || "Linked"}</dd></div></dl>
      <ActionButton onClick={onContinue}>Go to service dashboard</ActionButton></div></section>;
}

export function MessageScreen({ type = "error", title, text, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return <section className="narrow-page"><div className={`gov-card message-card ${type}`}><ShieldCheck size={42} /><h1>{title}</h1><p>{text}</p><div className="form-actions"><ActionButton onClick={onPrimary}>{primaryLabel}</ActionButton>{secondaryLabel && <ActionButton secondary onClick={onSecondary}>{secondaryLabel}</ActionButton>}</div></div></section>;
}

function HelpPanel() { return <aside className="help-panel"><strong>Before you begin</strong><ul><li>Keep your Aadhaar and e-Shram details ready.</li><li>Use the mobile number linked to your records.</li><li>Do not refresh while verification is in progress.</li></ul><div><Phone size={18} /> Need help? Call <b>1800-425-55214</b></div></aside>; }
