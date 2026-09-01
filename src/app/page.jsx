"use client";

import { useRef, useState } from "react";
import { GovLayout } from "@/components/GovLayout";
import {
  ConfirmationScreen,
  LoginScreen,
  MessageScreen,
  RegistrationScreen,
  WelcomeScreen,
} from "@/components/AuthScreens";
import {
  DashboardScreen,
  DigitalIdScreen,
  ReferralScreen,
} from "@/components/ServiceScreens";
import {
  ClaimDetailScreen,
  ClaimsScreen,
  DisputeScreen,
} from "@/components/ClaimScreens";
import { HospitalQueueScreen } from "@/components/HospitalScreens";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { makeRealApi } from "@/lib/api";

// DEMO-ONLY: this key is a placeholder for real doctor authentication.
// It is intentionally visible in the client bundle in this prototype's
// static-export architecture. Do not reuse this value for anything real.
const DOCTOR_KEY =
  process.env.NEXT_PUBLIC_DOCTOR_KEY || process.env.NEXT_PUBLIC_DOCTOR_TOKEN;

export default function MigrantHealthPortal() {
  const [language, setLanguage] = useState("en");
  return (
    <I18nProvider language={language}>
      <Portal language={language} setLanguage={setLanguage} />
    </I18nProvider>
  );
}

