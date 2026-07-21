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
        <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          السجل التجاري والبطاقة الضريبية والتأمينات والاتحاد المصري
        </h1>
        <p className="text-xs text-[var(--text-muted)]">إدارة المستندات الهيكلية للمنشآت ورأس المال والمنظومة الضريبية.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-subtle)] space-x-2 space-x-reverse text-xs font-bold">
        <button
          onClick={() => setActiveTab('CR')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'CR' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-[var(--bg-surface-secondary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          السجل التجاري (Commercial Registers)
        </button>

        <button
          onClick={() => setActiveTab('TAX')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'TAX' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-[var(--bg-surface-secondary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          البطاقة الضريبية والمنظومة
        </button>

        <button
          onClick={() => setActiveTab('INSURANCE')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'INSURANCE' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-[var(--bg-surface-secondary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Shield className="w-4 h-4" />
          التأمينات الاجتماعية
        </button>

        <button
          onClick={() => setActiveTab('FEDERATION')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'FEDERATION' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-[var(--bg-surface-secondary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Award className="w-4 h-4" />
          عضوية الاتحاد المصري
        </button>
      </div>

      {/* Tab 1: Commercial Registers */}
      {activeTab === 'CR' && (
        <div className="enterprise-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[var(--table-header-bg)] text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-3.5">رقم السجل التجاري</th>
                  <th className="p-3.5">اسم المنشأة / الشركة</th>
                  <th className="p-3.5">رأس المال</th>
                  <th className="p-3.5">النشاط المرخص</th>
                  <th className="p-3.5">تاريخ الانتهاء</th>
                  <th className="p-3.5">الحالة والتنبيه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
                {commercialRegisters.map((cr, idx) => (
                  <tr key={idx} className="hover:bg-[var(--table-row-hover)] transition-colors">
                    <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {cr.registerNumber}
                      <span className="block text-[10px] text-[var(--text-muted)] font-normal">إيداع: {cr.depositNumber}</span>
                    </td>
                    <td className="p-3.5 font-bold text-[var(--text-primary)]">{cr.company}</td>
                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">{cr.capital}</td>
                    <td className="p-3.5 text-[var(--text-secondary)]">{cr.activity}</td>
                    <td className="p-3.5 font-mono text-[var(--text-secondary)]">{cr.expiryDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                        cr.status.includes('قريب') ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
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
        <div className="enterprise-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[var(--table-header-bg)] text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-3.5">رقم البطاقة الضريبية</th>
                  <th className="p-3.5">اسم الشركة</th>
                  <th className="p-3.5">المأمورية والكود</th>
                  <th className="p-3.5">تاريخ الانتهاء</th>
                  <th className="p-3.5">المنظومة الضريبية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
                {taxCards.map((tc, idx) => (
                  <tr key={idx} className="hover:bg-[var(--table-row-hover)] transition-colors">
                    <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">{tc.cardNumber}</td>
                    <td className="p-3.5 font-bold text-[var(--text-primary)]">{tc.company}</td>
                    <td className="p-3.5 text-[var(--text-secondary)]">{tc.taxOffice} ({tc.taxCode})</td>
                    <td className="p-3.5 font-mono text-[var(--text-secondary)]">{tc.expiryDate}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
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
        <div className="enterprise-card p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-[var(--text-primary)] text-sm">ملفات المنشأة التأمينية والعمالة والسيارات المسجلة</h3>
          {socialInsurances.map((si, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs space-y-2 text-[var(--text-primary)]">
              <div className="flex justify-between font-bold text-indigo-600 dark:text-indigo-400">
                <span>رقم المنشأة التأميني: {si.insuranceNumber}</span>
                <span className="text-[var(--text-primary)]">{si.company}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[var(--text-secondary)]">
                <p>عدد العمالة المسجلة: <strong className="text-[var(--text-primary)]">{si.workforceCount} عامل</strong></p>
                <p>السيارات التأمينية: <strong className="text-[var(--text-primary)]">{si.vehiclesData}</strong></p>
                <p>تاريخ فتح الملف: <strong className="text-[var(--text-primary)]">{si.openDate}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Federation Membership */}
      {activeTab === 'FEDERATION' && (
        <div className="enterprise-card p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-[var(--text-primary)] text-sm">بيانات عضوية الاتحاد المصري وتجديد التصنيف</h3>
          {federationMemberships.map((fed, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs space-y-2 text-[var(--text-primary)]">
              <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                <span>رقم العضوية: {fed.membershipNumber}</span>
                <span className="text-[var(--text-primary)]">{fed.company}</span>
              </div>
              <p className="text-[var(--text-secondary)]">التصنيف والدرجة: <strong className="text-[var(--text-primary)]">{fed.classification} ({fed.category})</strong></p>
              <div className="flex justify-between text-[var(--text-muted)] text-[11px] pt-2">
                <span>تاريخ القيد الأول: {fed.enrollmentDate}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">موعد التجديد السنوي: {fed.annualRenewalDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
