CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'parent' NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"subscription_status" text DEFAULT 'active' NOT NULL,
	"subscription_paid_until" timestamp with time zone,
	"subscription_ref" text,
	"trial_started_at" timestamp with time zone,
	"trial_expires_at" timestamp with time zone,
	"trial_used" boolean DEFAULT false NOT NULL,
	"org_name" text,
	"region" text,
	"phone" text,
	"payment_proof_url" text,
	"requested_plan" text,
	"requested_billing_cycle" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" text NOT NULL,
	"gender" text DEFAULT 'other' NOT NULL,
	"avatar_url" text,
	"parent_name" text,
	"parent_email" text,
	"parent_phone" text,
	"school_name" text,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"diagnosis_notes" text,
	"therapist_id" integer,
	"clinic_name" text,
	"assigned_doctor" text,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screenings" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"screening_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"risk_level" text,
	"communication_score" integer,
	"social_score" integer,
	"attention_score" integer,
	"motor_score" integer,
	"emotional_score" integer,
	"behavioral_clusters" text,
	"referral_recommendations" text,
	"clinical_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"specialist_name" text NOT NULL,
	"specialist_type" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"telehealth" boolean DEFAULT false,
	"meeting_url" text,
	"notes" text,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"fee_amount" double precision,
	"location" text,
	"region_id" text,
	"province" text,
	"payment_ref" text,
	"payment_proof_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapy_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"title" text NOT NULL,
	"therapy_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"goals" text,
	"weekly_tasks" text,
	"home_exercises" text,
	"progress_percentage" integer DEFAULT 0,
	"therapist_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"findings" text,
	"recommendations" text,
	"urgency_level" text DEFAULT 'routine' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practitioner_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"practitioner_name" text NOT NULL,
	"specialist_type" text,
	"day_of_week" integer,
	"specific_date" text,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_duration_minutes" integer DEFAULT 60,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialty_fees" (
	"specialist_type" text PRIMARY KEY NOT NULL,
	"fee_amount" double precision NOT NULL,
	"currency" text DEFAULT 'PHP' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer NOT NULL,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'PHP' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_ref" text,
	"payment_method" text,
	"reference_number" text,
	"proof_image_base64" text,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reschedule_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer NOT NULL,
	"requested_by_role" text NOT NULL,
	"proposed_at" timestamp with time zone NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_analysis_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"screening_id" integer,
	"analysis_type" text NOT NULL,
	"model_used" text DEFAULT 'gemini' NOT NULL,
	"input_summary" text,
	"raw_output" text,
	"structured_insights" jsonb,
	"confidence_score" integer,
	"flagged_concerns" text,
	"recommendations" text,
	"processing_time_ms" integer,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"user_role" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"outcome" text DEFAULT 'success' NOT NULL,
	"notes" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapy_session_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"therapy_plan_id" integer NOT NULL,
	"child_id" integer NOT NULL,
	"session_number" integer NOT NULL,
	"session_date" timestamp with time zone NOT NULL,
	"therapist_name" text,
	"session_type" text DEFAULT 'in-person' NOT NULL,
	"duration_minutes" integer,
	"goals_addressed" text,
	"activities_performed" text,
	"child_response" text,
	"progress_observed" text,
	"challenges" text,
	"parent_feedback" text,
	"next_session_plan" text,
	"overall_rating" integer,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developmental_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"domain" text NOT NULL,
	"milestone" text NOT NULL,
	"typical_age_months" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"achieved_at" timestamp with time zone,
	"observed_by" text,
	"notes" text,
	"is_delayed" boolean DEFAULT false NOT NULL,
	"screening_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"previous_risk_level" text,
	"new_risk_level" text NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_resource_id" integer,
	"communication_score" integer,
	"social_score" integer,
	"attention_score" integer,
	"motor_score" integer,
	"emotional_score" integer,
	"changed_by" text,
	"notes" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"screening_id" integer NOT NULL,
	"child_id" integer NOT NULL,
	"question_code" text NOT NULL,
	"domain" text NOT NULL,
	"question_text" text NOT NULL,
	"response_value" text NOT NULL,
	"response_label" text,
	"score_contribution" integer,
	"flagged" text,
	"respondent_type" text DEFAULT 'parent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer,
	"uploaded_by" uuid,
	"uploader_role" text,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_name" text NOT NULL,
	"mime_type" text,
	"file_size_bytes" bigint,
	"storage_key" text NOT NULL,
	"related_resource_type" text,
	"related_resource_id" integer,
	"is_confidential" text DEFAULT 'false' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text DEFAULT 'referral' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"from_user_id" uuid NOT NULL,
	"from_user_name" text NOT NULL,
	"from_role" text NOT NULL,
	"to_user_id" uuid,
	"to_user_name" text,
	"to_role" text,
	"patient_name" text,
	"patient_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"child_id" text,
	"category" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"granted" boolean DEFAULT false NOT NULL,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"ip_address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"icon" text,
	"action_url" text,
	"action_label" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"enabled_for_roles" text DEFAULT 'all' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brain_gym_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"min_age_months" integer DEFAULT 0 NOT NULL,
	"max_age_months" integer DEFAULT 216 NOT NULL,
	"duration_minutes" integer DEFAULT 5 NOT NULL,
	"difficulty" text DEFAULT 'easy' NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"instructions" text,
	"icon_emoji" text DEFAULT '🧠',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brain_gym_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_id" integer NOT NULL,
	"activity_name" text NOT NULL,
	"category" text NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"max_score" integer DEFAULT 100 NOT NULL,
	"duration_seconds" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"badge_earned" text,
	"notes" text,
	"session_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"clinic_user_id" uuid NOT NULL,
	"chief_complaint" text,
	"presenting_concerns" text,
	"developmental_history" text,
	"birth_history" text,
	"medical_history" text,
	"family_history" text,
	"social_history" text,
	"previous_interventions" text,
	"current_medications" text,
	"allergies" text,
	"immunization_status" text,
	"school_performance" text,
	"behavior_at_home" text,
	"parent_concerns" text,
	"clinician_observations" text,
	"preliminary_findings" jsonb,
	"triage_level" text DEFAULT 'routine' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"child_name" text NOT NULL,
	"user_id" uuid,
	"clinic_user_id" uuid,
	"queue_date" text NOT NULL,
	"queue_number" integer NOT NULL,
	"appointment_id" integer,
	"status" text DEFAULT 'waiting' NOT NULL,
	"triage_level" text DEFAULT 'routine' NOT NULL,
	"wait_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"called_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"estimated_wait_minutes" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soap_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"appointment_id" integer,
	"clinic_user_id" uuid NOT NULL,
	"clinician_name" text NOT NULL,
	"clinician_role" text,
	"visit_date" timestamp with time zone DEFAULT now() NOT NULL,
	"subjective" text,
	"objective" text,
	"assessment" text,
	"plan" text,
	"diagnosis_codes" text,
	"vital_signs" jsonb,
	"follow_up_date" timestamp with time zone,
	"follow_up_notes" text,
	"is_finalized" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"child_id" integer NOT NULL,
	"child_name" text NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_user_id" uuid NOT NULL,
	"teacher_name" text NOT NULL,
	"class_name" text NOT NULL,
	"grade_level" text NOT NULL,
	"section" text,
	"school_year" text NOT NULL,
	"school_name" text,
	"campus_name" text,
	"room" text,
	"schedule" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"class_id" integer,
	"school_user_id" uuid NOT NULL,
	"teacher_name" text NOT NULL,
	"observation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"setting" text DEFAULT 'classroom' NOT NULL,
	"duration_minutes" integer,
	"academic_performance" text,
	"social_interaction" text,
	"attention_focus" text,
	"behavior_concerns" text,
	"language_communication" text,
	"motor_skills" text,
	"emotional_regulation" text,
	"strengths" text,
	"areas_of_concern" text,
	"recommended_actions" text,
	"parent_notified" boolean DEFAULT false NOT NULL,
	"follow_up_required" boolean DEFAULT false NOT NULL,
	"domain_ratings" jsonb,
	"attachments" jsonb,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iep_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"school_user_id" uuid NOT NULL,
	"coordinator_name" text NOT NULL,
	"school_name" text,
	"grade_level" text,
	"academic_year" text NOT NULL,
	"exceptionality" text,
	"disabilities" text,
	"present_level_of_performance" text,
	"annual_goals" jsonb,
	"short_term_objectives" jsonb,
	"special_services" jsonb,
	"accommodations" jsonb,
	"modifications" jsonb,
	"participation_in_regular_class" text,
	"assessment_accommodations" text,
	"transition_services" text,
	"parent_involvement" text,
	"review_date" timestamp with time zone,
	"implementation_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"progress_notes" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"parent_consent_given" boolean DEFAULT false NOT NULL,
	"parent_consent_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interventions" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"school_user_id" uuid NOT NULL,
	"observation_id" integer,
	"iep_plan_id" integer,
	"title" text NOT NULL,
	"intervention_type" text NOT NULL,
	"target_domain" text NOT NULL,
	"description" text,
	"strategy" text,
	"materials" text,
	"implemented_by" text,
	"frequency" text,
	"duration" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"target_behavior" text,
	"success_criteria" text,
	"baseline_data" text,
	"progress_data" jsonb,
	"outcome" text,
	"effectiveness" text,
	"parent_informed" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"gov_user_id" uuid NOT NULL,
	"program_name" text NOT NULL,
	"program_code" text,
	"category" text NOT NULL,
	"description" text,
	"target_region" text,
	"target_province" text,
	"target_municipality" text,
	"target_barangay" text,
	"target_population" text,
	"target_count" integer,
	"enrolled_count" integer DEFAULT 0 NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"budget" double precision,
	"expenditure" double precision DEFAULT 0 NOT NULL,
	"funding_source" text,
	"implementing_agency" text,
	"partner_agencies" jsonb,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"progress_percentage" double precision DEFAULT 0 NOT NULL,
	"key_indicators" jsonb,
	"reports" jsonb,
	"is_national" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialist_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer,
	"parent_user_id" uuid NOT NULL,
	"specialist_user_id" uuid NOT NULL,
	"specialist_type" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialist_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"sender_role" text NOT NULL,
	"content" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"purpose" text DEFAULT 'verify' NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeding_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"feeding_type" text NOT NULL,
	"frequency" text,
	"duration" text,
	"amount" real,
	"notes" text,
	"recorded_by" uuid,
	"feeding_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_exposures" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"food_item" text NOT NULL,
	"food_category" text,
	"first_introduced" text NOT NULL,
	"reactions" text,
	"accepted" text DEFAULT 'yes',
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"measurement_date" text NOT NULL,
	"weight" real,
	"height" real,
	"head_circumference" real,
	"bmi" real,
	"source" text DEFAULT 'parent' NOT NULL,
	"recorded_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"date" text NOT NULL,
	"meal_type" text NOT NULL,
	"foods_consumed" text,
	"portion" text,
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"insight_type" text DEFAULT 'general' NOT NULL,
	"generated_insight" text NOT NULL,
	"generated_date" text NOT NULL,
	"confidence_level" text DEFAULT 'medium',
	"is_read" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"feeding_type" text,
	"dietary_pattern" text,
	"nutrition_status" text DEFAULT 'normal' NOT NULL,
	"food_diversity_score" real DEFAULT 0,
	"meal_consistency_score" real DEFAULT 0,
	"hydration_tracking" text,
	"notes" text,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_threads" ADD CONSTRAINT "specialist_threads_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_threads" ADD CONSTRAINT "specialist_threads_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_threads" ADD CONSTRAINT "specialist_threads_specialist_user_id_users_id_fk" FOREIGN KEY ("specialist_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_messages" ADD CONSTRAINT "specialist_messages_thread_id_specialist_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."specialist_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_messages" ADD CONSTRAINT "specialist_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;