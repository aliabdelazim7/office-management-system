const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Auto-detect environment variables for Supabase (Project: qoichebalcttuulbodtt)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://qoichebalcttuulbodtt.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaWNoZWJhbGN0dHV1bGJvZHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDI1NDQsImV4cCI6MjEwMDExODU0NH0.u5T-T5gGBO8Bk2W4PD8lG4L-x_FSkheY4pfRvqr-Bwg';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_URL ||
    'file:./dev.db';
}

let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (e) {
  console.warn('Prisma initialization skipped:', e.message);
}

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Office ERP Standalone Backend API (Supabase Project: qoichebalcttuulbodtt)',
    timestamp: new Date().toISOString(),
  });
});

// Auth Endpoints
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  res.json({
    success: true,
    token: 'demo-jwt-token-active-session',
    user: {
      id: 'usr-owner-001',
      name: 'د. أحمد عبد الفتاح (المالك)',
      email: email || 'owner@elite.com',
      role: 'OWNER',
      jobTitle: 'المدير التنفيذي والمالك',
    },
    tenant: {
      id: 'tnt-elite-001',
      name: 'مكتب النخبة للخدمات والاستشارات الحكومية والمالية',
      subdomain: 'elite-consulting',
    },
  });
});

app.get('/api/v1/auth/me', (req, res) => {
  res.json({
    id: 'usr-owner-001',
    name: 'د. أحمد عبد الفتاح (المالك)',
    email: 'owner@elite.com',
    role: 'OWNER',
    jobTitle: 'المدير التنفيذي والمالك',
    tenant: {
      id: 'tnt-elite-001',
      name: 'مكتب النخبة للخدمات والاستشارات الحكومية والمالية',
      subdomain: 'elite-consulting',
    },
  });
});

// Clients (CRM)
app.get('/api/v1/clients', async (req, res) => {
  if (prisma) {
    try {
      const clients = await prisma.client.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
      if (clients && clients.length > 0) return res.json({ success: true, data: clients });
    } catch (e) {
      console.warn('DB client fetch fallback:', e.message);
    }
  }

  res.json({
    success: true,
    data: [
      { id: 'cli-1001', clientCode: 'CLI-1001', name: 'المهندس طارق منصور', companyName: 'شركة المصرية للحلول البرمجية', tradeName: 'إيجيبت تيك Soft', phone: '01211112222', legalType: 'LLC', branchesCount: 2 },
      { id: 'cli-1002', clientCode: 'CLI-1002', name: 'الحاج مصطفى السعيد', companyName: 'مؤسسة السعيد للمقاولات والتوريدات', tradeName: 'السعيد جروب', phone: '01199998888', legalType: 'SOLE_PROPRIETORSHIP', branchesCount: 3 },
    ],
  });
});

app.post('/api/v1/clients', async (req, res) => {
  const body = req.body || {};
  if (prisma) {
    try {
      const newClient = await prisma.client.create({
        data: {
          tenantId: 'tnt-elite-001',
          clientCode: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
          name: body.name || 'عميل جديد',
          companyName: body.companyName || 'شركة جديدة',
          tradeName: body.tradeName,
          phone: body.phone || '01000000000',
          legalType: body.legalType || 'LLC',
          branchesCount: Number(body.branchesCount) || 1,
        },
      });
      return res.json({ success: true, data: newClient });
    } catch (e) {
      console.warn('Create client fallback:', e.message);
    }
  }
  res.json({ success: true, data: { id: `cli-${Date.now()}`, ...body } });
});

// Documents Vault
app.get('/api/v1/documents', async (req, res) => {
  if (prisma) {
    try {
      const docs = await prisma.document.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
      if (docs && docs.length > 0) return res.json({ success: true, data: docs });
    } catch (e) {
      console.warn('DB docs fetch fallback:', e.message);
    }
  }

  res.json({
    success: true,
    data: [
      { id: 'doc-1', title: 'السجل التجاري الرئيسي الموثق', clientName: 'شركة المصرية للحلول البرمجية', category: 'سجل تجاري', fileType: 'PDF', expiryDate: '2026-08-04', daysRemaining: 15 },
      { id: 'doc-2', title: 'البطاقة الضريبية ومأمورية الاستثمار', clientName: 'شركة المصرية للحلول البرمجية', category: 'بطاقة ضريبية', fileType: 'PDF', expiryDate: '2026-08-04', daysRemaining: 15 },
    ],
  });
});

// Search
app.get('/api/v1/search', (req, res) => {
  const q = req.query.q || '';
  res.json({
    query: q,
    results: [
      { type: 'عميل', title: 'شركة المصرية للحلول البرمجية', detail: 'كود: CLI-1001', link: '/dashboard/crm' },
      { type: 'سجل تجاري', title: 'سجل تجاري رقم CR-994821', detail: 'ينتهي خلال 15 يوماً', link: '/dashboard/commercial-registers' },
    ],
  });
});

// Fallback Route
app.use((req, res) => {
  res.json({ status: 'ok', message: 'Office ERP Backend API Serverless Active', path: req.path });
});

module.exports = app;
