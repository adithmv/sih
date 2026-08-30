import { AlertTriangle, BadgeCheck, CalendarDays, ChevronRight, FileText, IndianRupee } from "lucide-react";
import { useState } from "react";
import { ActionButton, PageHeading } from "./GovLayout";

const meta = { Sent: ["Submitted", "blue"], Checking: ["Under review", "amber"], Approved: ["Approved", "green"], Paid: ["Paid", "green"], Rejected: ["Rejected", "red"] };
export function ClaimsScreen({ claims, loading, onBack, onOpen }) {
  return <section><PageHeading eyebrow="Insurance services" title="Your claim history" description="Select a claim to view its current stage and details." onBack={onBack} />
    <div className="gov-card claims-card"><div className="table-heading"><strong>Claims</strong><span>{claims.length} record{claims.length === 1 ? "" : "s"}</span></div>{loading ? <div className="loading-state"><span className="spinner" /> Loading claims…</div> : claims.length === 0 ? <div className="empty-state"><FileText /><h2>No claims found</h2><p>Claims submitted by a facility will appear here.</p></div> : <div className="claims-list">{claims.map((claim) => <button key={claim.claim_id} onClick={() => onOpen(claim)}><span className="claim-icon"><FileText /></span><span className="claim-main"><strong>{claim.claim_id}</strong><small><CalendarDays size={14} /> {formatDate(claim.date || claim.updated_at)}</small></span><span className="claim-amount"><small>Claim amount</small><strong>₹{Number(claim.amount || 0).toLocaleString("en-IN")}</strong></span><Status status={claim.status} /><ChevronRight /></button>)}</div>}</div>
  </section>;
}

export function ClaimDetailScreen({ claim, onBack, onDispute }) {
  const stages = ["Sent", "Checking", "Approved", "Paid"];
  const current = claim.status === "Rejected" ? 1 : Math.max(0, stages.indexOf(claim.status));
  return <section><PageHeading eyebrow="Claim details" title={`Claim ${claim.claim_id}`} description={`Last updated ${formatDate(claim.updated_at)}`} onBack={onBack} />
    <div className="claim-detail-grid"><div className="gov-card detail-main"><div className="detail-summary"><div><span>Current status</span><Status status={claim.status} /></div><div><span>Claim amount</span><strong className="large-amount"><IndianRupee />{Number(claim.amount || 0).toLocaleString("en-IN")}</strong></div></div>
      <h2>Claim progress</h2><div className="progress-steps">{stages.map((stage, index) => <div key={stage} className={index <= current && claim.status !== "Rejected" ? "done" : index === current ? "current" : ""}><i>{index < current ? "✓" : index + 1}</i><span>{meta[stage][0]}</span></div>)}</div>
      {claim.status === "Rejected" && <div className="rejection-box"><AlertTriangle /><div><strong>Reason for rejection</strong><p>{claim.rejection_reason || "The insurer could not approve the submitted claim."}</p></div></div>}
    </div><aside className="gov-card detail-aside"><h2>Available action</h2>{claim.status === "Rejected" ? <><p>If the treatment was genuine or the submitted information was incomplete, request a review.</p><ActionButton onClick={onDispute}>Raise a dispute</ActionButton></> : <><BadgeCheck /><p>No action is required. You will be notified when the claim moves to the next stage.</p></>}</aside></div>
  </section>;
}

export function DisputeScreen({ claim, result, loading, onBack, onSubmit }) {
  const [reason, setReason] = useState("");
  if (result) return <section className="narrow-page"><div className="gov-card success-card"><BadgeCheck size={48} /><h1>Dispute submitted</h1><p>Your request has been sent for review.</p><div className="reference-number"><span>Reference number</span><strong>{result.dispute_id}</strong></div><ActionButton onClick={onBack}>Return to claim</ActionButton></div></section>;
  return <section className="narrow-page"><PageHeading eyebrow="Grievance service" title="Request a claim review" description={`You are raising a dispute for ${claim.claim_id}.`} onBack={onBack} /><form className="gov-card form-card" onSubmit={(e) => { e.preventDefault(); if (reason.trim().length >= 10) onSubmit(reason.trim()); }}><div className="rejection-box"><AlertTriangle /><div><strong>Rejected claim</strong><p>{claim.rejection_reason}</p></div></div><label className="field"><span>Explain why this claim should be reviewed *</span><textarea rows={6} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe what happened and identify any information that should be checked again." /><small>Minimum 10 characters. Do not include OTPs or full Aadhaar numbers.</small></label><div className="form-actions"><ActionButton type="submit" loading={loading} disabled={reason.trim().length < 10}>Submit dispute</ActionButton></div></form></section>;
}

function Status({ status }) { const [label, tone] = meta[status] || [status, "blue"]; return <span className={`status-pill ${tone}`}>{label}</span>; }
function formatDate(value) { if (!value) return "Date unavailable"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
