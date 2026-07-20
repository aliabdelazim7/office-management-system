-- =============================================================================
-- SYSTEM: Enterprise SaaS Office ERP Database Setup Script (PostgreSQL / Supabase)
-- DATE: 2026-07-20
-- AUTHOR: Full Stack Software Engineering Team
-- DESCRIPTION: Complete DDL Schema + Multi-Tenant Seed Data for Integrated Office Management
-- =============================================================================

-- 1. DROP EXISTING TABLES AND ENUMS (FOR CLEAN RE-INSTALLATION)
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "FieldLog" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Expense" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "ServiceOrder" CASCADE;
DROP TABLE IF EXISTS "FederationMembership" CASCADE;
DROP TABLE IF EXISTS "SocialInsurance" CASCADE;
DROP TABLE IF EXISTS "TaxCard" CASCADE;
DROP TABLE IF EXISTS "CommercialRegister" CASCADE;
DROP TABLE IF EXISTS "IncorporationContract" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Client" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;

DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "LegalType" CASCADE;
DROP TYPE IF EXISTS "TaskStatus" CASCADE;
DROP TYPE IF EXISTS "InvoiceStatus" CASCADE;

-- 2. CREATE ENUM TYPES
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE', 'VIEWER');
CREATE TYPE "LegalType" AS ENUM ('SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LIMITED_PARTNERSHIP', 'LLC', 'JOINT_STOCK', 'SINGLE_PERSON');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'UNPAID', 'PARTIAL', 'PAID');

-- 3. CREATE TABLES

-- Tenants Table (المكاتب / الشركات المستأجرة)
CREATE TABLE "Tenant" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subdomain" TEXT UNIQUE NOT NULL,
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "taxNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (المستخدمون وفريق العمل)
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "phone" TEXT,
    "nationalId" TEXT,
    "jobTitle" TEXT,
    "salary" DOUBLE PRECISION,
    "hireDate" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table (سجل العملاء والكيانات)
CREATE TABLE "Client" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "clientCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "businessActivity" TEXT,
    "legalType" "LegalType" NOT NULL DEFAULT 'SOLE_PROPRIETORSHIP',
    "branchesCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table (خزينة المستندات الرقمية)
CREATE TABLE "Document" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "uploaderId" TEXT NOT NULL REFERENCES "User"("id"),
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "reminderDays" INTEGER NOT NULL DEFAULT 30,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Incorporation Contracts Table (عقود التأسيس)
CREATE TABLE "IncorporationContract" (
    "id" TEXT PRIMARY KEY,
    "clientId" TEXT UNIQUE NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "contractNumber" TEXT NOT NULL,
    "contractDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "fileUrl" TEXT,
    "templateData" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Commercial Registers Table (السجل التجاري)
CREATE TABLE "CommercialRegister" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "clientId" TEXT UNIQUE NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "registerNumber" TEXT NOT NULL,
    "depositNumber" TEXT,
    "tradeName" TEXT NOT NULL,
    "capital" DOUBLE PRECISION NOT NULL,
    "activity" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "branches" TEXT,
    "additions" TEXT,
    "registrationDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "reminderDays" INTEGER NOT NULL DEFAULT 30
);

-- Tax Cards Table (البطاقة الضريبية)
CREATE TABLE "TaxCard" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "clientId" TEXT UNIQUE NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "cardNumber" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "taxOffice" TEXT NOT NULL,
    "taxCode" TEXT,
    "serialNumber" TEXT,
    "printDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "taxSystemStatus" TEXT,
    "taxSystemStart" TIMESTAMP(3),
    "taxSystemEnd" TIMESTAMP(3),
    "vehiclesData" TEXT
);

-- Social Insurance Table (التأمينات الاجتماعية)
CREATE TABLE "SocialInsurance" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "clientId" TEXT UNIQUE NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "insuranceNumber" TEXT NOT NULL,
    "openDate" TIMESTAMP(3) NOT NULL,
    "workforceCount" INTEGER NOT NULL DEFAULT 0,
    "registeredEmployees" TEXT,
    "vehiclesData" TEXT,
    "lastRenewalDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3)
);

-- Federation Membership Table (الاتحاد المصري)
CREATE TABLE "FederationMembership" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "clientId" TEXT UNIQUE NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "membershipNumber" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "annualRenewalDate" TIMESTAMP(3) NOT NULL,
    "classification" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lastPromotionDate" TIMESTAMP(3),
    "experienceYears" INTEGER NOT NULL DEFAULT 0
);

-- Service Orders Table (الخدمات والمسارات Workflow)
CREATE TABLE "ServiceOrder" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "assignedStaffId" TEXT REFERENCES "User"("id"),
    "serviceName" TEXT NOT NULL,
    "agreedPrice" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "stepsData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Field Logs Table (تتبع حركة الـ GPS الميدانية)
