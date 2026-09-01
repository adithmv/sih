import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  IndianRupee,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ActionButton, PageHeading } from "./GovLayout";

export function HospitalQueueScreen({
  claims,
  loading,
  decisionClaimId,
  worker,
  onDecision,
}) {
  const { t, locale } = useI18n();
  // The hospital endpoint already returns only claims awaiting verification.
  const pendingClaims = claims;

  return (
    <section>
      <PageHeading
        eyebrow={t("hospitalQueueTag")}
        title={t("hospitalQueueTitle")}
        description={t("hospitalQueueDesc")}
      />
      <div className="hospital-context" role="status">
        <Stethoscope size={22} />
        <span>{t("hospitalModeNotice")}</span>
      </div>
      <div className="gov-card hospital-queue-card">
        <div className="table-heading">
          <strong>{t("pendingVerification")}</strong>
          <span>{pendingClaims.length}</span>
        </div>
        {!worker ? (
          <QueueEmpty
            icon={Building2}
            title={t("hospitalNeedsWorker")}
            text={t("hospitalNeedsWorkerText")}
          />
        ) : loading ? (
          <div className="loading-state">
            <span className="spinner" />
            {t("loadingClaims")}
          </div>
        ) : pendingClaims.length === 0 ? (
          <QueueEmpty
            icon={ClipboardCheck}
            title={t("hospitalQueueEmpty")}
            text={t("hospitalQueueEmptyText")}
          />
        ) : (
          <div className="hospital-queue-list">
            {pendingClaims.map((claim) => {
              const amount = Number(
                claim.amount ?? claim.treatment_cost ?? claim.cost ?? 0,
              ).toLocaleString(locale);
              const facility =
                claim.facility_name ||
                claim.facility?.name ||
                claim.facility_id ||
                t("notAvailable");
              const diagnosis = claim.diagnosis || t("notAvailable");
              const deciding = decisionClaimId === claim.claim_id;

              return (
                <article key={claim.claim_id} className="hospital-queue-row">
                  <div className="hospital-claim-heading">
                    <span>{t("claimDetails")}</span>
                    <strong>{claim.claim_id}</strong>
                  </div>
                  <dl>
                    <div>
                      <dt>{t("workerId")}</dt>
                      <dd>{claim.worker_id || worker.worker_id}</dd>
                    </div>
                    <div>
                      <dt>{t("facility")}</dt>
                      <dd>{facility}</dd>
                    </div>
                    <div>
                      <dt>{t("diagnosis")}</dt>
                      <dd>{diagnosis}</dd>
                    </div>
                    <div>
                      <dt>{t("claimAmount")}</dt>
                      <dd className="hospital-cost">
                        <IndianRupee size={17} />
                        {amount}
                      </dd>
                    </div>
                  </dl>
                  <div className="hospital-actions">
                    <ActionButton
                      loading={deciding}
                      disabled={Boolean(decisionClaimId)}
                      onClick={() => onDecision(claim.claim_id, true)}
                    >
                      <BadgeCheck size={20} />
                      {t("approveClaim")}
                    </ActionButton>
                    <button
                      type="button"
                      className="button hospital-reject-button"
                      disabled={Boolean(decisionClaimId)}
                      onClick={() => onDecision(claim.claim_id, false)}
                      aria-label={t("rejectClaimAria", { id: claim.claim_id })}
                    >
                      <XCircle size={20} />
                      {t("rejectClaim")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function QueueEmpty({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <Icon size={44} />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
