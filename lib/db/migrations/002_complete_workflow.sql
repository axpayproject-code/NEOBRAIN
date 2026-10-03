BEGIN;
CREATE TABLE "case_access_grants" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"share_clinical" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "care_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "care_availability_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" uuid NOT NULL,
	"organization_id" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"mode" text NOT NULL,
	"fee_centavos" integer NOT NULL,
	"location" text,
	"status" text DEFAULT 'available' NOT NULL
);
CREATE TABLE "care_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"referral_id" integer,
	"slot_id" integer NOT NULL,
	"guardian_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"organization_id" integer NOT NULL,
	"status" text DEFAULT 'payment_pending' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"amount_centavos" integer NOT NULL,
	"meeting_url" text,
	"location" text,
	"callback_phone" text,
	"current_location" text,
	"hold_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "case_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"author_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"content" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "care_encounters" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"provider_id" uuid NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "care_encounters_booking_id_unique" UNIQUE("booking_id")
);
CREATE TABLE "care_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "care_invitations_token_hash_unique" UNIQUE("token_hash")
);
CREATE TABLE "care_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
CREATE TABLE "care_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"case_id" integer,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "care_payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" integer,
	"payer_id" uuid NOT NULL,
	"organization_id" integer,
	"kind" text DEFAULT 'appointment' NOT NULL,
	"amount_centavos" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"checkout_id" text,
	"checkout_url" text,
	"payment_id" text,
	"refund_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "care_payment_orders_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "care_payment_orders_checkout_id_unique" UNIQUE("checkout_id")
);
CREATE TABLE "care_organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"region" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"billing_email" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "care_payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "care_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"name" text NOT NULL,
	"budget_centavos" integer DEFAULT 0 NOT NULL,
	"spent_centavos" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
