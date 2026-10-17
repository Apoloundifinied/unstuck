-- Schema para Cloudflare D1. Aplique com `npm run db:local` e `npm run db:remote`.
CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL CHECK(length(email) <= 254),
  role TEXT NOT NULL CHECK(role IN ('buyer','expert')),
  consented_at TEXT NOT NULL,
  edit_token_hash TEXT NOT NULL,
  service TEXT CHECK(service IN ('build','fix','customize','audit','maintain','learn','other')),
  integration TEXT CHECK(integration IN ('gmail','sheets','whatsapp','hubspot','notion','stripe','telegram','webhooks','other')),
  budget TEXT CHECK(budget IN ('under_100','100_500','500_2000','over_2000','unsure')),
  timeline TEXT CHECK(timeline IN ('asap','this_month','exploring')),
  context_note TEXT CHECK(length(context_note) <= 500),
  proof_url TEXT CHECK(length(proof_url) <= 200),
  availability TEXT CHECK(availability IN ('now','two_weeks','later')),
  rate TEXT CHECK(rate IN ('under_25','25_60','60_120','over_120','project')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(email,role)
);
CREATE INDEX IF NOT EXISTS waitlist_created_idx ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS waitlist_role_service_idx ON waitlist(role,service);
