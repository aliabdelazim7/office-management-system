'use client';

import React, { useState } from 'react';
import { Users, Plus, Phone, Mail, MapPin, Building, Calendar, FileText, ChevronRight, X, Clock, Printer } from 'lucide-react';
import { LegalType } from '@saas/types';
import { printFormattedHtml } from '@/lib/printer';

export default function CrmPage() {
  const [clients, setClients] = useState([
    {
      id: 'cli-1001',
      clientCode: 'CLI-1001',
      name: 'المهندس طارق منصور',
      companyName: 'شركة المصرية للحلول البرمجية',
      tradeName: 'إيجيبت تيك Soft',
      phone: '01211112222',
      whatsapp: '01211112222',
      email: 'tarek@egypttech.com',
      address: 'المدينة المنورة - مدينة نصر',
      businessActivity: 'تطوير البرمجيات والاستشارات التكنولوجية',
      legalType: LegalType.LLC,
      branchesCount: 2,
      createdAt: '2026-07-15',
    },
    {
      id: 'cli-1002',
      clientCode: 'CLI-1002',
      name: 'الحاج مصطفى السعيد',
      companyName: 'مؤسسة السعيد للمقاولات والتوريدات',
      tradeName: 'السعيد جروب',
      phone: '01199998888',
      whatsapp: '01199998888',
      email: 'info@elsaeed-group.com',
      address: 'ش الميرغني - مصر الجديدة',
      businessActivity: 'المقاولات العامة والتوريدات التخصصية',
      legalType: LegalType.SOLE_PROPRIETORSHIP,
      branchesCount: 3,
      createdAt: '2026-07-18',
    },
  ]);

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    tradeName: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    businessActivity: '',
    legalType: 'SOLE_PROPRIETORSHIP',
    branchesCount: 1,
  });

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient = {
      id: `cli-${Date.now()}`,
      clientCode: `CLI-${1001 + clients.length}`,
      ...formData,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setClients([newClient as any, ...clients]);
    setShowAddModal(false);
    setFormData({
      name: '',
      companyName: '',
      tradeName: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      businessActivity: '',
      legalType: 'SOLE_PROPRIETORSHIP',
      branchesCount: 1,
    });
  };

  const getLegalTypeArabic = (type: string) => {
    switch (type) {
      case 'LLC':
        return 'شركة ذات مسؤولية محدودة';
      case 'SOLE_PROPRIETORSHIP':
        return 'منشأة فردية';
      case 'PARTNERSHIP':
        return 'شركة تضامن';
      case 'LIMITED_PARTNERSHIP':
        return 'شركة توصية بسيطة';
      case 'JOINT_STOCK':
        return 'شركة مساهمة';
      case 'SINGLE_PERSON':
        return 'شركة شخص واحد';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            إدارة العملاء والكيانات القانونية (CRM)
          </h1>
          <p className="text-xs text-[var(--text-muted)]">سجل متكامل لكل عميل، الفروع، النوع القانوني، والـ Timeline للأحداث.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const htmlContent = `
                <h2 style="text-align: center; color: #0f172a;">سجل العملاء والشركات المقيدة بالمنظومة</h2>
                <table>
                  <thead>
                    <tr>
                      <th>كود العميل</th>
                      <th>اسم العميل</th>
                      <th>اسم الشركة والسمة</th>
                      <th>النوع القانوني</th>
                      <th>رقم الهاتف</th>
                      <th>عدد الفروع</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${clients
                      .map(
                        (c) => `
                      <tr>
                        <td><strong>${c.clientCode}</strong></td>
                        <td>${c.name}</td>
                        <td>${c.companyName} (${c.tradeName || '-'})</td>
                        <td>${c.legalType}</td>
                        <td>${c.phone}</td>
                        <td>${c.branchesCount} فروع</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              `;
              printFormattedHtml('سجل العملاء والشركات', htmlContent);
            }}
            className="btn-secondary text-xs py-2.5"
          >
            <Printer className="w-4 h-4 text-indigo-500" />
            طباعة كشف العملاء
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs py-2.5"
          >
            <Plus className="w-4 h-4" />
            إضافة عميل / منشأة جديدة
          </button>
        </div>
      </div>

      {/* Clients Table Directory */}
      <div className="enterprise-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--table-header-bg)]">
          <span className="text-xs font-bold text-[var(--text-primary)]">إجمالي سجلات العملاء: ({clients.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)]">
              <tr>
                <th className="p-3.5">كود العميل</th>
                <th className="p-3.5">اسم العميل</th>
                <th className="p-3.5">اسم الشركة والسمة</th>
                <th className="p-3.5">نوع الكيان القانوني</th>
                <th className="p-3.5">التواصل</th>
                <th className="p-3.5">الفروع</th>
                <th className="p-3.5">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                  <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">{client.clientCode}</td>
                  <td className="p-3.5 font-bold text-[var(--text-primary)]">{client.name}</td>
                  <td className="p-3.5">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{client.companyName}</p>
                      <span className="text-[10px] text-[var(--text-muted)]">{client.tradeName || '-'}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {getLegalTypeArabic(client.legalType)}
                    </span>
                  </td>
                  <td className="p-3.5 text-[var(--text-secondary)]">
                    <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-[var(--text-muted)]" /> {client.phone}</p>
                    <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email || '-'}</p>
                  </td>
                  <td className="p-3.5 font-bold text-[var(--text-secondary)]">{client.branchesCount} فروع</td>
                  <td className="p-3.5">
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowTimeline(true);
                      }}
                      className="btn-secondary text-xs py-1 px-3 font-bold"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      عرض السجل الزمني
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="enterprise-card w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-subtle-lg">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">إضافة ملف عميل / شركة جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[var(--text-primary)] mb-1 font-bold">اسم العميل *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: المهندس طارق منصور"
                  className="enterprise-input"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] mb-1 font-bold">اسم الشركة الرسمي *</label>
                <input
                  required
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="مثال: شركة المصرية للحلول البرمجية"
                  className="enterprise-input"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] mb-1 font-bold">السمة التجارية</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  placeholder="إيجيبت تيك Soft"
                  className="enterprise-input"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] mb-1 font-bold">نوع الكيان القانوني *</label>
                <select
                  value={formData.legalType}
                  onChange={(e) => setFormData({ ...formData, legalType: e.target.value })}
                  className="enterprise-input"
                >
                  <option value="SOLE_PROPRIETORSHIP">منشأة فردية</option>
                  <option value="PARTNERSHIP">شركة تضامن</option>
                  <option value="LIMITED_PARTNERSHIP">شركة توصية بسيطة</option>
                  <option value="LLC">شركة ذات مسؤولية محدودة (ش.م.م)</option>
                  <option value="JOINT_STOCK">شركة مساهمة</option>
                  <option value="SINGLE_PERSON">شركة شخص واحد</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-primary)] mb-1 font-bold">رقم الهاتف *</label>
                <input
                  required
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01211112222"
                  className="enterprise-input"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] mb-1 font-bold">رقم الواتساب</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="01211112222"
                  className="enterprise-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[var(--text-primary)] mb-1 font-bold">النشاط التجاري والخدمي</label>
                <input
                  type="text"
                  value={formData.businessActivity}
                  onChange={(e) => setFormData({ ...formData, businessActivity: e.target.value })}
                  placeholder="تطوير البرمجيات والاستشارات التكنولوجية"
                  className="enterprise-input"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Timeline Modal */}
      {showTimeline && selectedClient && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="enterprise-card w-full max-w-2xl rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-subtle-lg">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">السجل الزمني للأحداث (Timeline): {selectedClient.name}</h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">{selectedClient.companyName} ({selectedClient.clientCode})</p>
              </div>
              <button onClick={() => setShowTimeline(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-4 pt-2">
              <div className="flex gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shadow-subtle-xs" />
                <div className="bg-[var(--bg-canvas)] p-3 rounded-xl flex-1 border border-[var(--border-subtle)]">
                  <div className="flex justify-between text-[var(--text-muted)] text-[11px] mb-1">
                    <span>تأسيس الملف</span>
                    <span>2026-07-15</span>
                  </div>
                  <p className="font-bold text-[var(--text-primary)]">تم إنشاء ملف العميل وإدخال البيانات القانونية والفروع.</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shadow-subtle-xs" />
                <div className="bg-[var(--bg-canvas)] p-3 rounded-xl flex-1 border border-[var(--border-subtle)]">
                  <div className="flex justify-between text-[var(--text-muted)] text-[11px] mb-1">
                    <span>رفع مستند موثق</span>
                    <span>2026-07-16</span>
                  </div>
                  <p className="font-bold text-[var(--text-primary)]">تم رفع السجل التجاري الموثق (رقم CR-994821) لخزينة المستندات.</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shadow-subtle-xs" />
                <div className="bg-[var(--bg-canvas)] p-3 rounded-xl flex-1 border border-[var(--border-subtle)]">
                  <div className="flex justify-between text-[var(--text-muted)] text-[11px] mb-1">
                    <span>تحصيل دفعة مالية</span>
                    <span>2026-07-19</span>
                  </div>
                  <p className="font-bold text-[var(--text-primary)]">تم تحصيل دفعة مقدماً بقيمة 5,000 ج.م لحساب تجديد السجل التجاري والبطاقة الضريبية.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