CREATE TABLE "FieldLog" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "clientId" TEXT REFERENCES "Client"("id"),
    "govEntity" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "details" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "delayReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table (الفواتير والحسابات)
CREATE TABLE "Invoice" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "serviceOrderId" TEXT REFERENCES "ServiceOrder"("id"),
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table (سندات القبض والتحصيل)
CREATE TABLE "Payment" (
    "id" TEXT PRIMARY KEY,
    "invoiceId" TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT
);

-- Expenses Table (المصروفات)
CREATE TABLE "Expense" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "recipient" TEXT,
    "paidBy" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT
);

-- Audit Logs Table (سجل التدقيق والأمان)
CREATE TABLE "AuditLog" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "beforeState" TEXT,
    "afterState" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX "idx_user_tenant" ON "User"("tenantId");
CREATE INDEX "idx_client_tenant" ON "Client"("tenantId");
CREATE INDEX "idx_doc_tenant" ON "Document"("tenantId");
CREATE INDEX "idx_cr_tenant" ON "CommercialRegister"("tenantId");
CREATE INDEX "idx_tax_tenant" ON "TaxCard"("tenantId");
CREATE INDEX "idx_service_tenant" ON "ServiceOrder"("tenantId");
CREATE INDEX "idx_invoice_tenant" ON "Invoice"("tenantId");
CREATE INDEX "idx_fieldlog_tenant" ON "FieldLog"("tenantId");
CREATE INDEX "idx_audit_tenant" ON "AuditLog"("tenantId");

-- 5. SEED INITIAL REALISTIC ARABIC DEMO DATA

-- Seed Tenant
INSERT INTO "Tenant" ("id", "name", "subdomain", "phone", "email", "address", "taxNumber") VALUES
('tnt-elite-001', 'مكتب النخبة للخدمات والاستشارات الحكومية والمالية', 'elite-consulting', '01000000000', 'contact@elite-office.com', 'القاهرة - التجمع الخامس - شارع التسعين الشمالي', '789-456-123');

-- Seed Users for all 5 Roles
INSERT INTO "User" ("id", "tenantId", "name", "email", "passwordHash", "role", "phone", "jobTitle", "salary") VALUES
('usr-owner-001', 'tnt-elite-001', 'د. أحمد عبد الفتاح (المالك)', 'owner@elite.com', '$2a$10$e7W...hash', 'OWNER', '01011111111', 'المدير التنفيذي والمالك', 35000),
('usr-mgr-001', 'tnt-elite-001', 'أ/ سارة محمود (مديرة العمليات)', 'manager@elite.com', '$2a$10$e7W...hash', 'MANAGER', '01022222222', 'مديرة التشغيل والمعاملات', 18000),
('usr-acc-001', 'tnt-elite-001', 'أ/ محمد طاهر (محاسب مكتب)', 'accountant@elite.com', '$2a$10$e7W...hash', 'ACCOUNTANT', '01033333333', 'رئيس قسم الحسابات والضرائب', 12000),
('usr-emp-001', 'tnt-elite-001', 'أ/ خليل ابراهيم (مندوب ميداني)', 'employee@elite.com', '$2a$10$e7W...hash', 'EMPLOYEE', '01044444444', 'مسؤول علاقات حكومية ومندوب ميداني', 8000),
('usr-view-001', 'tnt-elite-001', 'أ/ علاء مرسي (مراقب جودة)', 'viewer@elite.com', '$2a$10$e7W...hash', 'VIEWER', '01055555555', 'مستشار قانوني خارجي (اطلاع)', 0);

-- Seed Clients
INSERT INTO "Client" ("id", "tenantId", "clientCode", "name", "companyName", "tradeName", "phone", "whatsapp", "email", "address", "businessActivity", "legalType", "branchesCount") VALUES
('cli-1001', 'tnt-elite-001', 'CLI-1001', 'المهندس طارق منصور', 'شركة المصرية للحلول البرمجية', 'إيجيبت تيك Soft', '01211112222', '01211112222', 'tarek@egypttech.com', 'المدينة المنورة - مدينة نصر', 'تطوير البرمجيات والاستشارات التكنولوجية', 'LLC', 2),
('cli-1002', 'tnt-elite-001', 'CLI-1002', 'الحاج مصطفى السعيد', 'مؤسسة السعيد للمقاولات والتوريدات', 'السعيد جروب', '01199998888', '01199998888', 'info@elsaeed-group.com', 'ش الميرغني - مصر الجديدة', 'المقاولات العامة والتوريدات التخصصية', 'SOLE_PROPRIETORSHIP', 3);

