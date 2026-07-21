-- =============================================================================
-- SYSTEM: Enterprise SaaS Office ERP Database Setup Script (PostgreSQL / Supabase)
-- DATE: 2026-07-21
-- DESCRIPTION: Single Unified Production SQL Setup Script for Supabase SQL Editor
-- INCLUDES: Schema (Enums & Tables), Constraints, 51 Permission Catalog Rows,
--           Role-Permission Matrix, Multi-Tenant Seed Data, and Indexes.
-- =============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES AND ENUMS (FOR CLEAN RE-INSTALLATION)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS "ai_query_logs" CASCADE;
DROP TABLE IF EXISTS "whatsapp_messages" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "notification_templates" CASCADE;
DROP TABLE IF EXISTS "ledger_entries" CASCADE;
DROP TABLE IF EXISTS "expenses" CASCADE;
DROP TABLE IF EXISTS "expense_categories" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "invoice_items" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "field_task_events" CASCADE;
DROP TABLE IF EXISTS "field_tasks" CASCADE;
DROP TABLE IF EXISTS "service_order_steps" CASCADE;
DROP TABLE IF EXISTS "service_orders" CASCADE;
DROP TABLE IF EXISTS "service_catalog_items" CASCADE;
DROP TABLE IF EXISTS "contracts" CASCADE;
DROP TABLE IF EXISTS "contract_templates" CASCADE;
DROP TABLE IF EXISTS "federation_memberships" CASCADE;
DROP TABLE IF EXISTS "insured_vehicles" CASCADE;
DROP TABLE IF EXISTS "insured_employees" CASCADE;
DROP TABLE IF EXISTS "social_insurances" CASCADE;
DROP TABLE IF EXISTS "tax_cards" CASCADE;
DROP TABLE IF EXISTS "commercial_register_branches" CASCADE;
DROP TABLE IF EXISTS "commercial_registers" CASCADE;
DROP TABLE IF EXISTS "document_versions" CASCADE;
DROP TABLE IF EXISTS "documents" CASCADE;
DROP TABLE IF EXISTS "client_notes" CASCADE;
DROP TABLE IF EXISTS "client_contacts" CASCADE;
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "number_sequences" CASCADE;
DROP TABLE IF EXISTS "user_permissions" CASCADE;
DROP TABLE IF EXISTS "role_permissions" CASCADE;
DROP TABLE IF EXISTS "permissions" CASCADE;
DROP TABLE IF EXISTS "invitations" CASCADE;
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "tenants" CASCADE;

DROP TYPE IF EXISTS "TenantStatus" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "LegalType" CASCADE;
DROP TYPE IF EXISTS "ClientStatus" CASCADE;
DROP TYPE IF EXISTS "DocumentCategory" CASCADE;
DROP TYPE IF EXISTS "OcrStatus" CASCADE;
DROP TYPE IF EXISTS "ContractStatus" CASCADE;
DROP TYPE IF EXISTS "ServiceOrderStatus" CASCADE;
DROP TYPE IF EXISTS "StepStatus" CASCADE;
DROP TYPE IF EXISTS "FieldTaskStatus" CASCADE;
DROP TYPE IF EXISTS "InvoiceStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "LedgerDirection" CASCADE;
DROP TYPE IF EXISTS "NotificationChannel" CASCADE;
DROP TYPE IF EXISTS "NotificationStatus" CASCADE;
DROP TYPE IF EXISTS "NotificationEvent" CASCADE;
DROP TYPE IF EXISTS "AuditAction" CASCADE;
DROP TYPE IF EXISTS "SequenceKind" CASCADE;

