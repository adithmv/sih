"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Fingerprint, ShieldCheck, MapPin, Bell, FileText, HeartPulse,
  AlertTriangle, ChevronRight, Check, X, Globe,
  IndianRupee, RefreshCw, Settings2, QrCode, ArrowLeft, Phone,
  Send, Loader2, BadgeCheck, Navigation
} from "lucide-react";
import { makeMockApi, PseudoQR } from "./mockApi"; // Importing directly from our separate API file

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
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 text-xs text-white"
                 style={{
                   border: `2px ${i <= activeIdx ? "solid" : "dashed"} ${i <= activeIdx ? "var(--mh-primary)" : "var(--mh-border)"}`,
                   background: i <= activeIdx ? "var(--mh-primary)" : "transparent",
                   color: i <= activeIdx ? "#fff" : "var(--mh-ink-muted)"
                 }}>
              {i < activeIdx ? <Check size={13} /> : <span className="font-mono text-[10px]">{i + 1}</span>}
            </div>
            <div className="text-[10px] mt-1 text-center w-14 font-medium"
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

// Global Custom Text Field Utility Component
function TextField({ label, placeholder, mono, maxLength }: any) {
  return (
    <label className="block mb-4">
      <div className="text-xs font-bold text-[var(--mh-ink-muted)] uppercase tracking-wide mb-1.5">{label}</div>
      <input placeholder={placeholder} maxLength={maxLength}
        className={`w-full p-3 rounded-lg border text-sm bg-[var(--mh-surface)] text-[var(--mh-ink)] outline-none ${mono ? "font-mono" : ""}`} style={{ border: "1.5px solid var(--mh-border)" }} />
    </label>
  );
}

function SecondaryButton({ children, onClick, style, icon: Icon }: any) {
  return (
    <button onClick={onClick} className="w-full p-3 rounded-xl text-[var(--mh-ink)] bg-[var(--mh-surface)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer text-center" style={{ border: "1.5px solid var(--mh-border)", ...style }}>
      {Icon ? <Icon size={16} /> : null}
      <span className="mx-auto">{children}</span>
    </button>
  );
}

