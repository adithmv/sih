import {
  ArrowRight,
  BadgeCheck,
  FileClock,
  HeartPulse,
  Hospital,
  IdCard,
  MapPin,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { defaultFacilityId, facilities } from "@/lib/facilities";
import { ActionButton, PageHeading } from "./GovLayout";

export function DashboardScreen({ worker, onDigitalId, onClaims }) {
  const { t } = useI18n();
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">{t("dashboard")}</span>
          <h1>{t("welcome")}</h1>
          <p>{t("dashboardDesc")}</p>
        </div>
        <div className="worker-chip">
          <span>{t("workerId")}</span>
          <strong>{worker?.worker_id}</strong>
          <small>✓ {t("verifiedAccount")}</small>
        </div>
      </div>
      <section className="dashboard-grid">
        <div className="services-column">
          <h2>{t("citizenServices")}</h2>
          <div className="service-cards">
            <ServiceCard
              icon={IdCard}
              title={t("showId")}
              text={t("showIdText")}
              onClick={onDigitalId}
              featured
            />
            <ServiceCard
              icon={FileClock}
              title={t("trackClaims")}
              text={t("trackClaimsText")}
              onClick={onClaims}
            />
            <ServiceCard
              icon={HeartPulse}
              title={t("healthRecords")}
              text={t("healthRecordsText")}
              disabled
            />
            <ServiceCard
              icon={Hospital}
              title={t("findFacility")}
              text={t("findFacilityText")}
              disabled
            />
          </div>
        </div>
        <aside className="dashboard-aside">
          <div className="gov-card coverage-card">
            <div className="card-title">
              <ShieldCheck size={22} />
              <strong>{t("coverage")}</strong>
            </div>
            <StatusRow
              label={t("abhaId")}
              value={worker?.abha_id || t("linked")}
            />
            <StatusRow
              label={t("aawazId")}
              value={worker?.aawaz_id || t("active")}
            />
            <StatusRow label={t("accountCheck")} value={t("verifiedAccount")} />
          </div>
          <div className="notice-card">
            <strong>💡 {t("important")}</strong>
            <p>{t("showBefore")}</p>
          </div>
        </aside>
      </section>
    </>
  );
}
function ServiceCard({ icon: Icon, title, text, onClick, featured, disabled }) {
  const { t } = useI18n();
  return (
    <button
      className={`service-card ${featured ? "featured" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="service-icon">
        <Icon size={29} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
        {disabled && <em>{t("comingSoon")}</em>}
      </span>
      {!disabled && <ArrowRight size={24} />}
    </button>
  );
}
function StatusRow({ label, value }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>
        <span className="status-dot" />✓ {value}
      </strong>
    </div>
  );
}

export function DigitalIdScreen({ worker, onBack, onScan, loading }) {
  const { t } = useI18n();
  const [selectedFacility, setSelectedFacility] = useState(defaultFacilityId);
  const [cost, setCost] = useState("1800");
  const numericCost = Number(cost);
  const validCost = Number.isFinite(numericCost) && numericCost > 0;
  return (
    <section>
      <PageHeading
        eyebrow={t("idTag")}
        title={t("idTitle")}
        description={t("idDesc")}
        onBack={onBack}
      />
      <div className="identity-layout">
        <div className="digital-id-card">
          <div className="id-card-head">
            <ShieldCheck />
            <div>
              <span>{t("govt")}</span>
              <strong>{t("appName")}</strong>
            </div>
          </div>
          <div className="id-card-body">
            <PseudoQR
              payload={worker?.qr_payload || worker?.worker_id || "worker"}
            />
            <div className="id-details">
              <span>{t("workerId")}</span>
              <strong>{worker?.worker_id}</strong>
              <span>{t("abhaId")}</span>
              <b>{worker?.abha_id || t("linked")}</b>
              <span>{t("aawazId")}</span>
              <b>{worker?.aawaz_id || t("linked")}</b>
            </div>
          </div>
          <div className="id-card-foot">✓ {t("validFacilities")}</div>
        </div>
        <aside className="gov-card scan-panel">
          <QrCode size={32} />
          <h2>{t("chooseFacility")}</h2>
          <p>{t("chooseFacilityHelp")}</p>
          <div className="facility-list">
            {facilities.map((facility) => (
              <button
                type="button"
                key={facility.id}
                className={selectedFacility === facility.id ? "selected" : ""}
                aria-pressed={selectedFacility === facility.id}
                onClick={() => setSelectedFacility(facility.id)}
              >
                <span>
                  <strong>{facility.name}</strong>
                  <small>{facility.id}</small>
                </span>
                <em className={facility.abhaRegistered ? "abha" : "referral"}>
                  {facility.abhaRegistered
                    ? t("abhaFacility")
                    : t("referralFacility")}
                </em>
              </button>
            ))}
          </div>
          <label className="field compact-field">
            <span>{t("treatmentCost")}</span>
            <input
              aria-label={t("treatmentCost")}
              type="number"
              min="1"
              step="1"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
            />
            <small>{t("treatmentCostHelp")}</small>
          </label>
          <ActionButton
            loading={loading}
            disabled={!validCost}
            onClick={() => onScan(selectedFacility, numericCost)}
          >
            <QrCode size={21} />
            {t("scanSelected")}
          </ActionButton>
        </aside>
      </div>
    </section>
  );
}
function PseudoQR({ payload }) {
  const { t } = useI18n();
  const [source, setSource] = useState("");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      width: 380,
      margin: 1,
      color: { dark: "#092440", light: "#ffffff" },
    })
      .then((value) => {
        if (active) setSource(value);
      })
      .catch(() => {
        if (active) setSource("");
      });
    return () => {
      active = false;
    };
  }, [payload]);
  if (!source)
    return (
      <div className="qr-grid qr-loading" role="img" aria-label={t("qrAlt")}>
        <span className="spinner" />
      </div>
    );
  return (
    <Image
      className="qr-grid qr-image"
      src={source}
      alt={t("qrAlt")}
      width={190}
      height={190}
      unoptimized
    />
  );
}

export function ReferralScreen({ hospital, onOpenHospital, onBack }) {
  const { t } = useI18n();
  return (
    <section>
      <PageHeading
        eyebrow={t("referralTag")}
        title={t("referralTitle")}
        description={t("referralDesc")}
        onBack={onBack}
      />
      <div className="referral-layout">
        <div className="gov-card referral-card">
          <div className="referral-badge">
            <Hospital />
          </div>
          <span>{t("nearestHospital")}</span>
          <h2>{hospital?.name || t("defaultHospital")}</h2>
          <p>
            <MapPin size={20} />
            {t("referralDesk")}
          </p>
          <div className="route-placeholder">
            <MapPin size={30} />
            <span>{t("directions")}</span>
          </div>
        </div>
        <aside className="gov-card verification-panel">
          <h2>{t("atHospital")}</h2>
          <ol>
            <li>{t("hospital1")}</li>
            <li>{t("hospital2")}</li>
            <li>{t("hospital3")}</li>
          </ol>
          <ActionButton onClick={onOpenHospital}>
            <BadgeCheck size={21} />
            {t("openHospitalView")}
          </ActionButton>
        </aside>
      </div>
    </section>
  );
}