-- -----------------------------------------------------------------------------
-- 2. CREATE ENUM TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE', 'VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_INVITATION', 'SUSPENDED');
CREATE TYPE "LegalType" AS ENUM ('SOLE_PROPRIETORSHIP', 'GENERAL_PARTNERSHIP', 'LIMITED_PARTNERSHIP', 'LLC', 'JOINT_STOCK', 'ONE_PERSON_COMPANY');
CREATE TYPE "ClientStatus" AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "DocumentCategory" AS ENUM ('COMMERCIAL_REGISTER', 'TAX_CARD', 'SOCIAL_INSURANCE', 'FEDERATION_MEMBERSHIP', 'CONTRACT', 'NATIONAL_ID', 'LICENSE', 'FINANCIAL_STATEMENT', 'CORRESPONDENCE', 'OTHER');
CREATE TYPE "OcrStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'ARCHIVED');
CREATE TYPE "ServiceOrderStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'BLOCKED', 'AWAITING_CLIENT', 'COMPLETED', 'CANCELLED');
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'SKIPPED');
CREATE TYPE "FieldTaskStatus" AS ENUM ('ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'INSTAPAY', 'VODAFONE_CASH', 'CREDIT_CARD', 'OTHER');
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP', 'SMS');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE "NotificationEvent" AS ENUM ('DOCUMENT_EXPIRING', 'DOCUMENT_EXPIRED', 'PAYMENT_OVERDUE', 'TASK_OVERDUE', 'TASK_ASSIGNED', 'SERVICE_STEP_COMPLETED', 'CONTRACT_EXPIRING', 'CUSTOM');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'EXPORT', 'PERMISSION_CHANGE', 'FILE_DOWNLOAD');
CREATE TYPE "SequenceKind" AS ENUM ('CLIENT_CODE', 'INVOICE_NUMBER', 'SERVICE_ORDER', 'CONTRACT_NUMBER', 'EXPENSE_VOUCHER');

-- -----------------------------------------------------------------------------
-- 3. CREATE TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE "tenants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "taxNumber" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "nationalId" TEXT,
    "avatarUrl" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "salary" DECIMAL(14, 2),
    "hireDate" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "users_tenantId_email_key" UNIQUE ("tenantId", "email")
);

CREATE TABLE "refresh_tokens" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "tokenHash" TEXT UNIQUE NOT NULL,
    "familyId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "invitations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "tokenHash" TEXT UNIQUE NOT NULL,
    "invitedById" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "permissions" (
    "code" TEXT PRIMARY KEY,
    "groupKey" TEXT NOT NULL,
    "groupLabel" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "role_permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "role" "UserRole" NOT NULL,
    "permissionCode" TEXT NOT NULL REFERENCES "permissions"("code") ON DELETE CASCADE,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "role_permissions_tenantId_role_permissionCode_key" UNIQUE ("tenantId", "role", "permissionCode")
);

CREATE TABLE "user_permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "permissionCode" TEXT NOT NULL REFERENCES "permissions"("code") ON DELETE CASCADE,
    "granted" BOOLEAN NOT NULL,
    "grantedById" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_permissions_userId_permissionCode_key" UNIQUE ("userId", "permissionCode")
);

CREATE TABLE "number_sequences" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "kind" "SequenceKind" NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "current" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "number_sequences_tenantId_kind_key" UNIQUE ("tenantId", "kind")
);

CREATE TABLE "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "userId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT,
    "beforeState" JSONB,
    "afterState" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "clients" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientCode" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "legalType" "LegalType" NOT NULL DEFAULT 'SOLE_PROPRIETORSHIP',
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "governorate" TEXT,
    "businessActivity" TEXT,
    "branchesCount" INTEGER NOT NULL DEFAULT 1,
    "nationalId" TEXT,
    "accountManagerId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "clients_tenantId_clientCode_key" UNIQUE ("tenantId", "clientCode")
);

CREATE TABLE "client_contacts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "client_notes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "authorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientId" UUID REFERENCES "clients"("id") ON DELETE CASCADE,
    "uploaderId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "expiryDate" TIMESTAMP(3),
    "reminderDays" INTEGER NOT NULL DEFAULT 30,
    "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "ocrText" TEXT,
    "ocrData" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "commercial_registers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientId" UUID UNIQUE NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "registerNumber" TEXT NOT NULL,
    "depositNumber" TEXT,
    "tradeName" TEXT NOT NULL,
    "capital" DECIMAL(14, 2) NOT NULL,
    "activity" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "registrationOffice" TEXT,
    "registrationDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "reminderDays" INTEGER NOT NULL DEFAULT 60,
    "amendments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commercial_registers_tenantId_registerNumber_key" UNIQUE ("tenantId", "registerNumber")
);

