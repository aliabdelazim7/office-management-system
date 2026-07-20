'use client';

import React, { useState } from 'react';
import { UserCheck, MapPin, Smartphone, Clock, Calendar, Shield, CheckCircle2, Navigation, Send } from 'lucide-react';

export default function HrGpsPage() {
  const [employees] = useState([
    { name: 'د. أحمد عبد الفتاح', role: 'OWNER', title: 'المدير التنفيذي والمالك', phone: '01011111111', salary: '35,000 ج.م' },
    { name: 'أ/ سارة محمود', role: 'MANAGER', title: 'مديرة التشغيل والمعاملات', phone: '01022222222', salary: '18,000 ج.م' },
    { name: 'أ/ محمد طاهر', role: 'ACCOUNTANT', title: 'رئيس قسم الحسابات والضرائب', phone: '01033333333', salary: '12,000 ج.م' },
    { name: 'أ/ خليل ابراهيم', role: 'EMPLOYEE', title: 'مسؤول علاقات حكومية ومندوب ميداني', phone: '01044444444', salary: '8,000 ج.م' },
  ]);

  const [fieldLogs, setFieldLogs] = useState([
    {
      id: 'log-1',
      staffName: 'أ/ خليل ابراهيم (مندوب)',
      clientName: 'شركة المصرية للحلول البرمجية',
      govEntity: 'مأمورية ضرائب الاستثمار - مجمع نصر',
      locationName: 'مدينة نصر - الحي السابع',
      visitTime: '10:30 صباحاً',
      details: 'تقديم طلب التجديد وتسليم النموذج الضريبي 10 وتدقيق الملف الحسابي.',
      status: 'IN_PROGRESS',
      latitude: 30.0561,
      longitude: 31.3302,
    },
  ]);

  const [showMobileFieldForm, setShowMobileFieldForm] = useState(false);
  const [newLog, setNewLog] = useState({
    govEntity: '',
    locationName: '',
    details: '',
  });

  const handleCreateFieldLog = (e: React.FormEvent) => {
    e.preventDefault();
    const createdLog = {
      id: `log-${Date.now()}`,
      staffName: 'أ/ خليل ابراهيم (أنت)',
      clientName: 'شركة المصرية للحلول البرمجية',
      govEntity: newLog.govEntity,
      locationName: newLog.locationName,
      visitTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      details: newLog.details,
      status: 'IN_PROGRESS',
      latitude: 30.0444,
      longitude: 31.2357,
    };

    setFieldLogs([createdLog, ...fieldLogs]);
    setShowMobileFieldForm(false);
    setNewLog({ govEntity: '', locationName: '', details: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-400" />
            فريق العمل وتتبع الحركة الميدانية بالـ GPS (Mobile First PWA)
          </h1>
          <p className="text-xs text-slate-400">سجل الزيارات الميدانية للمندوبين بالجهات الحكومية (السجل التجاري، الضرائب، التأمينات) مع الحضور والموقع.</p>
        </div>

        <button
          onClick={() => setShowMobileFieldForm(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
        >
          <Smartphone className="w-4 h-4" />
          تسجيل مهمة ميدانية بالـ GPS (من الجوال)
        </button>
      </div>

      {/* Main Grid: Staff Directory & GPS Field Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: HR Employees Directory */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-xs border-b border-slate-800 pb-2">فريق العمل والرواتب والصلاحيات:</h3>
          <div className="space-y-3">
            {employees.map((emp, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{emp.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {emp.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{emp.title}</p>
                <div className="flex justify-between pt-1 text-[11px]">
                  <span className="text-slate-400">{emp.phone}</span>
                  <span className="font-bold text-emerald-400">{emp.salary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: GPS Field Visit Logs & Map Pinning */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-xs border-b border-slate-800 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            سجل الزيارات الميدانية المباشرة وتتبع الـ GPS (Field Logs)
          </h3>

          <div className="space-y-4">
            {fieldLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-sky-400 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" /> {log.govEntity}
                  </span>
                  <span className="text-slate-400 text-[11px]">{log.visitTime}</span>
                </div>

                <p className="text-white font-semibold">{log.details}</p>

                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-700/60 text-slate-400">
                  <span>المندوب: <strong className="text-slate-200">{log.staffName}</strong></span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> إحداثيات GPS: {log.latitude}, {log.longitude}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile GPS Field Form Modal */}
      {showMobileFieldForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                تسجيل زيارة ميدانية (GPS Field App)
              </h3>
              <button onClick={() => setShowMobileFieldForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateFieldLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">الجهة الحكومية المستهدفة *</label>
                <input
                  required
                  type="text"
                  value={newLog.govEntity}
                  onChange={(e) => setNewLog({ ...newLog, govEntity: e.target.value })}
                  placeholder="مثال: مأمورية ضرائب الاستثمار / الغرفة التجارية"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">اسم المكان / العنوان *</label>
                <input
                  required
                  type="text"
                  value={newLog.locationName}
                  onChange={(e) => setNewLog({ ...newLog, locationName: e.target.value })}
                  placeholder="مثال: مدينة نصر - مجمع الخدمات"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">تفاصيل ما تم إنجازه والتقرير اليومي *</label>
                <textarea
                  required
                  rows={3}
                  value={newLog.details}
                  onChange={(e) => setNewLog({ ...newLog, details: e.target.value })}
                  placeholder="اكتب التقرير الميداني وتفاصيل المستندات المستلمة أو التأخير..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>سيتم التقاط موقعك الحالي تلقائياً عبر المستشعر (Latitude: 30.0444, Longitude: 31.2357).</span>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMobileFieldForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> إرسال المهمة الميدانية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
