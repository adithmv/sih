"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Fingerprint, ShieldCheck, MapPin, Bell, FileText, HeartPulse,
  AlertTriangle, ChevronRight, Check, X, Globe,
  IndianRupee, RefreshCw, Settings2, QrCode, ArrowLeft, Phone,
  Send, Loader2, BadgeCheck, Navigation
} from "lucide-react";
import { makeMockApi, PseudoQR } from "./mockApi"; // Importing from our separate API file

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
`;

const STATUS_ORDER = ["Sent", "Checking", "Approved", "Paid"];
const STATUS_META: Record<string, { color: string; label: string }> = {
  Sent: { color: "var(--mh-ink-muted)", label: "Sent to insurer" },
  Checking: { color: "var(--mh-accent)", label: "Under review" },
  Approved: { color: "var(--mh-primary)", label: "Approved" },
  Paid: { color: "var(--mh-primary-deep)", label: "Paid out" },
  Rejected: { color: "var(--mh-danger)", label: "Rejected" },
};

function StatusTracker({ status }: { status: string }) {
  if (status === "Rejected") {
    return (
      <div className="flex items-center gap-2 text-[var(--mh-danger)] font-semibold text-xs">
        <X size={16} /> Claim rejected
      </div>
    );
  }
  const activeIdx = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center w-full">
      {STATUS_ORDER.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center flex-initial">
            <div className="width-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                 style={{
                   border: `2px ${i <= activeIdx ? "solid" : "dashed"} ${i <= activeIdx ? "var(--mh-primary)" : "var(--mh-border)"}`,
                   background: i <= activeIdx ? "var(--mh-primary)" : "transparent",
                   color: i <= activeIdx ? "#fff" : "var(--mh-ink-muted)"
                 }}>
              {i < activeIdx ? <Check size={13} /> : <span className="font-mono text-[10px]">{i + 1}</span>}
            </div>
            <div className={`text-[10px] mt-1 text-center w-14 font-medium ${i === activeIdx ? "font-bold" : ""}`}
                 style={{ color: i <= activeIdx ? "var(--mh-ink)" : "var(--mh-ink-muted)" }}>{s}</div>
          </div>
          {i < STATUS_ORDER.length - 1 && (
            <div className="flex-1 h-0.5 mb-4" style={{ background: i < activeIdx ? "var(--mh-primary)" : "var(--mh-border)" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, loading, style }: any) {
  return (
    <button disabled={disabled || loading} onClick={onClick} className="w-full p-3.5 rounded-xl border-none text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-transform duration-75 active:scale-98 shadow-md"
      style={{ background: disabled ? "#B9C4BE" : "var(--mh-primary)", ...style }}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, style, icon: Icon }: any) {
  return (
    <button onClick={onClick} className="w-full p-3 rounded-xl text-[var(--mh-ink)] bg-[var(--mh-surface)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer" style={{ border: "1.5px solid var(--mh-border)", ...style }}>
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

function TextField({ label, value, onChange, placeholder, mono, maxLength, inputMode }: any) {
  return (
    <label className="block mb-4">
      <div className="text-xs font-bold text-[var(--mh-ink-muted)] uppercase tracking-wide mb-1.5">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode}
        className={`w-full p-3 rounded-lg border text-sm bg-[var(--mh-surface)] text-[var(--mh-ink)] outline-none ${mono ? "font-mono" : ""}`} style={{ border: "1.5px solid var(--mh-border)" }} />
    </label>
  );
}

export default function MigrantHealthApp() {
  const [screen, setScreen] = useState("splash");
  const [language, setLanguage] = useState("en");
  const [worker, setWorker] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [activeClaim, setActiveClaim] = useState<any>(null);
  const [pendingTreatment, setPendingTreatment] = useState<any>(null);
  const [disputeResult, setDisputeResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [demo, setDemo] = useState({ identityVerified: true, loginValid: true, clinicAbha: false, claimStatus: "Checking" as any });

  const api = useRef(makeMockApi(demo));
  useEffect(() => { api.current = makeMockApi(demo); }, [demo]);

  const handleRegisterSubmit = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.current.register(payload);
      setWorker({ ...res, name: "Ramesh Kumar", language });
      setScreen("confirm");
    } catch {
      setScreen("reg-error");
    } finally { setLoading(false); }
  };

  const handleLoginSubmit = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.current.login(payload);
      const w = await api.current.getWorker(res.worker_id);
      setWorker({ ...w, abha_id: "12-3456-7890-1234", aawaz_id: "AWZ-KL-88213", token: res.token });
      setScreen("home");
    } catch {
      setScreen("login-error");
    } finally { setLoading(false); }
  };

  const openClaimStatus = async () => {
    setScreen("claims");
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

  const openClaimDetail = async (claim: any) => {
    setLoading(true);
    const res = await api.current.getClaimStatus(claim.claim_id, claim.status, claim.amount);
    setActiveClaim(res);
    setLoading(false);
    setScreen("claim-detail");
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
      setScreen("redirect");
    } else {
      setPendingTreatment({ claim_id: res.claim_id });
      openClaimStatus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <style>{TOKENS}</style>
      
      {/* Smartphone Display Case wrapper */}
      <div className="relative">
        <div className="w-[340px] h-[640px] bg-[var(--mh-paper)] border-[8px] border-[#16211C] rounded-[36px] shadow-2xl overflow-hidden relative">
          
          {/* Main conditional flow rendering panel based on layout file graph */}
          {screen === "splash" && (
            <div className="h-full flex flex-col justify-between p-6 bg-[var(--mh-primary-deep)] text-white text-center">
              <div className="my-auto space-y-3">
                <div className="w-14 h-14 bg-[var(--mh-primary)] rounded-xl mx-auto flex items-center justify-center border border-white/20"><HeartPulse size={28} className="text-[var(--mh-accent-soft)]" /></div>
                <h2 className="text-xl font-bold">Aawaz Swasthya</h2>
                <p className="font-mono text-[10px] opacity-70 tracking-widest">SIH25083 · INTEGRATED APP</p>
              </div>
              <div className="space-y-2 mt-auto">
                <PrimaryButton style={{ background: "var(--mh-accent)" }} onClick={() => setScreen("register")}>New Registration</PrimaryButton>
                <SecondaryButton style={{ background: "transparent", color: "#fff", border: "1.5px solid white/30" }} onClick={() => setScreen("login")}>I have an ID</SecondaryButton>
              </div>
            </div>
          )}

          {screen === "register" && (
            <div className="h-full flex flex-col justify-between p-4">
              <div className="flex items-center gap-2 border-b pb-2 mb-3">
                <button onClick={() => setScreen("splash")} className="p-1 rounded bg-[var(--mh-primary-soft)]"><ArrowLeft size={16} /></button>
                <span className="font-bold text-sm">Register Member</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TextField label="Aadhaar Number" placeholder="12-digit configuration parameter" mono maxLength={12} onChange={(val: string) => {}} />
                <TextField label="e-Shram Identification ID" placeholder="ES-XX-000000" mono onChange={(val: string) => {}} />
                <button onClick={() => alert("Biometric hash simulation parameters passed successfully.")} className="w-full p-4 border border-dashed border-[var(--mh-border)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-white"><Fingerprint size={16} /> Capture Thumb Scan</button>
              </div>