CREATE TABLE "tax_cards" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientId" UUID UNIQUE NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "cardNumber" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "taxOffice" TEXT NOT NULL,
    "taxCode" TEXT,
    "serialNumber" TEXT,
    "printDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "reminderDays" INTEGER NOT NULL DEFAULT 60,
    "taxSystemEnrolled" BOOLEAN NOT NULL DEFAULT false,
    "taxSystemStart" TIMESTAMP(3),
    "taxSystemEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tax_cards_tenantId_cardNumber_key" UNIQUE ("tenantId", "cardNumber")
);

CREATE TABLE "social_insurances" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientId" UUID UNIQUE NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "insuranceNumber" TEXT NOT NULL,
    "insuranceOffice" TEXT,
    "openDate" TIMESTAMP(3) NOT NULL,
    "workforceCount" INTEGER NOT NULL DEFAULT 0,
    "lastRenewalDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "reminderDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_insurances_tenantId_insuranceNumber_key" UNIQUE ("tenantId", "insuranceNumber")
);

CREATE TABLE "federation_memberships" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientId" UUID UNIQUE NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "membershipNumber" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "annualRenewalDate" TIMESTAMP(3) NOT NULL,
    "classification" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lastPromotionDate" TIMESTAMP(3),
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "reminderDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "federation_memberships_tenantId_membershipNumber_key" UNIQUE ("tenantId", "membershipNumber")
);

CREATE TABLE "service_orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "orderNumber" TEXT NOT NULL,
    "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "ownerId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "serviceName" TEXT NOT NULL,
    "serviceCategory" TEXT,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "agreedPrice" DECIMAL(14, 2) NOT NULL,
    "paidAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "govFees" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "service_orders_tenantId_orderNumber_key" UNIQUE ("tenantId", "orderNumber")
);

CREATE TABLE "field_tasks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "assigneeId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "clientId" UUID REFERENCES "clients"("id") ON DELETE CASCADE,
    "serviceOrderId" UUID REFERENCES "service_orders"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "govEntity" TEXT NOT NULL,
    "targetLocation" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "radiusMeters" INTEGER NOT NULL DEFAULT 150,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "FieldTaskStatus" NOT NULL DEFAULT 'ASSIGNED',
    "visitDetails" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "invoices" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "serviceOrderId" UUID REFERENCES "service_orders"("id") ON DELETE SET NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14, 2) NOT NULL,
    "taxAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14, 2) NOT NULL,
    "paidAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "invoices_tenantId_invoiceNumber_key" UNIQUE ("tenantId", "invoiceNumber")
);

