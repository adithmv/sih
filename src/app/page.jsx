"use client";

import { useRef, useState } from "react";
import { GovLayout } from "@/components/GovLayout";
import { ConfirmationScreen, LoginScreen, MessageScreen, RegistrationScreen, WelcomeScreen } from "@/components/AuthScreens";
import { DashboardScreen, DigitalIdScreen, ReferralScreen } from "@/components/ServiceScreens";
import { ClaimDetailScreen, ClaimsScreen, DisputeScreen } from "@/components/ClaimScreens";
import { makeRealApi } from "@/lib/api";

export default function MigrantHealthPortal() {
  const api = useRef(makeRealApi());
  const [screen, setScreen] = useState("welcome");
  const [language, setLanguage] = useState("en");
  const [worker, setWorker] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activeClaim, setActiveClaim] = useState(null);
  const [pendingTreatment, setPendingTreatment] = useState(null);
  const [disputeResult, setDisputeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const message = (err, fallback) => err instanceof Error ? err.message : fallback;

  async function register(payload) {
    setError(""); setLoading(true);
    try { const result = await api.current.register(payload); setWorker({ ...result, language }); setScreen("confirmation"); }
    catch { setScreen("registration-error"); }
    finally { setLoading(false); }
  }

  async function login(payload) {
    setError(""); setLoading(true);
    try { const result = await api.current.login(payload); const profile = await api.current.getWorker(result.worker_id, result.token); setWorker({ ...profile, token: result.token }); setScreen("dashboard"); }
    catch { setScreen("login-error"); }
    finally { setLoading(false); }
  }

  async function loadClaims() {
    if (!worker) return;
    setScreen("claims"); setError(""); setLoading(true);
    try { const result = await api.current.getClaims(worker.worker_id, worker.token); setClaims(Array.isArray(result.claims) ? result.claims : []); }
    catch (err) { setError(message(err, "Unable to load claims.")); }
    finally { setLoading(false); }
  }

  async function openClaim(claim) {
    setError(""); setLoading(true);
    try { const result = await api.current.getClaimStatus(claim.claim_id, worker.token); setActiveClaim(result); setScreen("claim-detail"); }
    catch (err) { setError(message(err, "Unable to load this claim.")); }
    finally { setLoading(false); }
  }

  async function scanClinic() {
    setError(""); setLoading(true);
    try {
      const result = await api.current.postTreatmentEvent({ worker_id: worker.worker_id, facility_id: "FAC-2291", diagnosis: "Fever, dehydration", treatment_cost: 1800 }, worker.token);
      setPendingTreatment({ claim_id: result.claim_id, hospital: result.nearest_govt_hospital });
      if (result.redirect_required) setScreen("referral"); else await loadClaims();
    } catch (err) { setError(message(err, "Unable to submit the treatment event.")); }
    finally { setLoading(false); }
  }

  async function verifyTreatment() {
    if (!pendingTreatment?.claim_id) return;
    setError(""); setLoading(true);
    try { await api.current.doctorVerify(pendingTreatment.claim_id, worker.token); await loadClaims(); }
    catch (err) { setError(message(err, "Unable to verify the treatment.")); }
    finally { setLoading(false); }
  }

  async function submitDispute(reason) {
    setError(""); setLoading(true);
    try { const result = await api.current.postDispute(activeClaim.claim_id, { reason }, worker.token); setDisputeResult(result); }
    catch (err) { setError(message(err, "Unable to submit the dispute.")); }
    finally { setLoading(false); }
  }

  let content;
  switch (screen) {
    case "register": content = <RegistrationScreen onSubmit={register} onBack={() => setScreen("welcome")} loading={loading} />; break;
    case "registration-error": content = <MessageScreen title="Identity verification unsuccessful" text="The Aadhaar and e-Shram details could not be matched. Check the information and try again." primaryLabel="Try again" onPrimary={() => setScreen("register")} secondaryLabel="Return to home" onSecondary={() => setScreen("welcome")} />; break;
    case "confirmation": content = <ConfirmationScreen worker={worker} onContinue={() => setScreen("dashboard")} />; break;
    case "login": content = <LoginScreen onSubmit={login} onBack={() => setScreen("welcome")} loading={loading} />; break;
    case "login-error": content = <MessageScreen title="Sign in unsuccessful" text="The e-Shram ID or OTP was not accepted. Check the details and try again." primaryLabel="Try again" onPrimary={() => setScreen("login")} secondaryLabel="Return to home" onSecondary={() => setScreen("welcome")} />; break;
    case "dashboard": content = <DashboardScreen worker={worker} onDigitalId={() => setScreen("digital-id")} onClaims={loadClaims} />; break;
    case "digital-id": content = <DigitalIdScreen worker={worker} onBack={() => setScreen("dashboard")} onScan={scanClinic} loading={loading} />; break;
    case "referral": content = <ReferralScreen hospital={pendingTreatment?.hospital} onBack={() => setScreen("digital-id")} onVerify={verifyTreatment} loading={loading} />; break;
    case "claims": content = <ClaimsScreen claims={claims} loading={loading} onBack={() => setScreen("dashboard")} onOpen={openClaim} />; break;
    case "claim-detail": content = <ClaimDetailScreen claim={activeClaim} onBack={() => setScreen("claims")} onDispute={() => { setDisputeResult(null); setScreen("dispute"); }} />; break;
    case "dispute": content = <DisputeScreen claim={activeClaim} result={disputeResult} loading={loading} onBack={() => setScreen("claim-detail")} onSubmit={submitDispute} />; break;
    default: content = <WelcomeScreen language={language} setLanguage={setLanguage} onNew={() => setScreen("register")} onReturning={() => setScreen("login")} />;
  }

  return <GovLayout language={language} setLanguage={setLanguage} error={error} clearError={() => setError("")}>{content}</GovLayout>;
}
