import React from "react";

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function makeMockApi(demo: any) {
  return {
    async register({ aadhaar_number, eshram_id }: any) {
      await delay(900);
      if (!demo.identityVerified) {
        throw new Error("verification_failed");
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

    async login({ eshram_id, otp }: any) {
      await delay(700);
      if (!demo.loginValid) {
        throw new Error("login_invalid");
      }
      return {
        worker_id: "WRK-00931",
        token: "eyJhbGciOi." + Math.random().toString(36).slice(2),
        status: "success",
      };
    },

    async getWorker(worker_id: string) {
      await delay(500);
      return {
        worker_id,
        name: "Ramesh Kumar",
        qr_payload: `${worker_id}|12-3456-7890-1234|AWZ-KL-88213`,
        language: demo.language || "en",
      };
    },

    async postTreatmentEvent({ worker_id, facility_id, diagnosis, treatment_cost }: any) {
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

    async getClaims(worker_id: string, extra: any) {
      await delay(600);
      const base = [
        { claim_id: "CLM-76210", date: "2026-08-10T09:00:00Z", status: "Paid", amount: 2200, rejection_reason: null },
        { claim_id: "CLM-74108", date: "2026-07-22T13:40:00Z", status: "Rejected", amount: 950, rejection_reason: "Diagnosis code does not match submitted treatment cost." },
      ];
      const claims = extra ? [extra, ...base] : base;
      return { claims };
    },

    async getClaimStatus(claim_id: string, statusOverride: string, amount: number) {
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

    async postDispute(claim_id: string, { reason }: any) {
      await delay(800);
      return {
        dispute_id: "DIS-" + String(Math.floor(1000 + Math.random() * 8999)),
        status: "under_review",
      };
    },
  };
}

export function PseudoQR({ payload, size = 168 }: { payload: string; size?: number }) {
  const grid = 21;
  const cells: [number, number][] = [];
  let seed = 0;
  for (let i = 0; i < payload.length; i++) seed = (seed * 31 + payload.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const isFinder = (x < 5 && y < 5) || (x > grid - 6 && y < 5) || (x < 5 && y > grid - 6);
      let filled;
      if (isFinder) {
        const lx = x < 5 ? x : x - (grid - 6);
        const ly = y < 5 ? y : y > grid - 6 ? y - (grid - 6) : y;
        filled = lx === 0 || lx === 4 || ly === 0 || ly === 4 || (lx === 2 && ly === 2);
      } else {
        filled = rand() > 0.58;
      }
      if (filled) cells.push([x, y]);
    }
  }
  const cell = size / grid;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <rect x="0" y="0" width={size} height={size} fill="#ffffff" />
      {cells.map(([x, y]: [number, number], i: number) => (
        <rect key={i} x={x * cell} y={y * cell} width={cell} height={cell} fill="#16211C" />
      ))}
    </svg>
  );
}