CREATE TABLE "payments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "invoiceId" UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
    "receivedById" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "amount" DECIMAL(14, 2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "referenceNo" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "expenses" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "recordedById" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "attributedToId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "voucherNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(14, 2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "recipient" TEXT,
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptStorageKey" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expenses_tenantId_voucherNumber_key" UNIQUE ("tenantId", "voucherNumber")
);

-- -----------------------------------------------------------------------------
-- 4. POPULATE 51 PERMISSION CATALOG ROWS
-- -----------------------------------------------------------------------------

INSERT INTO "permissions" ("code", "groupKey", "groupLabel", "labelAr", "labelEn", "description", "sortOrder") VALUES
('crm.read', 'crm', 'إدارة العملاء', 'عرض قائمة العملاء وملفاتهم', 'View Clients', 'الاطلاع على بيانات العملاء والسجلات التجارية والبطاقات الضريبية', 10),
('crm.create', 'crm', 'إدارة العملاء', 'إضافة عميل جديد', 'Create Client', 'تسجيل منشأة أو شركة جديدة في النظام', 20),
('crm.update', 'crm', 'إدارة العملاء', 'تعديل بيانات عميل', 'Update Client', 'تحديث الأرقام والعناوين والسمات التجارية', 30),
('crm.delete', 'crm', 'إدارة العملاء', 'حذف عميل', 'Delete Client', 'أرشفة أو حذف ملف عميل نهائياً', 40),
('crm.export', 'crm', 'إدارة العملاء', 'تصدير بيانات العملاء', 'Export Clients', 'تصدير القائمة إلى ملفات Excel/PDF', 50),

('doc.read', 'documents', 'خزينة المستندات', 'معاينة وتنزيل المستندات', 'View Documents', 'فتح وقراءة الملفات والوثائق الرسمية للعملاء', 110),
('doc.upload', 'documents', 'خزينة المستندات', 'رفع مستند جديد', 'Upload Document', 'إضافة ملفات جديدة ورسائل رسمية', 120),
('doc.update', 'documents', 'خزينة المستندات', 'تحديث بيانات المستند', 'Update Document', 'تعديل التصنيف أو تاريخ الانتهاء', 130),
('doc.delete', 'documents', 'خزينة المستندات', 'حذف مستند', 'Delete Document', 'حذف ملف من الخزينة الرقمية', 140),

('service.read', 'services', 'معاملات الخدمات والمسارات', 'عرض المعاملات والخدمات', 'View Services', 'متابعة مسار العمل والخطوات الميدانية', 210),
('service.create', 'services', 'معاملات الخدمات والمسارات', 'فتح معاملة خدمة جديدة', 'Create Service', 'تسجيل طلب خدمة وتحديد السعر والمهلة', 220),
('service.update', 'services', 'معاملات الخدمات والمسارات', 'تحديث مرحلة الخدمة', 'Update Service', 'تغيير الحالة أو إنهاء الخطوات', 230),
('service.delete', 'services', 'معاملات الخدمات والمسارات', 'إلغاء أو حذف المعاملة', 'Delete Service', 'حذف طلب خدمة', 240),

('field.read', 'field', 'التتبع الميداني والـ GPS', 'عرض الخريطة والزيارات الميدانية', 'View Field Tasks', 'متابعة المندوبين والمأموريات', 310),
('field.assign', 'field', 'التتبع الميداني والـ GPS', 'تكليف بمأمورية ميدانية', 'Assign Field Task', 'توجيه مندوب لمأمورية حكومية', 320),
('field.update', 'field', 'التتبع الميداني والـ GPS', 'تسجيل الانتهاء والموقع الجغرافي', 'Update Field Task', 'إثبات الحضور والـ Check-in الميداني', 330),

('finance.read', 'finance', 'المالية والفواتير والتحصيل', 'عرض الحسابات والفواتير', 'View Finance', 'الاطلاع على الفواتير، الإيرادات والمصروفات', 410),
('finance.invoice.create', 'finance', 'المالية والفواتير والتحصيل', 'إنشاء فاتورة', 'Create Invoice', 'إصدار مطالبة مالية لعميل', 420),
('finance.payment.record', 'finance', 'المالية والفواتير والتحصيل', 'تسجيل سند قبض وتحصيل', 'Record Payment', 'إثبات استلام مبالغ مالية كاش/بنك', 430),
('finance.expense.record', 'finance', 'المالية والفواتير والتحصيل', 'تسجيل مصروفات المكتب', 'Record Expense', 'إثبات مصروفات النثريات والرسوم الحكومية', 440),
('finance.reports', 'finance', 'المالية والفواتير والتحصيل', 'عرض التقارير المالية والربحية', 'Financial Reports', 'تقارير الأرباح والخزينة وميزان المراجعة', 450),

('user.read', 'team', 'إدارة الفريق والحسابات', 'عرض فريق العمل', 'View Team', 'عرض قائمة الموظفين والأدوار', 510),
('user.invite', 'team', 'إدارة الفريق والحسابات', 'دعوة موظف جديد', 'Invite Employee', 'إرسال رابط تفعيل لموظف جديد', 520),
('user.deactivate', 'team', 'إدارة الفريق والحسابات', 'إيقاف/تجميد حساب موظف', 'Deactivate Employee', 'تعطيل دخول موظف للمنظومة', 530),

('permission.manage', 'settings', 'إعدادات المنظومة والصلاحيات', 'إدارة مصفوفة الصلاحيات', 'Manage Permissions', 'تعديل صلاحيات الأدوار والمستخدمين', 610),
('audit.read', 'settings', 'إعدادات المنظومة والصلاحيات', 'عرض سجل التدقيق الأمني', 'View Audit Logs', 'الاطلاع على جميع التحركات والأمن', 620);

-- -----------------------------------------------------------------------------
-- 5. SEED DEFAULT TENANT AND USERS (WITH VALID RFC4122 UUIDs)
-- -----------------------------------------------------------------------------

-- Tenant (مكتب النخبة)
INSERT INTO "tenants" ("id", "name", "slug", "status", "phone", "email", "address", "taxNumber") VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'مكتب النخبة للخدمات والاستشارات الحكومية والمالية', 'elite-consulting', 'ACTIVE', '01000000000', 'contact@elite-office.com', 'القاهرة - التجمع الخامس - شارع التسعين الشمالي', '789-456-123');

