BEGIN;
CREATE TABLE IF NOT EXISTS auth_sessions (
 id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
CREATE TABLE IF NOT EXISTS professional_profiles (
 user_id uuid PRIMARY KEY REFERENCES users(id), specialty text NOT NULL, license_number text NOT NULL,
 verified_by uuid REFERENCES users(id), verified_at timestamptz
);
CREATE TABLE IF NOT EXISTS developmental_cases (
 id serial PRIMARY KEY, child_id integer NOT NULL REFERENCES children(id), owner_id uuid NOT NULL REFERENCES users(id),
 reviewer_id uuid REFERENCES users(id), title text NOT NULL, observations text NOT NULL,
 status text NOT NULL DEFAULT 'submitted', consent_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT case_status CHECK (status IN ('submitted','assigned','in_review','reviewed'))
);
CREATE INDEX IF NOT EXISTS developmental_cases_owner_idx ON developmental_cases(owner_id);
CREATE INDEX IF NOT EXISTS developmental_cases_reviewer_idx ON developmental_cases(reviewer_id);
CREATE TABLE IF NOT EXISTS case_result_versions (
 id serial PRIMARY KEY, case_id integer NOT NULL REFERENCES developmental_cases(id), author_id uuid NOT NULL REFERENCES users(id),
 content text NOT NULL, status text NOT NULL DEFAULT 'draft', approved_by uuid REFERENCES users(id),
 approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT result_status CHECK (status IN ('draft','approved')),
 CONSTRAINT approval_evidence CHECK ((status='approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR (status='draft' AND approved_by IS NULL AND approved_at IS NULL))
);
CREATE TABLE IF NOT EXISTS case_tasks (
 id serial PRIMARY KEY, case_id integer NOT NULL REFERENCES developmental_cases(id), author_id uuid NOT NULL REFERENCES users(id),
 kind text NOT NULL, content text NOT NULL, status text NOT NULL DEFAULT 'open', metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION protect_approved_case_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status='approved' THEN RAISE EXCEPTION 'Approved clinical versions are immutable; create an amendment'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;
DROP TRIGGER IF EXISTS immutable_approved_case_result ON case_result_versions;
CREATE TRIGGER immutable_approved_case_result BEFORE UPDATE OR DELETE ON case_result_versions FOR EACH ROW EXECUTE FUNCTION protect_approved_case_result();
COMMIT;
