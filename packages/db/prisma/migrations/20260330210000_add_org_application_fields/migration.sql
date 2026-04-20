-- Add org info fields to OrgApplication
-- orgName and contactName use a temporary default so this works on non-empty tables;
-- new submissions always supply real values via the server action.
ALTER TABLE "OrgApplication"
  ADD COLUMN "orgName"       TEXT NOT NULL DEFAULT '',
  ADD COLUMN "contactName"   TEXT NOT NULL DEFAULT '',
  ADD COLUMN "phone"         TEXT,
  ADD COLUMN "description"   TEXT,
  ADD COLUMN "termsAgreedAt" TIMESTAMP(3),
  ADD COLUMN "termsVersion"  TEXT NOT NULL DEFAULT '1.0';