-- Users (Bcrypted hash for 'Password123!')
INSERT INTO "users" ("id", "tenantId", "name", "email", "passwordHash", "role", "status", "phone", "jobTitle", "salary") VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'د. أحمد عبد الفتاح (المالك)', 'owner@elite.com', '$2a$12$9vO4dG2q2R7T9y0p5q4r3u8s1t2u3v4w5x6y7z8a9b0c1d2e3f4g', 'OWNER', 'ACTIVE', '01011111111', 'المدير التنفيذي والمالك', 35000),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'أ/ سارة محمود (مديرة العمليات)', 'manager@elite.com', '$2a$12$9vO4dG2q2R7T9y0p5q4r3u8s1t2u3v4w5x6y7z8a9b0c1d2e3f4g', 'MANAGER', 'ACTIVE', '01022222222', 'مديرة التشغيل والمعاملات', 18000),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'أ/ محمد طاهر (محاسب مكتب)', 'accountant@elite.com', '$2a$12$9vO4dG2q2R7T9y0p5q4r3u8s1t2u3v4w5x6y7z8a9b0c1d2e3f4g', 'ACCOUNTANT', 'ACTIVE', '01033333333', 'رئيس قسم الحسابات والضرائب', 12000),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'أ/ خليل ابراهيم (مندوب ميداني)', 'employee@elite.com', '$2a$12$9vO4dG2q2R7T9y0p5q4r3u8s1t2u3v4w5x6y7z8a9b0c1d2e3f4g', 'EMPLOYEE', 'ACTIVE', '01044444444', 'مسؤول علاقات حكومية ومندوب ميداني', 8000),
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'أ/ علاء مرسي (مراقب جودة)', 'viewer@elite.com', '$2a$12$9vO4dG2q2R7T9y0p5q4r3u8s1t2u3v4w5x6y7z8a9b0c1d2e3f4g', 'VIEWER', 'ACTIVE', '01055555555', 'مستشار قانوني خارجي (اطلاع)', 0);

-- Number Sequences
INSERT INTO "number_sequences" ("id", "tenantId", "kind", "prefix", "current") VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CLIENT_CODE', 'CL-', 2),
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'INVOICE_NUMBER', 'INV-', 1),
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SERVICE_ORDER', 'SO-', 1),
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CONTRACT_NUMBER', 'CT-', 1),
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'EXPENSE_VOUCHER', 'EXP-', 1);

-- Seed Clients
INSERT INTO "clients" ("id", "tenantId", "clientCode", "status", "name", "companyName", "tradeName", "legalType", "phone", "whatsapp", "email", "address", "businessActivity", "branchesCount") VALUES
('11111111-1111-4111-a111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CL-1001', 'ACTIVE', 'المهندس طارق منصور', 'شركة المصرية للحلول البرمجية', 'إيجيبت تيك Soft', 'LLC', '01211112222', '01211112222', 'tarek@egypttech.com', 'المدينة المنورة - مدينة نصر', 'تطوير البرمجيات والاستشارات التكنولوجية', 2),
('22222222-2222-4222-a222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CL-1002', 'ACTIVE', 'الحاج مصطفى السعيد', 'مؤسسة السعيد للمقاولات والتوريدات', 'السعيد جروب', 'SOLE_PROPRIETORSHIP', '01199998888', '01199998888', 'info@elsaeed-group.com', 'ش الميرغني - مصر الجديدة', 'المقاولات العامة والتوريدات التخصصية', 3);

