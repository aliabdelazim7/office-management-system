'use client';

import React from 'react';
import {
  Users,
  Building2,
  FileWarning,
  Wallet,
  ArrowUpRight,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  MapPin,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

export default function ExecutiveDashboard() {
  const { user } = useAuthStore();

  const kpiCards = [
    { title: 'إجمالي العملاء والشركات', value: '48 عميل', change: '+12% هذا الشهر', icon: Users, color: 'from-blue-600 to-sky-500' },
    { title: 'الإيرادات الشهرية المحصلة', value: '145,000 ج.م', change: '+18.5% نمو', icon: Wallet, color: 'from-emerald-600 to-teal-500' },
    { title: 'مستندات تقترب من الانتهاء', value: '3 مستندات', change: 'يلزم التجديد خلال 30 يوم', icon: FileWarning, color: 'from-amber-600 to-orange-500' },
    { title: 'الخدمات المفتوحة والميدانية', value: '14 معاملة', change: '8 معاملات جارية الآن', icon: Clock, color: 'from-indigo-600 to-purple-500' },
  ];

  const expiringAlerts = [
    { type: 'سجل تجاري', company: 'شركة المصرية للحلول البرمجية', number: 'CR-994821', days: 15, urgency: 'HIGH' },
    { type: 'بطاقة ضريبية', company: 'شركة المصرية للحلول البرمجية', number: 'TAX-554-321', days: 15, urgency: 'HIGH' },
    { type: 'سجل تجاري', company: 'مؤسسة السعيد للمقاولات', number: 'CR-104928', days: 90, urgency: 'LOW' },
  ];

  const recentServices = [
    { order: 'SRV-2026-001', client: 'شركة المصرية للحلول البرمجية', service: 'تجديد السجل التجاري والبطاقة الضريبية', staff: 'أ/ خليل ابراهيم (مندوب)', status: 'IN_PROGRESS', amount: '7,500 ج.م' },
    { order: 'SRV-2026-002', client: 'مؤسسة السعيد للمقاولات', service: 'تأسيس شركة ذات مسؤولية محدودة', staff: 'أ/ سارة محمود (مديرة)', status: 'PENDING', amount: '15,000 ج.م' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-900/60 via-slate-850 to-indigo-900/60 border border-sky-500/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            مرحباً بك، {user?.name || 'د. أحمد عبد الفتاح'} 👋
          </h1>
          <p className="text-xs text-slate-300">
            أهلاً بك في لوحة تحكم المنظومة SaaS ERP - التحديث الفوري للتجديدات والعمليات المالية والميدانية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/documents"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/25 transition"
          >
            <FileCheck className="w-4 h-4" />
            استعراض المستندات والتجديدات
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card p-5 rounded-2xl relative overflow-hidden hover:border-slate-700 transition">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">{card.title}</span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-100">{card.value}</h3>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Expiry Alerts & Recent Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Automatic Expiry Renewal Alerts Engine (7 & 30 Days) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-slate-100 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              تنبيهات التجديد الآلية (Expiry Engine)
            </h3>
            <span className="text-[11px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              3 تنبيهات
            </span>
          </div>

          <div className="space-y-3">
            {expiringAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                  alert.urgency === 'HIGH'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{alert.type}: {alert.number}</span>
                  <span className="font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px]">
                    متبقي {alert.days} يوم
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">{alert.company}</p>
                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-400">تنبيه آلي مجهز للواتساب</span>
                  <Link
                    href="/dashboard/documents"
                    className="text-sky-400 hover:underline font-bold flex items-center gap-1"
                  >
                    بدء التجديد <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Services Workflow & Operations */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-slate-100 flex items-center gap-2 text-sm">
              <FileCheck className="w-4 h-4 text-sky-400" />
              أحدث معاملات ومهمات المكتب الجارية
            </h3>
            <Link href="/dashboard/services" className="text-xs text-sky-400 font-bold hover:underline">
              عرض كافة الخدمات
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3">رقم الخدمة</th>
                  <th className="p-3">اسم العميل والشركة</th>
                  <th className="p-3">الخدمة المطلوبة</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {recentServices.map((srv, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-sky-400">{srv.order}</td>
                    <td className="p-3 font-bold text-white">{srv.client}</td>
                    <td className="p-3 text-slate-300">{srv.service}</td>
                    <td className="p-3 text-slate-400">{srv.staff}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        {srv.status === 'IN_PROGRESS' ? 'قيد التنفيذ الميداني' : 'معلقة'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">{srv.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
