"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Fingerprint, ShieldCheck, MapPin, Bell, FileText, Stethoscope,
  AlertTriangle, ChevronRight, Check, X, Globe,
  IndianRupee, RefreshCw, Settings2, QrCode, ArrowLeft, Phone,
  Send, Loader2, BadgeCheck, HeartPulse, Navigation
} from "lucide-react";
import "./migrant-health.css";


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

const STATUS_META = {
  Sent: { color: "var(--mh-ink-muted)", label: "Sent to insurer" },
  Checking: { color: "var(--mh-accent)", label: "Under review" },
  Approved: { color: "var(--mh-primary)", label: "Approved" },
  Paid: { color: "var(--mh-primary-deep)", label: "Paid out" },
  Rejected: { color: "var(--mh-danger)", label: "Rejected" },
};
const STATUS_ORDER = ["Sent", "Checking", "Approved", "Paid"];

function StatusTracker({ status }) {
  if (status === "Rejected") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, color: "var(--mh-danger)",
        fontFamily: "var(--mh-font-sans)", fontWeight: 600, fontSize: 13,
      }}>
        <X size={16} /> Claim rejected
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
            }}>{s}</div>
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
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ml", label: "മലയാളം" },
  { code: "bn", label: "বাংলা" },
];

function Splash({ language, setLanguage, onNew, onReturning }) {
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
            SIH25083 · MIGRANT HEALTH &amp; CLAIM ID
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={13} /> Choose your language
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
          I'm new here <ChevronRight size={16} />
        </PrimaryButton>
        <SecondaryButton onClick={onReturning} style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff" }}>
          I already have an ID
        </SecondaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 2 — Registration
   ============================================================ */
function Registration({ onVerified, onFailed, onBack, loading }) {
  const [aadhaar, setAadhaar] = useState("");
  const [eshram, setEshram] = useState("");
  const [bio, setBio] = useState(false);

  const canSubmit = aadhaar.length === 12 && eshram.length >= 6 && bio;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Register" onBack={onBack} />
      <div style={{ padding: 22, flex: 1, overflowY: "auto" }}>
        <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", marginTop: 0, marginBottom: 22 }}>
          We link your Aadhaar and e-Shram records once — after that, your digital ID works at any registered clinic.
        </p>
        <TextField label="Aadhaar number" value={aadhaar} onChange={setAadhaar} placeholder="12-digit number" mono maxLength={12} inputMode="numeric" />
        <TextField label="e-Shram ID" value={eshram} onChange={setEshram} placeholder="ES-XX-000000" mono maxLength={14} />
        <button onClick={() => setBio(true)} style={{
          width: "100%", padding: "16px", borderRadius: 12, marginBottom: 8,
          border: bio ? "1.5px solid var(--mh-primary)" : "1.5px dashed var(--mh-border)",
          background: bio ? "var(--mh-primary-soft)" : "var(--mh-surface)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          color: bio ? "var(--mh-primary-deep)" : "var(--mh-ink-muted)", cursor: "pointer",
          fontFamily: "var(--mh-font-sans)", fontWeight: 600, fontSize: 14,
        }}>
          <Fingerprint size={18} /> {bio ? "Fingerprint captured" : "Capture fingerprint"}
        </button>
      </div>
      <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
        <PrimaryButton disabled={!canSubmit} loading={loading} onClick={() => {
          onVerified({ aadhaar_number: aadhaar, eshram_id: eshram, biometric_hash: "base64_demo_hash" });
        }}>
          Verify &amp; continue
        </PrimaryButton>
      </div>
    </div>
  );
}

/* PAGE 2a — Registration error */
function RegistrationError({ onRetry, onContactWorker }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: "var(--mh-danger-soft)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
      }}>
        <AlertTriangle size={28} color="var(--mh-danger)" />
      </div>
      <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, color: "var(--mh-ink)", marginBottom: 8 }}>
        We couldn't verify that
      </div>
      <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", maxWidth: 260, marginBottom: 28 }}>
        Your Aadhaar and e-Shram details didn't match. Check the numbers and try again, or ask your Link Worker for help.
      </p>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onRetry}><RefreshCw size={15} /> Retry</PrimaryButton>
        <SecondaryButton onClick={onContactWorker} icon={Phone}>Contact Link Worker</SecondaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 3 — ID Confirmation
   ============================================================ */
