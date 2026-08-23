-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('resident', 'admin');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('plumbing', 'electrical', 'civil_structural', 'elevator', 'security', 'housekeeping', 'parking', 'other');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'resident',
    "flat_number" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "raw_complaint_text" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL DEFAULT 'other',
    "extracted_details" JSONB,
    "priority" "Priority",
    "priority_score" DOUBLE PRECISION,
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "assigned_to" TEXT,
    "embedding" vector(1024),
    "is_duplicate_of" TEXT,
    "sla_due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
