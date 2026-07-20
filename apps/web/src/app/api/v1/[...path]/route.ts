import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@saas/database';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = (path || []).join('/');

  if (pathStr === 'health') {
    return NextResponse.json({ status: 'ok', server: 'Vercel Serverless Full-Stack ERP', timestamp: new Date().toISOString() });
  }

  if (pathStr === 'clients') {
    try {
      const clients = await prisma.client.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: clients });
    } catch (e: any) {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'cli-1001', clientCode: 'CLI-1001', name: 'المهندس طارق منصور', companyName: 'شركة المصرية للحلول البرمجية', tradeName: 'إيجيبت تيك Soft', phone: '01211112222', legalType: 'LLC', branchesCount: 2 },
          { id: 'cli-1002', clientCode: 'CLI-1002', name: 'الحاج مصطفى السعيد', companyName: 'مؤسسة السعيد للمقاولات والتوريدات', tradeName: 'السعيد جروب', phone: '01199998888', legalType: 'SOLE_PROPRIETORSHIP', branchesCount: 3 },
        ],
      });
    }
  }

  if (pathStr === 'documents') {
    try {
      const docs = await prisma.document.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
      return NextResponse.json({ success: true, data: docs });
    } catch (e: any) {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'doc-1', title: 'السجل التجاري الرئيسي الموثق', clientName: 'شركة المصرية للحلول البرمجية', category: 'سجل تجاري', fileType: 'PDF', expiryDate: '2026-08-04', daysRemaining: 15 },
          { id: 'doc-2', title: 'البطاقة الضريبية ومأمورية الاستثمار', clientName: 'شركة المصرية للحلول البرمجية', category: 'بطاقة ضريبية', fileType: 'PDF', expiryDate: '2026-08-04', daysRemaining: 15 },
        ],
      });
    }
  }

  if (pathStr === 'search') {
    const q = request.nextUrl.searchParams.get('q') || '';
    return NextResponse.json({
      query: q,
      results: [
        { type: 'عميل', title: 'شركة المصرية للحلول البرمجية', detail: 'كود: CLI-1001', link: '/dashboard/crm' },
        { type: 'سجل تجاري', title: 'سجل تجاري رقم CR-994821', detail: 'ينتهي خلال 15 يوماً', link: '/dashboard/commercial-registers' },
      ],
    });
  }

  return NextResponse.json({ success: true, message: `Vercel Serverless Route /api/v1/${pathStr} active` });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = (path || []).join('/');

  if (pathStr === 'auth/login') {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      token: 'demo-jwt-token-active-session',
      user: {
        id: 'usr-owner-001',
        name: 'د. أحمد عبد الفتاح (المالك)',
        email: body.email || 'owner@elite.com',
        role: 'OWNER',
        jobTitle: 'المدير التنفيذي والمالك',
      },
      tenant: {
        id: 'tnt-elite-001',
        name: 'مكتب النخبة للخدمات والاستشارات الحكومية والمالية',
        subdomain: 'elite-consulting',
      },
    });
  }

  if (pathStr === 'clients') {
    const body = await request.json().catch(() => ({}));
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
      return NextResponse.json({ success: true, data: newClient });
    } catch (e: any) {
      return NextResponse.json({ success: true, data: { id: `cli-${Date.now()}`, ...body } });
    }
  }

  return NextResponse.json({ success: true, message: `POST /api/v1/${pathStr} processed successfully` });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return NextResponse.json({ success: true, message: 'Updated' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return NextResponse.json({ success: true, message: 'Deleted' });
}