-- Seed Commercial Register & Tax Card
INSERT INTO "CommercialRegister" ("id", "tenantId", "clientId", "registerNumber", "depositNumber", "tradeName", "capital", "activity", "address", "registrationDate", "expiryDate") VALUES
('cr-1001', 'tnt-elite-001', 'cli-1001', 'CR-994821', 'DEP-2023-88', 'شركة المصرية للحلول البرمجية ش.م.م', 500000, 'برمجيات، تصميم شبكات، ودعم فني', 'القاهرة - مدينة نصر - المنطقة الأولى', '2021-05-10', CURRENT_TIMESTAMP + INTERVAL '15 days');

INSERT INTO "TaxCard" ("id", "tenantId", "clientId", "cardNumber", "activity", "taxOffice", "taxCode", "expiryDate", "taxSystemStatus") VALUES
('tc-1001', 'tnt-elite-001', 'cli-1001', 'TAX-554-321-998', 'استشارات حاسب آلي وتطوير النظم', 'مأمورية استثمار القاهرة', 'INV-402', CURRENT_TIMESTAMP + INTERVAL '15 days', 'مسجل بالفاتورة الإلكترونية');

-- Seed Documents
INSERT INTO "Document" ("id", "tenantId", "clientId", "uploaderId", "title", "category", "fileUrl", "fileType", "expiryDate", "reminderDays", "isExpired") VALUES
('doc-1001', 'tnt-elite-001', 'cli-1001', 'usr-mgr-001', 'السجل التجاري الرئيسي الموثق', 'سجل تجاري', '/uploads/cr_egypttech.pdf', 'pdf', CURRENT_TIMESTAMP + INTERVAL '15 days', 30, false);

-- Seed Services Workflow
INSERT INTO "ServiceOrder" ("id", "tenantId", "orderNumber", "clientId", "assignedStaffId", "serviceName", "agreedPrice", "startDate", "dueDate", "status", "notes", "stepsData") VALUES
('srv-1001', 'tnt-elite-001', 'SRV-2026-001', 'cli-1001', 'usr-emp-001', 'تجديد السجل التجاري والبطاقة الضريبية', 7500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', 'IN_PROGRESS', 'العميل يطلب سرعة الإنجاز نظراً لموعد المناقصة', '[{"stepIndex":1,"title":"استلام الأوراق الأصلية","status":"COMPLETED"},{"stepIndex":2,"title":"مراجعة المستندات والتسديد","status":"IN_PROGRESS"},{"stepIndex":3,"title":"استلام السجل الجديد","status":"PENDING"}]');

-- Seed Field GPS Visit Log
INSERT INTO "FieldLog" ("id", "tenantId", "userId", "clientId", "govEntity", "locationName", "latitude", "longitude", "details", "status") VALUES
('fld-1001', 'tnt-elite-001', 'usr-emp-001', 'cli-1001', 'مأمورية ضرائب الاستثمار - مجمع نصر', 'مدينة نصر - الحي السابع', 30.0561, 31.3302, 'تقديم طلب التجديد وتسليم النموذج الضريبي 10', 'IN_PROGRESS');

-- Seed Invoices & Payments
INSERT INTO "Invoice" ("id", "tenantId", "invoiceNumber", "clientId", "serviceOrderId", "totalAmount", "paidAmount", "remainingAmount", "status", "dueDate") VALUES
('inv-1001', 'tnt-elite-001', 'INV-2026-001', 'cli-1001', 'srv-1001', 7500, 5000, 2500, 'PARTIAL', CURRENT_TIMESTAMP + INTERVAL '10 days');

INSERT INTO "Payment" ("id", "invoiceId", "amount", "paymentMethod", "receivedBy", "notes") VALUES
('pay-1001', 'inv-1001', 5000, 'تحويل بنكي / فوري', 'أ/ محمد طاهر (محاسب مكتب)', 'دفعة مقدمة لحساب تجديد السجل');

-- Seed Expenses
INSERT INTO "Expense" ("id", "tenantId", "title", "category", "amount", "recipient", "paidBy") VALUES
('exp-1001', 'tnt-elite-001', 'رسوم حكومية - الغرفة التجارية السنوية', 'رسوم حكومية', 1850, 'الغرفة التجارية بالقاهرة', 'أ/ خليل ابراهيم');

-- Seed Audit Log
INSERT INTO "AuditLog" ("id", "tenantId", "userId", "action", "entityType", "entityId", "details", "ipAddress", "deviceInfo") VALUES
('aud-1001', 'tnt-elite-001', 'usr-owner-001', 'TENANT_INITIALIZED', 'Tenant', 'tnt-elite-001', 'تم إنشاء وتأسيس حساب المكتب وتجهيز الصلاحيات الإدارية والخزينة', '127.0.0.1', 'Chrome / Windows Server');
