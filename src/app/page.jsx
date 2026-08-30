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
import { I18nProvider, useI18n } from "@/lib/i18n";
import { makeRealApi } from "@/lib/api";

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
  const [worker, setWorker] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activeClaim, setActiveClaim] = useState(null);
  const [pendingTreatment, setPendingTreatment] = useState(null);
  const [disputeResult, setDisputeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState("");
  const go = (next) => {
    setErrorKey("");
    setScreen(next);
  };
  const errorFor = (error, fallback) =>
    error instanceof Error && error.message.includes("NEXT_PUBLIC_API_URL")
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
  async function verifyTreatment() {
    if (!pendingTreatment?.claim_id) return;
    setErrorKey("");
    setLoading(true);
    try {
      await api.current.doctorVerify(pendingTreatment.claim_id, worker.token);
      await loadClaims();
    } catch (error) {
      setErrorKey(errorFor(error, "errorVerify"));
    } finally {
      setLoading(false);
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
          onVerify={verifyTreatment}
          loading={loading}
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
  return (
    <GovLayout
      language={language}
      setLanguage={setLanguage}
      error={errorKey ? t(errorKey) : ""}
      clearError={() => setErrorKey("")}
      onHome={() => go(worker ? "dashboard" : "welcome")}
    >
      {content}
    </GovLayout>
  );
}
