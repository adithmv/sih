import { Activity, ArrowRight, FileClock, HeartPulse, Hospital, IdCard, MapPin, QrCode, ShieldCheck } from "lucide-react";
import { ActionButton, PageHeading } from "./GovLayout";

export function DashboardScreen({ worker, onDigitalId, onClaims }) {
  return <>
    <div className="dashboard-heading"><div><span className="eyebrow">Citizen dashboard</span><h1>Welcome{worker?.name ? `, ${worker.name}` : ""}</h1><p>Access your linked health identity and insurance services.</p></div><div className="worker-chip"><span>Worker ID</span><strong>{worker?.worker_id}</strong><small>Verified account</small></div></div>
    <section className="dashboard-grid">
      <div className="services-column"><h2>Citizen services</h2><div className="service-cards">
        <ServiceCard icon={IdCard} title="Digital health ID" text="View the QR identity accepted by registered clinics." onClick={onDigitalId} featured />
        <ServiceCard icon={FileClock} title="Track insurance claims" text="Check processing status, payments and rejection details." onClick={onClaims} />
        <ServiceCard icon={HeartPulse} title="Health records" text="Your linked ABHA treatment history." disabled />
        <ServiceCard icon={Hospital} title="Find a facility" text="Locate participating clinics and government hospitals." disabled />
      </div></div>
      <aside className="dashboard-aside"><div className="gov-card coverage-card"><div className="card-title"><ShieldCheck size={21} /><strong>Coverage status</strong></div><StatusRow label="ABHA health ID" value={worker?.abha_id || "Linked"} /><StatusRow label="Aawaz insurance" value={worker?.aawaz_id || "Active"} /><StatusRow label="Account verification" value="Verified" /></div>
      <div className="notice-card"><strong>Important</strong><p>Show your digital ID before treatment begins so the facility can create the correct claim record.</p></div></aside>
    </section>
  </>;
}

function ServiceCard({ icon: Icon, title, text, onClick, featured, disabled }) { return <button className={`service-card ${featured ? "featured" : ""}`} onClick={onClick} disabled={disabled}><span className="service-icon"><Icon size={25} /></span><span><strong>{title}</strong><small>{text}</small>{disabled && <em>Coming soon</em>}</span>{!disabled && <ArrowRight size={20} />}</button>; }
function StatusRow({ label, value }) { return <div className="status-row"><span>{label}</span><strong><span className="status-dot" />{value}</strong></div>; }

export function DigitalIdScreen({ worker, onBack, onScan, loading }) {
  return <section><PageHeading eyebrow="Digital identity" title="Worker health service ID" description="Present this QR code at a participating clinic before receiving treatment." onBack={onBack} />
    <div className="identity-layout"><div className="digital-id-card"><div className="id-card-head"><ShieldCheck /><div><span>Government of Kerala</span><strong>Migrant Health Service ID</strong></div></div><div className="id-card-body"><PseudoQR payload={worker?.qr_payload || worker?.worker_id || "worker"} /><div className="id-details"><span>Worker ID</span><strong>{worker?.worker_id}</strong><span>ABHA ID</span><b>{worker?.abha_id || "Linked"}</b><span>Aawaz ID</span><b>{worker?.aawaz_id || "Linked"}</b></div></div><div className="id-card-foot">Digitally verified • Valid across participating facilities</div></div>
    <aside className="gov-card scan-panel"><Activity size={26} /><h2>Clinic demonstration</h2><p>Simulate a clinic scanning this identity and submitting a treatment event.</p><ActionButton loading={loading} onClick={onScan}><QrCode size={18} /> Simulate clinic scan</ActionButton></aside></div>
  </section>;
}

function PseudoQR({ payload }) { let seed = [...payload].reduce((sum, c) => sum + c.charCodeAt(0), 0); const cells = Array.from({ length: 225 }, (_, i) => ((i * 17 + seed * 7) % 11) > 4); return <div className="qr-grid" aria-label="Digital identity QR code">{cells.map((filled, i) => <i key={i} className={filled ? "filled" : ""} />)}</div>; }

export function ReferralScreen({ hospital, onVerify, loading, onBack }) {
  return <section><PageHeading eyebrow="Treatment referral" title="Doctor verification is required" description="This clinic is not ABHA registered. Visit the government facility below to verify the treatment record." onBack={onBack} />
    <div className="referral-layout"><div className="gov-card referral-card"><div className="referral-badge"><Hospital /></div><span>Nearest government facility</span><h2>{hospital?.name || "Government Taluk Hospital, Kochi"}</h2><p><MapPin size={18} /> Government hospital referral desk</p><div className="route-placeholder"><MapPin /><span>Directions will open in your maps application</span></div></div><aside className="gov-card verification-panel"><h2>At the hospital</h2><ol><li>Show your digital worker ID.</li><li>Ask the doctor to review the treatment event.</li><li>The verified claim will be sent for checking.</li></ol><ActionButton loading={loading} onClick={onVerify}>Simulate doctor verification</ActionButton></aside></div>
  </section>;
}