function IdConfirmation({ worker, onGenerate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <Stamp><BadgeCheck size={12} /> Identity verified</Stamp>
      </div>
      <div style={{
        background: "var(--mh-surface)", border: "1.5px solid var(--mh-border)", borderRadius: 16,
        padding: 20, marginBottom: 16,
      }}>
        <Row icon={ShieldCheck} label="ABHA health ID" value={worker.abha_id} sub="Auto-linked" />
        <Row icon={HeartPulse} label="Aawaz insurance" value={worker.aawaz_id} sub="Linked" last />
      </div>
      <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", flex: 1 }}>
        Your worker ID <span style={{ fontFamily: "var(--mh-font-mono)", color: "var(--mh-ink)" }}>{worker.worker_id}</span> now
        carries your health record and insurance link everywhere you go for work.
      </p>
      <PrimaryButton onClick={onGenerate}>Generate my ID <ChevronRight size={16} /></PrimaryButton>
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
function Login({ onLoggedIn, onFail, onBack, loading }) {
  const [eshram, setEshram] = useState("ES-KL-004521");
  const [otp, setOtp] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Log in" onBack={onBack} />
      <div style={{ padding: 22, flex: 1 }}>
        <TextField label="e-Shram ID" value={eshram} onChange={setEshram} mono />
        <TextField label="OTP" value={otp} onChange={setOtp} placeholder="6-digit code" mono maxLength={6} inputMode="numeric" />
        <SecondaryButton icon={Fingerprint} onClick={() => {}}>Use fingerprint instead</SecondaryButton>
      </div>
      <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
        <PrimaryButton disabled={otp.length < 4} loading={loading} onClick={() => {
          onLoggedIn({ eshram_id: eshram, otp });
        }}>Log in</PrimaryButton>
      </div>
    </div>
  );
}

function LoginError({ onResend, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--mh-danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <X size={28} color="var(--mh-danger)" />
      </div>
      <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Incorrect OTP</div>
      <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", maxWidth: 250, marginBottom: 28 }}>
        That code didn't match. Request a new one and try again.
      </p>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onResend}><Send size={15} /> Resend OTP</PrimaryButton>
        <SecondaryButton onClick={onBack}>Back</SecondaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 4 — Home
   ============================================================ */
function HomeScreen({ worker, onDigitalId, onClaimStatus }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "22px 20px 18px", background: "var(--mh-primary-deep)", color: "#fff", borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.75, fontFamily: "var(--mh-font-sans)" }}>Namaste,</div>
            <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 20 }}>{worker.name}</div>
          </div>
          <button aria-label="Notifications" style={{ background: "rgba(255,255,255,0.14)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
            <Bell size={16} />
          </button>
        </div>
        <div style={{ marginTop: 14, fontFamily: "var(--mh-font-mono)", fontSize: 11, opacity: 0.65, letterSpacing: "0.04em" }}>{worker.worker_id}</div>
      </div>

      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
        <Tile icon={QrCode} label="My Digital ID" onClick={onDigitalId} featured />
        <Tile icon={FileText} label="Claim Status" onClick={onClaimStatus} />
        <Tile icon={HeartPulse} label="Health Records" onClick={() => {}} />
        <Tile icon={Bell} label="Notifications" onClick={() => {}} />
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
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="My Digital ID" onBack={onBack} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "var(--mh-surface)", border: "1.5px solid var(--mh-border)", borderRadius: 20, padding: 18, marginBottom: 20 }}>
          <PseudoQR payload={worker.qr_payload} />
        </div>
        <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, color: "var(--mh-ink)" }}>{worker.name}</div>
        <div style={{ fontFamily: "var(--mh-font-mono)", fontSize: 12, color: "var(--mh-ink-muted)", marginTop: 4 }}>{worker.worker_id}</div>
        <div style={{ marginTop: 16 }}>
          <Stamp>Show this at the clinic</Stamp>
        </div>
      </div>
      <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
        <PrimaryButton loading={scanning} onClick={onScanned} style={{ background: "var(--mh-accent)", boxShadow: "0 6px 16px -6px rgba(201,138,43,0.6)" }}>
          <Stethoscope size={16} /> Simulate clinic scan
        </PrimaryButton>
      </div>
    </div>
  );
}

/* PAGE 5a — Redirect notice */
function RedirectNotice({ hospital, onDoctorVerify, verifying }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--mh-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <MapPin size={26} color="var(--mh-accent)" />
        </div>
        <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, color: "var(--mh-ink)" }}>
          This clinic isn't ABHA-registered
        </div>
        <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", marginTop: 8 }}>
          Please visit the nearest government hospital so a doctor can verify and digitally sign your treatment record.
        </p>
      </div>
      <div style={{ background: "var(--mh-surface)", border: "1.5px solid var(--mh-border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--mh-ink-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 6 }}>Nearest govt. hospital</div>
        <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 600, fontSize: 15, color: "var(--mh-ink)" }}>{hospital.name}</div>
        <div style={{ fontFamily: "var(--mh-font-mono)", fontSize: 11, color: "var(--mh-ink-muted)", marginTop: 4 }}>{hospital.lat.toFixed(4)}, {hospital.lng.toFixed(4)}</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SecondaryButton icon={Navigation}>Map &amp; directions</SecondaryButton>
        <PrimaryButton loading={verifying} onClick={onDoctorVerify}>Simulate doctor verification</PrimaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE 6 — Claim status
   ============================================================ */
