'use client';

import React, { useState } from 'react';
import { FileText, AlertTriangle, Download, Plus, Search, Calendar, FileCode, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { printFormattedHtml } from '@/lib/printer';

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      title: 'السجل التجاري الرئيسي الموثق',
      clientName: 'شركة المصرية للحلول البرمجية',
      category: 'سجل تجاري',
      fileType: 'PDF',
      expiryDate: '2026-08-04',
      daysRemaining: 15,
      isExpired: false,
      uploaderName: 'أ/ سارة محمود',
    },
    {
      id: 'doc-2',
      title: 'البطاقة الضريبية ومأمورية الاستثمار',
      clientName: 'شركة المصرية للحلول البرمجية',
      category: 'بطاقة ضريبية',
      fileType: 'PDF',
      expiryDate: '2026-08-04',
      daysRemaining: 15,
      isExpired: false,
      uploaderName: 'أ/ سارة محمود',
    },
    {
      id: 'doc-3',
      title: 'عقد تأسيس منشأة فردية معتمد',
      clientName: 'مؤسسة السعيد للمقاولات والتوريدات',
      category: 'عقد تأسيس',
      fileType: 'PDF',
      expiryDate: '2028-10-30',
      daysRemaining: 832,
      isExpired: false,
      uploaderName: 'د. أحمد عبد الفتاح',
    },
  ]);

  const [showContractGenerator, setShowContractGenerator] = useState(false);
  const [contractClient, setContractClient] = useState('شركة المصرية للحلول البرمجية');
  const [generatedPdf, setGeneratedPdf] = useState<string | null>(null);

  const handleGenerateContract = () => {
    setGeneratedPdf(`تم توليد عقد التأسيس التلقائي الموثق لـ (${contractClient}) وتجهيزه للطباعة بنجاح.`);
  };

  const handlePrintContract = () => {
    const htmlContent = `
      <h2 style="text-align: center; color: #0f172a; margin-bottom: 20px;">عقد تأسيس شركة ذات مسؤولية محدودة (ش.م.م)</h2>

      <p>إنه في يوم <strong>${new Date().toLocaleDateString('ar-EG')}</strong>، تم الاتفاق بين كل من:</p>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>اسم الشحكة / المنشأة:</strong> ${contractClient}</p>
        <p><strong>الكيان القانوني:</strong> شركة ذات مسؤولية محدودة خاضعة للقانون رقم 159 لسنة 1981</p>
        <p><strong>رأس المال المقيد:</strong> 500,000 جنيه مصري (خمسمائة ألف جنيه مصري)</p>
        <p><strong>المركز الرئيسي:</strong> مدينة نصر - القاهرة</p>
      </div>

      <h3 style="color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">البند الأول: غرض الشركة</h3>
      <p>تطوير وتصميم الحلول البرمجية، الاستشارات التكنولوجية، وإدارة شبكات وتكنولوجيا المعلومات.</p>

      <h3 style="color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">البند الثاني: مدة الشركة والتسجيل</h3>
      <p>مدة الشركة خمس وعشرون سنة تبدأ من تاريخ القيد بالسجل التجاري وتجدد تلقائياً.</p>

      <h3 style="color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">البند الثالث: الإدارة والتوقيع</h3>
      <p>يتولى إدارة الشركة والتمثيل أمام الجهات الحكومية والسجل التجاري والمأموريات المدير المكتوب اسمه بالعقد.</p>

      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
        <div style="text-align: center;">
          <p><strong>توقيع الشركاء / العميل:</strong></p>
          <p style="margin-top: 30px;">_____________________</p>
        </div>
        <div class="official-seal">
          مُعتمد وموثق<br/>
          مكتب النخبة للاستشارات
        </div>
      </div>
    `;

    printFormattedHtml(`عقد تأسيس - ${contractClient}`, htmlContent);
  };

  const handlePrintDocumentReport = () => {
    const htmlContent = `
      <h2 style="text-align: center; color: #0f172a;">تقرير مستندات الخزينة والتجديدات المنتهية</h2>
      <p style="text-align: center; color: #64748b; font-size: 12px;">مكتب النخبة للخدمات والاستشارات الحكومية والمالية</p>

      <table>
        <thead>
          <tr>
            <th>عنوان المستند</th>
            <th>اسم العميل</th>
            <th>التصنيف</th>
            <th>تاريخ الانتهاء</th>
            <th>المستخدم الرافع</th>
          </tr>
        </thead>
        <tbody>
          ${documents
            .map(
              (doc) => `
            <tr>
              <td><strong>${doc.title}</strong></td>
              <td>${doc.clientName}</td>
              <td>${doc.category}</td>
              <td>${doc.expiryDate}</td>
              <td>${doc.uploaderName}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    printFormattedHtml('تقرير المستندات الخزينة', htmlContent);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            خزينة المستندات الرقمية ومحرك التنبيهات (Document Vault)
          </h1>
          <p className="text-xs text-[var(--text-muted)]">أرشفة المستندات الموثقة مع التنبيه الآلي قبل الانتهاء بـ 7 و 30 يوماً وتوليد عقود التأسيس.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrintDocumentReport}
            className="btn-secondary text-xs py-2.5"
          >
            <Printer className="w-4 h-4 text-indigo-500" />
            طباعة تقرير الخزينة
          </button>

          <button
            onClick={() => setShowContractGenerator(true)}
            className="btn-primary text-xs py-2.5"
          >
            <FileCode className="w-4 h-4" />
            توليد عقد تأسيس (PDF Template)
          </button>
        </div>
      </div>

      {/* Renewal Expiry Banners */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-300">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-[var(--text-primary)]">تنبيه آلي: يوجد مستندات تنتهي خلال 15 يوماً!</p>
            <p className="text-[var(--text-secondary)]">السجل التجاري والبطاقة الضريبية لشركة (المصرية للحلول البرمجية) تتطلب التجديد الفوري.</p>
          </div>
        </div>
        <span className="font-bold text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
          تذكير الواتساب جاهز
        </span>
      </div>

      {/* Documents Directory */}
      <div className="enterprise-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--table-header-bg)] text-xs">
          <span className="font-bold text-[var(--text-primary)]">قائمة المستندات المسجلة بالخزينة ({documents.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)]">
              <tr>
                <th className="p-3.5">عنوان المستند</th>
                <th className="p-3.5">اسم العميل</th>
                <th className="p-3.5">التصنيف</th>
                <th className="p-3.5">تاريخ الانتهاء</th>
                <th className="p-3.5">حالة التنبيه</th>
                <th className="p-3.5">المستخدم الرافع</th>
                <th className="p-3.5">تحميل ومعاينة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                  <td className="p-3.5 font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    {doc.title}
                  </td>
                  <td className="p-3.5 text-[var(--text-secondary)]">{doc.clientName}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px] font-semibold">
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[var(--text-secondary)]">{doc.expiryDate}</td>
                  <td className="p-3.5">
                    {doc.daysRemaining <= 30 ? (
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        ينتهي خلال {doc.daysRemaining} يوم ⚠️
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ساري وموثق ✓
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-[var(--text-muted)]">{doc.uploaderName}</td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handlePrintContract()}
                      className="px-2.5 py-1.5 rounded bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 border border-[var(--border-subtle)] transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> طباعة / معاينة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Template Generator Modal */}
      {showContractGenerator && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="enterprise-card w-full max-w-2xl rounded-2xl p-6 space-y-4 shadow-subtle-lg">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-500" />
                مولد عقود التأسيس التلقائي (Contract PDF Engine)
              </h3>
              <button onClick={() => setShowContractGenerator(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-primary)] mb-1 font-bold">اختر العميل / الشركة *</label>
                <select
                  value={contractClient}
                  onChange={(e) => setContractClient(e.target.value)}
                  className="enterprise-input"
                >
                  <option value="شركة المصرية للحلول البرمجية">شركة المصرية للحلول البرمجية (ش.م.م)</option>
                  <option value="مؤسسة السعيد للمقاولات والتوريدات">مؤسسة السعيد للمقاولات (منشأة فردية)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2 text-[var(--text-secondary)]">
                <p className="font-bold text-indigo-600 dark:text-indigo-400">بيانات القالب التلقائي المدمج:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>تضمين رقم العقد ورأس المال المقيد بالسجل التجاري.</li>
                  <li>توزيع الحصص والأنشطة المرخص بها قانوناً.</li>
                  <li>توليد التوقيع الرقمي والختم الرسمي للمكتب.</li>
                </ul>
              </div>

              {generatedPdf && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <span className="font-bold">{generatedPdf}</span>
                  <button
                    onClick={handlePrintContract}
                    className="btn-primary"
                  >
                    <Printer className="w-4 h-4" /> طباعة عقد PDF الفوري
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowContractGenerator(false)}
                  className="btn-secondary"
                >
                  إغلاق
                </button>
                <button
                  onClick={handleGenerateContract}
                  className="btn-primary"
                >
                  توليد العقد الحقيقي الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