export default function MigrantHealthApp() {
  const [screen, setScreen] = useState("splash");
  const [language] = useState("en");
  const [worker, setWorker] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [activeClaim, setActiveClaim] = useState<any>(null);
  const [pendingTreatment, setPendingTreatment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [demo] = useState({ identityVerified: true, loginValid: true, clinicAbha: false, claimStatus: "Checking" as any });

  const api = useRef(makeMockApi(demo));
  useEffect(() => { api.current = makeMockApi(demo); }, [demo]);

  const handleRegisterSubmit = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.current.register(payload);
      setWorker({ ...res, name: "Ramesh Kumar", language });
      setScreen("confirm");
    } catch {
      alert("Registration failed parameters.");
    } finally { setLoading(false); }
  };

  const handleLoginSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.current.login({ eshram_id: "ES-123", otp: "482913" });
      const w = await api.current.getWorker(res.worker_id);
      setWorker({ ...w, abha_id: "12-3456-7890-1234", aawaz_id: "AWZ-KL-88213", token: res.token });
      setScreen("home");
    } catch {
      alert("Login parameters failed.");
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
    const res = await api.current.getClaims(worker?.worker_id, extra);
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
      worker_id: worker?.worker_id || "WRK-00931", facility_id: "FAC-2291",
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 select-none">
      <style>{TOKENS}</style>
      
      {/* Smartphone Display Case wrapper */}
      <div className="relative">
        <div className="w-[340px] h-[640px] bg-[var(--mh-paper)] border-[8px] border-[#16211C] rounded-[36px] shadow-2xl overflow-hidden relative">
          
          {/* SCREEN: SPLASH */}
          {screen === "splash" && (
            <div className="h-full flex flex-col justify-between p-6 bg-[var(--mh-primary-deep)] text-white text-center">
              <div className="my-auto space-y-3">
                <div className="w-14 h-14 bg-[var(--mh-primary)] rounded-xl mx-auto flex items-center justify-center border border-white/20"><HeartPulse size={28} className="text-[var(--mh-accent-soft)]" /></div>
                <h2 className="text-xl font-bold">Aawaz Swasthya</h2>
                <p className="font-mono text-[10px] opacity-70 tracking-widest">SIH25083 · INTEGRATED APP</p>
              </div>
              <div className="space-y-2 mt-auto">
                <PrimaryButton style={{ background: "var(--mh-accent)" }} onClick={() => setScreen("register")}>New Registration</PrimaryButton>
                <SecondaryButton style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)" }} onClick={handleLoginSubmit}>I have an ID</SecondaryButton>
              </div>
            </div>
          )}

          {screen === "register" && (
            <div className="h-full flex flex-col justify-between p-4 bg-[var(--mh-paper)]">
              <div className="flex items-center gap-2 border-b pb-2 mb-3">
                <button onClick={() => setScreen("splash")} className="p-1 rounded bg-[var(--mh-primary-soft)]"><ArrowLeft size={16} /></button>
                <span className="font-bold text-sm">Register Member</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TextField label="Aadhaar Number" placeholder="12-digit number" mono maxLength={12} />
                <TextField label="e-Shram ID" placeholder="ES-XX-000000" mono />
                <button type="button" onClick={() => alert('Biometric hash parameters locked successfully.')} className="w-full p-4 border border-dashed border-[var(--mh-border)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-white"><Fingerprint size={16} /> Capture Thumb Scan</button>
              </div>
              <PrimaryButton onClick={() => handleRegisterSubmit({aadhaar_number: "123456789012"})} disabled={loading}>Submit Parameters</PrimaryButton>
            </div>
          )}

          {screen === "confirm" && (
            <div className="h-full flex flex-col justify-between p-5 text-center bg-[var(--mh-paper)]">
              <div className="space-y-4 my-auto">
                <div className="w-10 h-10 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-emerald-600 border border-emerald-100"><Check size={20} /></div>
                <h4 className="font-bold text-sm">Identity Matrix Sync Success</h4>
                <p className="text-xs text-[var(--mh-ink-muted)]">Your identity has been verified and synchronized with the national registry.</p>
              </div>
              <PrimaryButton onClick={() => setScreen("home")}>Generate Passbook ID</PrimaryButton>
            </div>
          )}

          {/* SCREEN: HOME DASHBOARD */}
          {screen === "home" && (
            <div className="h-full flex flex-col p-4 bg-white">
              <div className="bg-[#0A4F38] text-white p-4 rounded-2xl mb-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold opacity-70 tracking-wider">Welcome back,</p>
                <h4 className="font-bold text-base">{worker?.name || "Ramesh Kumar"}</h4>
                <span className="font-mono text-[9px] opacity-50 block mt-1">UUID: {worker?.worker_id || "WRK-00931"}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 flex-1 items-start content-start">
                <button onClick={() => setScreen("qr")} className="bg-slate-50 border rounded-xl p-4 flex flex-col items-start justify-between h-24 shadow-2xs text-left hover:bg-slate-100 transition-colors">
                  <QrCode size={20} className="text-[#0F6E4F]" />
                  <span className="text-xs font-bold text-slate-700">My Digital ID</span>
                </button>
                <button onClick={openClaimStatus} className="bg-slate-50 border rounded-xl p-4 flex flex-col items-start justify-between h-24 shadow-2xs text-left hover:bg-slate-100 transition-colors">
                  <FileText size={20} className="text-[#0F6E4F]" />
                  <span className="text-xs font-bold text-slate-700">Claim History</span>
                </button>
              </div>

              <button onClick={() => setScreen("splash")} className="text-center text-slate-400 hover:text-slate-600 text-[10px] font-medium underline mt-auto">Logout Session</button>
            </div>
          )}

          {/* SCREEN: QR DIGITAL PASSBOOK CARD */}
          {screen === "qr" && (
            <div className="h-full flex flex-col justify-between p-4 text-center bg-white">
              <div className="flex items-center gap-2 border-b pb-2 mb-4">
                <button onClick={() => setScreen("home")} className="p-1 rounded bg-slate-100 hover:bg-slate-200"><ArrowLeft size={16} /></button>
                <span className="font-bold text-sm text-slate-800">Passbook Digital ID</span>
              </div>
              <div className="my-auto space-y-4">
                <PseudoQR payload={worker?.qr_payload || "WRK-00931|12-3456-7890-1234|AWZ-KL-88213"} size={140} />
                <h4 className="font-bold text-sm text-slate-800">{worker?.name || "Ramesh Kumar"}</h4>
              </div>
              <PrimaryButton style={{ background: "var(--mh-accent)" }} onClick={handleScan}>Simulate Clinic QR Scan</PrimaryButton>
            </div>
          )}

          {/* SCREEN: FACILITY REDIRECT WARNING */}
          {screen === "redirect" && (
            <div className="h-full flex flex-col justify-between p-5 text-center bg-white">
              <div className="space-y-4 my-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-full mx-auto flex items-center justify-center text-amber-600 border border-amber-200"><MapPin size={22} /></div>
                <h4 className="font-bold text-sm text-slate-800">Facility Unregistered Notice</h4>
                <div className="bg-slate-50 border rounded-xl p-3 text-xs text-left font-medium text-slate-600 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Assigned Verification Point:</p>
                  <p className="font-bold text-slate-800">{pendingTreatment?.hospital?.name || "Govt. Taluk Hospital, Kochi"}</p>
                </div>
              </div>
              <PrimaryButton onClick={() => setScreen("home")}>Return Dashboard</PrimaryButton>
            </div>
          )}

          {/* SCREEN: CLAIMS LEDGER RECORDS HISTORY */}
          {screen === "claims" && (
            <div className="h-full flex flex-col p-4 bg-white">
              <div className="flex items-center gap-2 border-b pb-2 mb-3">
                <button onClick={() => setScreen("home")} className="p-1 rounded bg-slate-100 hover:bg-slate-200"><ArrowLeft size={16} /></button>
                <span className="font-bold text-sm text-slate-800">Claims Ledger Logs</span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                {claims.map((c) => (
                  <button key={c.claim_id} onClick={() => openClaimDetail(c)} className="w-full text-left p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 block hover:bg-slate-100 transition-colors focus:outline-none">
                    <div className="flex justify-between font-mono font-bold text-xs text-slate-800">
                      <span>{c.claim_id}</span>
                      <span>₹{c.amount}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      <span>Status: {c.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN: STEP LIFE CYCLE CLAIM DETAIL TRACKER */}
          {screen === "claim-detail" && (
            <div className="h-full flex flex-col justify-between p-4 bg-white">
              <div className="flex items-center gap-2 border-b pb-2 mb-4">
                <button onClick={() => setScreen("claims")} className="p-1 rounded bg-slate-100 hover:bg-slate-200"><ArrowLeft size={16} /></button>
                <span className="font-bold text-sm text-slate-800">Claim Tracker View</span>
              </div>
              <div className="flex-1 space-y-4 pt-4">
                <StatusTracker status={activeClaim?.status || "Checking"} />
              </div>
              {activeClaim?.status === "Rejected" && (
                <PrimaryButton style={{ background: "var(--mh-danger)" }} onClick={() => setScreen("dispute")}>Raise Formal Dispute</PrimaryButton>
              )}
            </div>
          )}

          {/* SCREEN: FORMAL DISPUTE ACTION DRAWER SUBMISSION */}
          {screen === "dispute" && (
            <div className="h-full flex flex-col justify-between p-4 bg-white">
              <div className="flex items-center gap-2 border-b pb-2 mb-4">
                <button onClick={() => setScreen("claim-detail")} className="p-1 rounded bg-slate-100 hover:bg-slate-200"><ArrowLeft size={16} /></button>
                <span className="font-bold text-sm text-slate-800">File Disputed Package</span>
              </div>
              <div className="flex-1">
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Provide Auditing Justification (Section 8)</label>
                <textarea placeholder="State justification details parameter..." className="w-full border p-3 rounded-xl bg-slate-50 text-xs h-28 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700" />
              </div>
              <PrimaryButton onClick={() => { alert("Dispute filed! State set under_review."); setScreen("home"); }}>Submit Registry Box</PrimaryButton>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
