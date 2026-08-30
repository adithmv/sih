const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function request(path, { method = "GET", body, token } = {}) {
  if (!API_BASE) {
    throw new Error(
      "The API URL is not configured. Set NEXT_PUBLIC_API_URL before building the app.",
    );
  }

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "The health service could not be reached. Please try again.",
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export function makeRealApi() {
  return {
    register(payload) {
      return request("/api/v1/register", { method: "POST", body: payload });
    },
    login(payload) {
      return request("/api/v1/login", { method: "POST", body: payload });
    },
    getWorker(worker_id, token) {
      return request(`/api/v1/worker/${encodeURIComponent(worker_id)}`, {
        token,
      });
    },
    postTreatmentEvent(payload, token) {
      return request("/api/v1/treatment-event", {
        method: "POST",
        body: payload,
        token,
      });
    },
    getClaims(worker_id, token) {
      return request(`/api/v1/claims/${encodeURIComponent(worker_id)}`, {
        token,
      });
    },
    getClaimStatus(claim_id, token) {
      return request(`/api/v1/claims/${encodeURIComponent(claim_id)}/status`, {
        token,
      });
    },
    postDispute(claim_id, body, token) {
      return request(`/api/v1/claims/${encodeURIComponent(claim_id)}/dispute`, {
        method: "POST",
        body,
        token,
      });
    },
    doctorVerify(claim_id, token) {
      return request(
        `/api/v1/claims/${encodeURIComponent(claim_id)}/doctor-verify`,
        {
          method: "POST",
          body: { approved: true },
          token,
        },
      );
    },
  };
}