CREATE TABLE "care_referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"result_id" integer NOT NULL,
	"provider_id" uuid NOT NULL,
	"organization_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"outcome" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "care_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"min_age_months" integer NOT NULL,
	"max_age_months" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"approved_by" uuid
);
CREATE TABLE "care_user_onboarding" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"email_verified_at" timestamp with time zone,
	"training_completed_at" timestamp with time zone,
	"guardian_attested_at" timestamp with time zone
);
ALTER TABLE "case_access_grants" ADD CONSTRAINT "case_access_grants_case_id_developmental_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."developmental_cases"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "case_access_grants" ADD CONSTRAINT "case_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_attachments" ADD CONSTRAINT "care_attachments_case_id_developmental_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."developmental_cases"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_attachments" ADD CONSTRAINT "care_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_availability_slots" ADD CONSTRAINT "care_availability_slots_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_availability_slots" ADD CONSTRAINT "care_availability_slots_organization_id_care_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."care_organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_bookings" ADD CONSTRAINT "care_bookings_case_id_developmental_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."developmental_cases"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_bookings" ADD CONSTRAINT "care_bookings_referral_id_care_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."care_referrals"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_bookings" ADD CONSTRAINT "care_bookings_slot_id_care_availability_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."care_availability_slots"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_bookings" ADD CONSTRAINT "care_bookings_guardian_id_users_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_bookings" ADD CONSTRAINT "care_bookings_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_bookings" ADD CONSTRAINT "care_bookings_organization_id_care_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."care_organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "case_entries" ADD CONSTRAINT "case_entries_case_id_developmental_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."developmental_cases"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "case_entries" ADD CONSTRAINT "case_entries_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_encounters" ADD CONSTRAINT "care_encounters_booking_id_care_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."care_bookings"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_encounters" ADD CONSTRAINT "care_encounters_case_id_developmental_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."developmental_cases"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_encounters" ADD CONSTRAINT "care_encounters_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_invitations" ADD CONSTRAINT "care_invitations_organization_id_care_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."care_organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_memberships" ADD CONSTRAINT "care_memberships_organization_id_care_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."care_organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_memberships" ADD CONSTRAINT "care_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_notifications" ADD CONSTRAINT "care_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_notifications" ADD CONSTRAINT "care_notifications_case_id_developmental_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."developmental_cases"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_payment_orders" ADD CONSTRAINT "care_payment_orders_booking_id_care_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."care_bookings"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_payment_orders" ADD CONSTRAINT "care_payment_orders_payer_id_users_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_payment_orders" ADD CONSTRAINT "care_payment_orders_organization_id_care_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."care_organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_organizations" ADD CONSTRAINT "care_organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_programs" ADD CONSTRAINT "care_programs_organization_id_care_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."care_organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_referrals" ADD CONSTRAINT "care_referrals_case_id_developmental_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."developmental_cases"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_referrals" ADD CONSTRAINT "care_referrals_result_id_case_result_versions_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."case_result_versions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_referrals" ADD CONSTRAINT "care_referrals_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_referrals" ADD CONSTRAINT "care_referrals_organization_id_care_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."care_organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_referrals" ADD CONSTRAINT "care_referrals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_resources" ADD CONSTRAINT "care_resources_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "care_user_onboarding" ADD CONSTRAINT "care_user_onboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "case_access_unique" ON "case_access_grants" USING btree ("case_id","user_id");
CREATE UNIQUE INDEX "care_membership_unique" ON "care_memberships" USING btree ("organization_id","user_id");
ALTER TABLE developmental_cases ADD COLUMN IF NOT EXISTS organization_id integer REFERENCES care_organizations(id);
ALTER TABLE developmental_cases ADD COLUMN IF NOT EXISTS coordinator_id uuid REFERENCES users(id);
ALTER TABLE developmental_cases ADD COLUMN IF NOT EXISTS consent_withdrawn_at timestamptz;
ALTER TABLE case_result_versions ADD COLUMN IF NOT EXISTS result_type text NOT NULL DEFAULT 'developmental_review';
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS approval_scopes jsonb NOT NULL DEFAULT '[]';
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS evidence text;
ALTER TABLE case_result_versions DROP CONSTRAINT IF EXISTS result_status;
ALTER TABLE case_result_versions DROP CONSTRAINT IF EXISTS approval_evidence;
ALTER TABLE case_result_versions ADD CONSTRAINT result_status CHECK(status IN ('draft','approved','returned','rejected'));
ALTER TABLE case_result_versions ADD CONSTRAINT approval_evidence CHECK((status='approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR (status<>'approved' AND approved_by IS NULL AND approved_at IS NULL));
ALTER TABLE care_availability_slots ADD CONSTRAINT valid_slot CHECK(ends_at>starts_at AND fee_centavos>=0 AND mode IN ('remote','onsite'));
ALTER TABLE care_payment_orders ADD CONSTRAINT valid_amount CHECK(amount_centavos>0);
ALTER TABLE care_programs ADD CONSTRAINT valid_budget CHECK(budget_centavos>=0 AND spent_centavos>=0 AND spent_centavos<=budget_centavos);
CREATE INDEX care_grants_user_idx ON case_access_grants(user_id);
CREATE INDEX care_referrals_case_idx ON care_referrals(case_id);
CREATE INDEX care_bookings_case_idx ON care_bookings(case_id);
CREATE INDEX care_entries_case_idx ON case_entries(case_id);
CREATE OR REPLACE FUNCTION protect_approved_encounter() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status='approved' THEN RAISE EXCEPTION 'Approved encounters are immutable; create an amended result'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TRIGGER immutable_approved_encounter BEFORE UPDATE OR DELETE ON care_encounters FOR EACH ROW EXECUTE FUNCTION protect_approved_encounter();
ALTER TABLE care_availability_slots ADD COLUMN cancellation_policy text NOT NULL DEFAULT 'Contact the provider for cancellation terms before booking';
ALTER TABLE care_organizations ADD COLUMN subscription_paid_until timestamptz;
ALTER TABLE care_bookings ADD COLUMN sponsor_program_id integer REFERENCES care_programs(id);
CREATE OR REPLACE FUNCTION protect_approved_support_plan() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.kind='support_plan' AND OLD.metadata->>'approvedBy' IS NOT NULL THEN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Approved support plans are immutable'; END IF;
  IF NEW.content IS DISTINCT FROM OLD.content OR NEW.metadata IS DISTINCT FROM OLD.metadata OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.author_id IS DISTINCT FROM OLD.author_id OR NEW.case_id IS DISTINCT FROM OLD.case_id THEN RAISE EXCEPTION 'Approved support plans are immutable'; END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TRIGGER immutable_approved_support_plan BEFORE UPDATE OR DELETE ON case_tasks FOR EACH ROW EXECUTE FUNCTION protect_approved_support_plan();
COMMIT;