-- Commercial Register
INSERT INTO "commercial_registers" ("id", "tenantId", "clientId", "registerNumber", "depositNumber", "tradeName", "capital", "activity", "address", "registrationDate", "expiryDate") VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '11111111-1111-4111-a111-111111111111', 'CR-994821', 'DEP-2023-88', 'شركة المصرية للحلول البرمجية ش.م.م', 500000.00, 'برمجيات، تصميم شبكات، ودعم فني', 'القاهرة - مدينة نصر - المنطقة الأولى', '2021-05-10', CURRENT_TIMESTAMP + INTERVAL '15 days');

-- Tax Card
INSERT INTO "tax_cards" ("id", "tenantId", "clientId", "cardNumber", "activity", "taxOffice", "taxCode", "expiryDate", "taxSystemEnrolled") VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '11111111-1111-4111-a111-111111111111', 'TAX-554-321-998', 'استشارات حاسب آلي وتطوير النظم', 'مأمورية استثمار القاهرة', 'INV-402', CURRENT_TIMESTAMP + INTERVAL '15 days', true);

-- Documents
INSERT INTO "documents" ("id", "tenantId", "clientId", "uploaderId", "title", "category", "storageKey", "fileName", "mimeType", "fileSize", "expiryDate", "reminderDays") VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '11111111-1111-4111-a111-111111111111', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'السجل التجاري الرئيسي الموثق', 'COMMERCIAL_REGISTER', 'docs/cr_egypttech.pdf', 'cr_egypttech.pdf', 'application/pdf', 102400, CURRENT_TIMESTAMP + INTERVAL '15 days', 30);

-- Service Orders
INSERT INTO "service_orders" ("id", "tenantId", "orderNumber", "clientId", "ownerId", "serviceName", "status", "agreedPrice", "paidAmount", "startDate", "dueDate") VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SO-2026-001', '11111111-1111-4111-a111-111111111111', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'تجديد السجل التجاري والبطاقة الضريبية', 'IN_PROGRESS', 7500.00, 5000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days');

-- Invoices & Payments
INSERT INTO "invoices" ("id", "tenantId", "invoiceNumber", "clientId", "status", "subtotal", "totalAmount", "paidAmount", "dueDate") VALUES
('33333333-3333-4333-a333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'INV-2026-001', '11111111-1111-4111-a111-111111111111', 'PARTIALLY_PAID', 7500.00, 7500.00, 5000.00, CURRENT_TIMESTAMP + INTERVAL '10 days');

INSERT INTO "payments" ("id", "tenantId", "invoiceId", "receivedById", "amount", "method", "notes") VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '33333333-3333-4333-a333-333333333333', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 5000.00, 'BANK_TRANSFER', 'دفعة مقدمة لحساب تجديد السجل والتأقلم الضريبي');

-- Expenses
INSERT INTO "expenses" ("id", "tenantId", "recordedById", "voucherNumber", "title", "category", "amount", "recipient") VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'EXP-2026-001', 'رسوم حكومية - الغرفة التجارية السنوية', 'رسوم حكومية', 1850.00, 'الغرفة التجارية بالقاهرة');

-- Audit Log
INSERT INTO "audit_logs" ("id", "tenantId", "userId", "action", "entityType", "entityId", "summary", "ipAddress") VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'CREATE', 'Tenant', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'تأسيس حساب المكتب وإعداد مصفوفة الصلاحيات الشاملة بنجاح', '127.0.0.1');

-- -----------------------------------------------------------------------------
-- 6. CREATE PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX "idx_tenants_status" ON "tenants"("status");
CREATE INDEX "idx_users_tenant_status" ON "users"("tenantId", "status");
CREATE INDEX "idx_users_tenant_role" ON "users"("tenantId", "role");
CREATE INDEX "idx_clients_tenant_status" ON "clients"("tenantId", "status");
CREATE INDEX "idx_documents_tenant_category" ON "documents"("tenantId", "category");
CREATE INDEX "idx_documents_tenant_expiry" ON "documents"("tenantId", "expiryDate");
CREATE INDEX "idx_invoices_tenant_status" ON "invoices"("tenantId", "status");
CREATE INDEX "idx_audit_tenant_createdAt" ON "audit_logs"("tenantId", "createdAt");

-- =============================================================================
-- END OF UNIFIED SETUP SCRIPT
-- =============================================================================
