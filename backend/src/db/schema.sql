CREATE TABLE workers (
  worker_id       VARCHAR(20) PRIMARY KEY,
  aadhaar_hash    VARCHAR(255) NOT NULL,
  eshram_id       VARCHAR(50) UNIQUE NOT NULL,
  abha_id         VARCHAR(30),
  aawaz_id        VARCHAR(30),
  name            VARCHAR(100),
  phone           VARCHAR(15),
  language_pref   VARCHAR(10) DEFAULT 'en',
  qr_payload      TEXT,
  otp             VARCHAR(6),
  otp_expires_at  TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE facilities (
  facility_id      VARCHAR(20) PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  type             VARCHAR(30) CHECK (type IN ('govt', 'empanelled', 'small_clinic')),
  abha_registered  BOOLEAN DEFAULT FALSE,
  lat              DECIMAL(9,6),
  lng              DECIMAL(9,6)
);

CREATE TABLE treatments (
  treatment_id      VARCHAR(20) PRIMARY KEY,
  worker_id         VARCHAR(20) REFERENCES workers(worker_id),
  facility_id       VARCHAR(20) REFERENCES facilities(facility_id),
  diagnosis         TEXT,
  procedure_desc    TEXT,
  cost              NUMERIC(10,2),
  synced_from_abha  BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE claims (
  claim_id            VARCHAR(20) PRIMARY KEY,
  treatment_id        VARCHAR(20) REFERENCES treatments(treatment_id),
  worker_id           VARCHAR(20) REFERENCES workers(worker_id),
  status              VARCHAR(20) CHECK (status IN ('Sent','Checking','Approved','Paid','Rejected')) DEFAULT 'Sent',
  amount              NUMERIC(10,2),
  risk_score          INTEGER,
  rejection_reason    TEXT,
  doctor_id           VARCHAR(20),
  submitted_to_nhcx_at TIMESTAMP,
  paid_at             TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_log (
  log_id      SERIAL PRIMARY KEY,
  claim_id    VARCHAR(20) REFERENCES claims(claim_id),
  actor       VARCHAR(50),
  action      TEXT,
  timestamp   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE disputes (
  dispute_id   VARCHAR(20) PRIMARY KEY,
  claim_id     VARCHAR(20) REFERENCES claims(claim_id),
  reason       TEXT,
  status       VARCHAR(20) DEFAULT 'under_review',
  created_at   TIMESTAMP DEFAULT NOW()
);