function Portal({ language, setLanguage }) {
  const { t } = useI18n();
  const api = useRef(makeRealApi());
  const [screen, setScreen] = useState("welcome");
  const [role, setRole] = useState("worker");
  const [worker, setWorker] = useState(null);
  const [claims, setClaims] = useState([]);
  const [hospitalClaims, setHospitalClaims] = useState([]);
  const [activeClaim, setActiveClaim] = useState(null);
  const [pendingTreatment, setPendingTreatment] = useState(null);
  const [disputeResult, setDisputeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decisionClaimId, setDecisionClaimId] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const go = (next) => {
    setErrorKey("");
    setScreen(next);
  };
  const errorFor = (error, fallback) =>
    error instanceof Error && error.message.includes("NEXT_PUBLIC_")
      ? "errorConfig"
      : fallback;
  async function register(payload) {
    setErrorKey("");
    setLoading(true);
    try {
      const result = await api.current.register(payload);
      setWorker({ ...result, language });
      go("confirmation");
    } catch (error) {
      const key = errorFor(error, "registration-error");
      if (key === "registration-error") go(key);
      else setErrorKey(key);
    } finally {
      setLoading(false);
    }
  }
  async function login(payload) {
    setErrorKey("");
    setLoading(true);
    try {
      const result = await api.current.login(payload);
      const profile = await api.current.getWorker(
        result.worker_id,
        result.token,
      );
      setWorker({ ...profile, token: result.token });
      go("dashboard");
    } catch (error) {
      const key = errorFor(error, "login-error");
      if (key === "login-error") go(key);
      else setErrorKey(key);
    } finally {
      setLoading(false);
    }
  }
  async function loadClaims() {
    if (!worker) return;
    go("claims");
    setLoading(true);
    try {
      const result = await api.current.getClaims(
        worker.worker_id,
        worker.token,
      );
      setClaims(Array.isArray(result.claims) ? result.claims : []);
    } catch (error) {
      setErrorKey(errorFor(error, "errorClaims"));
    } finally {
      setLoading(false);
    }
  }
  async function loadHospitalClaims() {
    setErrorKey("");
    if (!DOCTOR_KEY) {
      setErrorKey("errorDoctorConfig");
      return;
    }
    setLoading(true);
    try {
      const result = await api.current.getPendingVerificationClaims(
        DOCTOR_KEY,
        worker?.token,
      );
      setHospitalClaims(Array.isArray(result.claims) ? result.claims : []);
    } catch (error) {
      setErrorKey(errorFor(error, "errorHospitalQueue"));
    } finally {
      setLoading(false);
    }
  }
  function changeRole(nextRole) {
    setErrorKey("");
    setRole(nextRole);
    if (nextRole === "hospital") {
      void loadHospitalClaims();
    } else if (worker) {
      void loadClaims();
    }
  }
  async function openClaim(claim) {
    setErrorKey("");
    setLoading(true);
    try {
      const result = await api.current.getClaimStatus(
        claim.claim_id,
        worker.token,
      );
      setActiveClaim(result);
      go("claim-detail");
    } catch (error) {
      setErrorKey(errorFor(error, "errorClaim"));
    } finally {
      setLoading(false);
    }
  }
  async function scanClinic(facilityId, treatmentCost) {
    setErrorKey("");
    setLoading(true);
    try {
      const result = await api.current.postTreatmentEvent(
        {
          worker_id: worker.worker_id,
          facility_id: facilityId,
          diagnosis: "General illness",
          treatment_cost: treatmentCost,
        },
        worker.token,
      );
      setPendingTreatment({
        claim_id: result.claim_id,
        hospital: result.nearest_govt_hospital,
      });
      if (result.redirect_required) go("referral");
      else await loadClaims();
    } catch (error) {
      setErrorKey(errorFor(error, "errorTreatment"));
    } finally {
      setLoading(false);
    }
  }
  async function verifyTreatment(claimId, approved) {
    if (!claimId) return;
    setErrorKey("");
    if (!DOCTOR_KEY) {
      setErrorKey("errorDoctorConfig");
      return;
    }
    setDecisionClaimId(claimId);
    try {
      await api.current.doctorVerify(
        claimId,
        worker?.token,
        approved,
        DOCTOR_KEY,
      );
      setHospitalClaims((current) =>
        current.filter((claim) => claim.claim_id !== claimId),
      );
      if (worker) {
        const result = await api.current.getClaims(
          worker.worker_id,
          worker.token,
        );
        setClaims(Array.isArray(result.claims) ? result.claims : []);
        setScreen("claims");
      }
    } catch (error) {
      setErrorKey(errorFor(error, "errorVerify"));
    } finally {
      setDecisionClaimId("");
    }
  }
  async function submitDispute(reason) {
    setErrorKey("");
    setLoading(true);
    try {
      const result = await api.current.postDispute(
        activeClaim.claim_id,
        { reason },
        worker.token,
      );
      setDisputeResult(result);
    } catch (error) {
      setErrorKey(errorFor(error, "errorDispute"));
    } finally {
      setLoading(false);
    }
  }
  let content;
  switch (screen) {
    case "register":
      content = (
        <RegistrationScreen
          onSubmit={register}
          onBack={() => go("welcome")}
          loading={loading}
        />
      );
      break;
    case "registration-error":
      content = (
        <MessageScreen
          title={t("regFailTitle")}
          text={t("regFailText")}
          onPrimary={() => go("register")}
          onSecondary={() => go("welcome")}
        />
      );
      break;
    case "confirmation":
      content = (
        <ConfirmationScreen
          worker={worker}
          onContinue={() => go("dashboard")}
        />
      );
      break;
    case "login":
      content = (
        <LoginScreen
          onSubmit={login}
          onBack={() => go("welcome")}
          loading={loading}
        />
      );
      break;
    case "login-error":
      content = (
        <MessageScreen
          title={t("loginFailTitle")}
          text={t("loginFailText")}
          onPrimary={() => go("login")}
          onSecondary={() => go("welcome")}
        />
      );
      break;
    case "dashboard":
      content = (
        <DashboardScreen
          worker={worker}
          onDigitalId={() => go("digital-id")}
          onClaims={loadClaims}
        />
      );
      break;
    case "digital-id":
      content = (
        <DigitalIdScreen
          worker={worker}
          onBack={() => go("dashboard")}
          onScan={scanClinic}
          loading={loading}
        />
      );
      break;
    case "referral":
      content = (
        <ReferralScreen
          hospital={pendingTreatment?.hospital}
          onBack={() => go("digital-id")}
          onOpenHospital={() => changeRole("hospital")}
        />
      );
      break;
    case "claims":
      content = (
        <ClaimsScreen
          claims={claims}
          loading={loading}
          onBack={() => go("dashboard")}
          onOpen={openClaim}
        />
      );
      break;
    case "claim-detail":
      content = (
        <ClaimDetailScreen
          claim={activeClaim}
          onBack={() => go("claims")}
          onDispute={() => {
            setDisputeResult(null);
            go("dispute");
          }}
        />
      );
      break;
    case "dispute":
      content = (
        <DisputeScreen
          claim={activeClaim}
          result={disputeResult}
          loading={loading}
          onBack={() => go("claim-detail")}
          onSubmit={submitDispute}
        />
      );
      break;
    default:
      content = (
        <WelcomeScreen
          onNew={() => go("register")}
          onReturning={() => go("login")}
        />
      );
  }
  if (role === "hospital") {
    content = (
      <HospitalQueueScreen
        claims={hospitalClaims}
        loading={loading}
        decisionClaimId={decisionClaimId}
        onDecision={verifyTreatment}
      />
    );
  }
  return (
    <GovLayout
      language={language}
      setLanguage={setLanguage}
      role={role}
      onRoleChange={changeRole}
      error={errorKey ? t(errorKey) : ""}
      clearError={() => setErrorKey("")}
      onHome={() => go(worker ? "dashboard" : "welcome")}
    >
      {content}
    </GovLayout>
  );
}
