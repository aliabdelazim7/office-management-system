'use client';

import React, { useState } from 'react';
import { Building2, CreditCard, Shield, Award, Calendar, AlertCircle } from 'lucide-react';

export default function CommercialRegistersPage() {
  const [activeTab, setActiveTab] = useState<'CR' | 'TAX' | 'INSURANCE' | 'FEDERATION'>('CR');

  const commercialRegisters = [
    {
      registerNumber: 'CR-994821',
      depositNumber: 'DEP-2023-88',
      company: 'شركة المصرية للحلول البرمجية ش.م.م',
      tradeName: 'إيجيبت تيك Soft',
      capital: '500,000 ج.م',
      activity: 'برمجيات، تصميم شبكات، ودعم فني',
      address: 'القاهرة - مدينة نصر - المنطقة الأولى',
      expiryDate: '2026-08-04',
      status: 'قريب الانتهاء (15 يوماً)',
    },
    {
      registerNumber: 'CR-104928',
      depositNumber: 'DEP-2022-12',
      company: 'مؤسسة السعيد للمقاولات العامة',
      tradeName: 'السعيد جروب',
      capital: '2,000,000 ج.م',
      activity: 'بناء وتشطيبات واستيراد مواد بناء',
      address: 'القاهرة - مصر الجديدة - الكوربة',
      expiryDate: '2026-10-18',
      status: 'ساري وموثق',
    },
  ];

  const taxCards = [
    {
      cardNumber: 'TAX-554-321-998',
      company: 'شركة المصرية للحلول البرمجية',
      taxOffice: 'مأمورية استثمار القاهرة',
      taxCode: 'INV-402',
      serialNumber: 'SN-00912',
      expiryDate: '2026-08-04',
      taxSystemStatus: 'مسجل منظومة الفاتورة الإلكترونية',
      vehicles: 'أ ب ج 1234 (ملاكي)',
    },
  ];

  const socialInsurances = [
    {
      insuranceNumber: 'INS-881920',
      company: 'مؤسسة السعيد للمقاولات العامة',
      openDate: '2018-05-10',
      workforceCount: 18,
      vehiclesData: '2 سيارة نقل ثقيل مسجلة',
      lastRenewalDate: '2026-01-01',
    },
  ];

  const federationMemberships = [
    {
      membershipNumber: 'FED-400192',
      company: 'مؤسسة السعيد للمقاولات العامة',
      enrollmentDate: '2019-03-15',
      annualRenewalDate: '2027-03-14',
      classification: 'الاتحاد المصري لمقاولي البناء والتشييد',
      category: 'الفئة الأولى - أعمال تخصصية',
      experienceYears: 8,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-400" />
          السجل التجاري والبطاقة الضريبية والتأمينات والاتحاد المصري
        </h1>
        <p className="text-xs text-slate-400">إدارة المستندات الهيكلية للمنشآت ورأس المال والمنظومة الضريبية.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 space-x-reverse text-xs font-bold">
        <button
          onClick={() => setActiveTab('CR')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'CR' ? 'border-sky-500 text-sky-400 bg-slate-800/60' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          السجل التجاري (Commercial Registers)
        </button>

        <button
          onClick={() => setActiveTab('TAX')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'TAX' ? 'border-sky-500 text-sky-400 bg-slate-800/60' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          البطاقة الضريبية والمنظومة
        </button>

        <button
          onClick={() => setActiveTab('INSURANCE')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'INSURANCE' ? 'border-sky-500 text-sky-400 bg-slate-800/60' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          التأمينات الاجتماعية
        </button>

        <button
          onClick={() => setActiveTab('FEDERATION')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'FEDERATION' ? 'border-sky-500 text-sky-400 bg-slate-800/60' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          عضوية الاتحاد المصري
        </button>
      </div>

      {/* Tab 1: Commercial Registers */}
      {activeTab === 'CR' && (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">رقم السجل التجاري</th>
                  <th className="p-3.5">اسم المنشأة / الشركة</th>
                  <th className="p-3.5">رأس المال</th>
                  <th className="p-3.5">النشاط المرخص</th>
                  <th className="p-3.5">تاريخ الانتهاء</th>
                  <th className="p-3.5">الحالة والتنبيه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {commercialRegisters.map((cr, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-sky-400">
                      {cr.registerNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">إيداع: {cr.depositNumber}</span>
                    </td>
                    <td className="p-3.5 font-bold text-white">{cr.company}</td>
                    <td className="p-3.5 font-bold text-emerald-400">{cr.capital}</td>
                    <td className="p-3.5 text-slate-300">{cr.activity}</td>
                    <td className="p-3.5 font-mono">{cr.expiryDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                        cr.status.includes('قريب') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {cr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Tax Cards */}
      {activeTab === 'TAX' && (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">رقم البطاقة الضريبية</th>
                  <th className="p-3.5">اسم الشركة</th>
                  <th className="p-3.5">المأمورية والكود</th>
                  <th className="p-3.5">تاريخ الانتهاء</th>
                  <th className="p-3.5">المنظومة الضريبية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {taxCards.map((tc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-sky-400">{tc.cardNumber}</td>
                    <td className="p-3.5 font-bold text-white">{tc.company}</td>
                    <td className="p-3.5 text-slate-300">{tc.taxOffice} ({tc.taxCode})</td>
                    <td className="p-3.5 font-mono">{tc.expiryDate}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                        {tc.taxSystemStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Social Insurance */}
      {activeTab === 'INSURANCE' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-sm">ملفات المنشأة التأمينية والعمالة والسيارات المسجلة</h3>
          {socialInsurances.map((si, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-2 text-slate-200">
              <div className="flex justify-between font-bold text-sky-400">
                <span>رقم المنشأة التأميني: {si.insuranceNumber}</span>
                <span className="text-white">{si.company}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-slate-300">
                <p>عدد العمالة المسجلة: <strong className="text-white">{si.workforceCount} عامل</strong></p>
                <p>السيارات التأمينية: <strong className="text-white">{si.vehiclesData}</strong></p>
                <p>تاريخ فتح الملف: <strong className="text-white">{si.openDate}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Federation Membership */}
      {activeTab === 'FEDERATION' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-sm">بيانات عضوية الاتحاد المصري وتجديد التصنيف</h3>
          {federationMemberships.map((fed, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-2 text-slate-200">
              <div className="flex justify-between font-bold text-amber-400">
                <span>رقم العضوية: {fed.membershipNumber}</span>
                <span className="text-white">{fed.company}</span>
              </div>
              <p className="text-slate-300">التصنيف والدرجة: <strong className="text-white">{fed.classification} ({fed.category})</strong></p>
              <div className="flex justify-between text-slate-400 text-[11px] pt-2">
                <span>تاريخ القيد الأول: {fed.enrollmentDate}</span>
                <span className="text-emerald-400 font-bold">موعد التجديد السنوي: {fed.annualRenewalDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
