'use client';

import React, { useState } from 'react';
import { ShieldAlert, User, Laptop, Calendar, CheckCircle2, Lock } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs] = useState([
    {
      id: 'audit-1',
      user: 'د. أحمد عبد الفتاح (OWNER)',
      action: 'TENANT_INITIALIZED',
      entity: 'Tenant',
      details: 'تم إنشاء وتأسيس حساب المكتب وتجهيز الصلاحيات الإدارية والخزينة.',
      ip: '127.0.0.1',
      device: 'Chrome / Windows Server 2026',
      date: '2026-07-20 10:00:00',
    },
    {
      id: 'audit-2',
      user: 'أ/ سارة محمود (MANAGER)',
      action: 'CLIENT_CREATED',
      entity: 'Client',
      details: 'تم إضافة ملف العميل الجديد (شركة المصرية للحلول البرمجية - CLI-1001)',
      ip: '192.168.1.45',
      device: 'Safari / macOS Sonoma',
      date: '2026-07-20 10:15:30',
    },
    {
      id: 'audit-3',
      user: 'أ/ خليل ابراهيم (EMPLOYEE)',
      action: 'FIELD_GPS_LOG_CREATED',
      entity: 'FieldLog',
      details: 'تسجيل زيارة ميدانية بمأمورية ضرائب الاستثمار (Latitude: 30.0561, Longitude: 31.3302)',
      ip: '197.34.112.89',
      device: 'PWA Mobile / Android 14',
      date: '2026-07-20 10:30:12',
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          سجل التدقيق الأمني وتتبع النشاطات (Audit Logs & Security Trail)
        </h1>
        <p className="text-xs text-slate-400">سجل غير قابل للتعديل يوثق كل إجراء بالمنظومة، المستخدم، IP، والجهاز المصرح به.</p>
      </div>

      {/* Audit Trail Directory */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 text-xs">
          <span className="font-bold text-slate-300">سجلات التدقيق والحركات المسجلة ({logs.length})</span>
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> مشفر ومحمي من التعديل
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
              <tr>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">المستخدم والرمز</th>
                <th className="p-3.5">نوع الإجراء (Action)</th>
                <th className="p-3.5">الكيان (Entity)</th>
                <th className="p-3.5">التفاصيل والتغيير</th>
                <th className="p-3.5">عنوان IP والجهاز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">{log.date}</td>
                  <td className="p-3.5 font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    {log.user}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-sky-400">{log.entity}</td>
                  <td className="p-3.5 text-slate-300 max-w-xs">{log.details}</td>
                  <td className="p-3.5 text-slate-400 text-[11px]">
                    <p className="font-mono text-slate-200">{log.ip}</p>
                    <span className="text-[10px] text-slate-400">{log.device}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