function ClaimStatusScreen({ claims, onBack, onOpenClaim, loading, demo, setDemo, onRefresh }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Claim Status" onBack={onBack} />
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
                borderRadius: 999, color: "#fff", background: STATUS_META[c.status]?.color,
              }}>{c.status}</span>
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
  const meta = STATUS_META[claim.status];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Claim detail" onBack={onBack} />
      <div style={{ padding: 22, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--mh-font-mono)", fontSize: 14, color: "var(--mh-ink-muted)" }}>{claim.claim_id}</span>
          <span style={{ display: "flex", alignItems: "center", fontFamily: "var(--mh-font-mono)", fontWeight: 700, fontSize: 22, color: "var(--mh-ink)" }}>
            <IndianRupee size={16} />{claim.amount}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--mh-ink-muted)", marginBottom: 26, fontFamily: "var(--mh-font-sans)" }}>
          Updated {new Date(claim.updated_at || claim.date).toLocaleString("en-IN")}
        </div>

        <div style={{ background: "var(--mh-surface)", border: "1.5px solid var(--mh-border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <StatusTracker status={claim.status} />
        </div>

        {claim.status === "Rejected" ? (
          <div style={{ background: "var(--mh-danger-soft)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--mh-danger)", fontSize: 13, marginBottom: 6, fontFamily: "var(--mh-font-sans)" }}>
              <AlertTriangle size={15} /> Reason for rejection
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--mh-ink)", fontFamily: "var(--mh-font-sans)" }}>{claim.rejection_reason}</p>
          </div>
        ) : claim.status === "Paid" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--mh-primary-deep)", fontFamily: "var(--mh-font-sans)", fontSize: 13, fontWeight: 600 }}>
            <Check size={16} /> Amount credited to your linked account
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--mh-ink-muted)", fontFamily: "var(--mh-font-sans)" }}>
            {meta?.label} — we'll notify you when this moves to the next stage.
          </div>
        )}
      </div>
      {claim.status === "Rejected" && (
        <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
          <PrimaryButton onClick={onRaiseDispute} style={{ background: "var(--mh-danger)" }}>Raise dispute</PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* PAGE 6a — Rejection / dispute */
function DisputeScreen({ claim, onBack, onSubmit, submitting, result }) {
  const [reason, setReason] = useState("");
  if (result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--mh-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Check size={28} color="var(--mh-primary-deep)" />
        </div>
        <div style={{ fontFamily: "var(--mh-font-sans)", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Dispute filed</div>
        <p style={{ fontFamily: "var(--mh-font-sans)", fontSize: 13, color: "var(--mh-ink-muted)", marginBottom: 6 }}>
          Reference <span style={{ fontFamily: "var(--mh-font-mono)" }}>{result.dispute_id}</span>
        </p>
        <Stamp>{result.status.replace("_", " ")}</Stamp>
        <div style={{ marginTop: 30, width: "100%" }}>
          <PrimaryButton onClick={onBack}>Back to claim</PrimaryButton>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Raise a dispute" onBack={onBack} />
      <div style={{ padding: 22, flex: 1 }}>
        <div style={{ background: "var(--mh-danger-soft)", borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 12, color: "var(--mh-danger)", fontFamily: "var(--mh-font-sans)" }}>
          Claim {claim.claim_id} was rejected: {claim.rejection_reason}
        </div>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mh-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Tell us what happened
          </div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={5} placeholder="Treatment was genuine, please recheck..." style={{
            width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 12,
            border: "1.5px solid var(--mh-border)", fontFamily: "var(--mh-font-sans)", fontSize: 14, resize: "none",
          }} />
        </label>
      </div>
      <div style={{ padding: 20, borderTop: "1px solid var(--mh-border)" }}>
        <PrimaryButton disabled={reason.trim().length < 6} loading={submitting} onClick={() => onSubmit(reason)}>Submit dispute</PrimaryButton>
      </div>
    </div>
  );
}

/* ============================================================
   Demo controls drawer — lets a reviewer force each branch
   point in the flowchart so every screen can be reached.
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
   ROOT APP — screen state machine mirrors the flowchart edges
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 640, fontFamily: "var(--mh-font-sans)" }}>

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
  );
}