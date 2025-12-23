-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CLINICIAN');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'GROWTH', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('RECEIVED', 'SUBMITTED', 'AWAITING_INSURER', 'APPROVED', 'DENIED', 'TREATMENT_SCHEDULED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CaseSource" AS ENUM ('PORTAL', 'EMAIL', 'API', 'PHONE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('REFERRAL_LETTER', 'CLINICAL_NOTES', 'INSURANCE_FORM', 'AUTHORIZATION', 'LAB_RESULTS', 'IMAGING', 'CONSENT_FORM', 'CORRESPONDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'ASSIGNMENT_CHANGE', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_DELETE', 'EMAIL_SENT', 'NOTE_ADDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLINICIAN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auth0_id" TEXT,
    "clinic_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "sla_default_days" INTEGER NOT NULL DEFAULT 5,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "subscription_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "patient_first_name" TEXT NOT NULL,
    "patient_last_name" TEXT NOT NULL,
    "patient_dob" TIMESTAMP(3) NOT NULL,
    "patient_nhs_number" TEXT,
    "patient_email" TEXT,
    "patient_phone" TEXT,
    "referral_type" TEXT NOT NULL,
    "referring_clinician" TEXT NOT NULL,
    "clinical_notes" TEXT,
    "insurer_id" TEXT NOT NULL,
    "insurer_policy_number" TEXT,
    "insurer_auth_code" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'RECEIVED',
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "sla_deadline" TIMESTAMP(3) NOT NULL,
    "sla_breached" BOOLEAN NOT NULL DEFAULT false,
    "assigned_to_id" TEXT,
    "clinic_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "source_type" "CaseSource" NOT NULL DEFAULT 'PORTAL',
    "source_email_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_status_history" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "from_status" "CaseStatus",
    "to_status" "CaseStatus" NOT NULL,
    "changed_by_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_notes" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "portal_url" TEXT,
    "avg_response_days" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_insurers" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "insurer_id" TEXT NOT NULL,
    "provider_number" TEXT,
    "api_key" TEXT,
    "custom_sla_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinic_insurers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "description" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "user_id" TEXT,
    "case_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingested_emails" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_text" TEXT,
    "body_html" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "linked_case_id" TEXT,
    "processing_error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingested_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "default_sla_days" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth0_id_key" ON "users"("auth0_id");

-- CreateIndex
CREATE UNIQUE INDEX "cases_reference_number_key" ON "cases"("reference_number");

-- CreateIndex
CREATE INDEX "cases_clinic_id_status_idx" ON "cases"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "cases_assigned_to_id_idx" ON "cases"("assigned_to_id");

-- CreateIndex
CREATE INDEX "cases_sla_deadline_idx" ON "cases"("sla_deadline");

-- CreateIndex
CREATE INDEX "cases_reference_number_idx" ON "cases"("reference_number");

-- CreateIndex
CREATE INDEX "case_status_history_case_id_idx" ON "case_status_history"("case_id");

-- CreateIndex
CREATE INDEX "case_notes_case_id_idx" ON "case_notes"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurers_name_key" ON "insurers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "insurers_code_key" ON "insurers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_insurers_clinic_id_insurer_id_key" ON "clinic_insurers"("clinic_id", "insurer_id");

-- CreateIndex
CREATE INDEX "documents_case_id_idx" ON "documents"("case_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_case_id_idx" ON "audit_logs"("case_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ingested_emails_message_id_key" ON "ingested_emails"("message_id");

-- CreateIndex
CREATE INDEX "ingested_emails_processed_idx" ON "ingested_emails"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "referral_types_name_key" ON "referral_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "referral_types_code_key" ON "referral_types"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_insurer_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_insurers" ADD CONSTRAINT "clinic_insurers_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_insurers" ADD CONSTRAINT "clinic_insurers_insurer_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
