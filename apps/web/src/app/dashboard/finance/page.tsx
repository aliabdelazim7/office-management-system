'use client';

import React, { useState } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, DollarSign, Plus, Printer, CheckCircle, FileText } from 'lucide-react';
import { printFormattedHtml } from '@/lib/printer';

export default function FinancePage() {
  const [invoices, setInvoices] = useState([
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-001',
      clientName: 'شركة المصرية للحلول البرمجية',
      serviceName: 'تجديد السجل التجاري والبطاقة الضريبية',
      totalAmount: 7500,
      paidAmount: 5000,
      remainingAmount: 2500,
      status: 'PARTIAL',
      dueDate: '2026-07-30',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-002',
      clientName: 'مؤسسة السعيد للمقاولات والتوريدات',
      serviceName: 'تأسيس شركة ذات مسؤولية محدودة',
      totalAmount: 15000,
      paidAmount: 15000,
      remainingAmount: 0,
      status: 'PAID',
      dueDate: '2026-07-20',
    },
  ]);

  const [expenses, setExpenses] = useState([
    { title: 'رسوم حكومية - الغرفة التجارية السنوية', category: 'رسوم حكومية', amount: 1850, paidBy: 'أ/ خليل ابراهيم', date: '2026-07-19' },
    { title: 'إيجار المكتب الفرعي بالتجمع', category: 'إيجار وتسهيلات', amount: 15000, paidBy: 'أ/ محمد طاهر', date: '2026-07-01' },
  ]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;

    const amount = Number(paymentAmount);
    const newPaid = selectedInvoice.paidAmount + amount;
    const newRemaining = Math.max(0, selectedInvoice.totalAmount - newPaid);
    const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIAL';

    const updated = {
      ...selectedInvoice,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status: newStatus,
    };

    setInvoices(invoices.map((inv) => (inv.id === updated.id ? updated : inv)));
    setShowPaymentModal(false);

    // Trigger Printable Official Receipt
    handlePrintReceipt(updated, amount);
    setPaymentAmount('');
  };

  const handlePrintReceipt = (inv: any, paidNowAmount: number) => {
    const htmlContent = `
      <h2 style="text-align: center; color: #0f172a; margin-bottom: 20px;">سند قبض وتحصيل نقدي رسمي (POS Receipt)</h2>

      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>رقم الفاتورة:</strong> ${inv.invoiceNumber}</p>
        <p><strong>العميل / الشركة:</strong> ${inv.clientName}</p>
        <p><strong>عن خدمة:</strong> ${inv.serviceName}</p>
        <p><strong>تاريخ التحصيل:</strong> ${new Date().toLocaleString('ar-EG')}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>إجمالي الفاتورة</th>
            <th>المبلغ المحصل الآن</th>
            <th>إجمالي المدفوع حتى الآن</th>
            <th>المتبقي غير المحصل</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${inv.totalAmount.toLocaleString()} ج.م</strong></td>
            <td style="color: #059669; font-weight: bold;">+${paidNowAmount.toLocaleString()} ج.م</td>
            <td>${inv.paidAmount.toLocaleString()} ج.م</td>
            <td style="color: #dc2626;">${inv.remainingAmount.toLocaleString()} ج.م</td>
          </tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
        <div style="text-align: center;">
          <p><strong>مستلم الدفعة:</strong> أ/ محمد طاهر (محاسب)</p>
          <p style="margin-top: 30px;">_____________________</p>
        </div>
        <div class="official-seal">
          تم السداد نقداً / POS<br/>
          مكتب النخبة للاستشارات
        </div>
      </div>
    `;

    printFormattedHtml(`سند قبض - ${inv.invoiceNumber}`, htmlContent);
  };

  const handlePrintFinanceLedger = () => {
    const htmlContent = `
      <h2 style="text-align: center; color: #0f172a;">تقرير دفتر المقبوضات والفواتير المالية</h2>
      <p style="text-align: center; color: #64748b; font-size: 12px;">مكتب النخبة للخدمات والاستشارات الحكومية والمالية</p>

      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>اسم العميل</th>
            <th>إجمالي الفاتورة</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${invoices
            .map(
              (inv) => `
            <tr>
              <td><strong>${inv.invoiceNumber}</strong></td>
              <td>${inv.clientName}</td>
              <td>${inv.totalAmount.toLocaleString()} ج.م</td>
              <td style="color: #059669;">${inv.paidAmount.toLocaleString()} ج.م</td>
              <td style="color: #dc2626;">${inv.remainingAmount.toLocaleString()} ج.م</td>
              <td>${inv.status === 'PAID' ? 'محتسبة ومسددة' : 'دفعة جزئية'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    printFormattedHtml('تقرير الفواتير المالية', htmlContent);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            الإدارة المالية ومقادير المقبوضات ودفتر الحسابات (Client Ledger & POS)
          </h1>
          <p className="text-xs text-[var(--text-muted)]">إدارة مقبوضات الخدمات، سندات القبض، المصروفات، والمتبقي لكل عميل.</p>
        </div>

        <button
          onClick={handlePrintFinanceLedger}
          className="btn-secondary text-xs py-2.5"
        >
          <Printer className="w-4 h-4 text-emerald-500" />
          طباعة كشف الحسابات العام
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="enterprise-card p-5 rounded-2xl">
          <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-bold mb-2">
            <span>إجمالي الإيرادات المحصلة</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">20,000 ج.م</p>
        </div>

        <div className="enterprise-card p-5 rounded-2xl">
          <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-bold mb-2">
            <span>إجمالي المصروفات التشغيلية</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">16,850 ج.م</p>
        </div>

        <div className="enterprise-card p-5 rounded-2xl">
          <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-bold mb-2">
            <span>المتبقي غير المحصل (الديون)</span>
            <Wallet className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">2,500 ج.م</p>
        </div>
      </div>

      {/* Invoices Directory */}
      <div className="enterprise-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--table-header-bg)] text-xs">
          <span className="font-bold text-[var(--text-primary)]">سجل فواتير العملاء المقيدة ({invoices.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[var(--table-header-bg)] text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)]">
              <tr>
                <th className="p-3.5">رقم الفاتورة</th>
                <th className="p-3.5">اسم العميل والشركة</th>
                <th className="p-3.5">المبلغ الإجمالي</th>
                <th className="p-3.5">المدفوع</th>
                <th className="p-3.5">المتبقي</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">تحصيل وتوليد سند (POS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                  <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">{inv.invoiceNumber}</td>
                  <td className="p-3.5 font-bold text-[var(--text-primary)]">{inv.clientName}</td>
                  <td className="p-3.5 font-bold text-[var(--text-primary)]">{inv.totalAmount.toLocaleString()} ج.م</td>
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">{inv.paidAmount.toLocaleString()} ج.م</td>
                  <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">{inv.remainingAmount.toLocaleString()} ج.م</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {inv.status === 'PAID' ? 'محتسبة ومسددة' : 'دفعة جزئية'}
                    </span>
                  </td>
                  <td className="p-3.5 flex gap-2">
                    {inv.remainingAmount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowPaymentModal(true);
                        }}
                        className="btn-primary text-xs py-1 px-3 font-bold"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> تحصيل دفعة (POS)
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintReceipt(inv, inv.paidAmount)}
                      className="btn-secondary text-xs py-1 px-2.5 font-bold"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-500" /> طباعة سند
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POS Payment Receipt Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="enterprise-card w-full max-w-md rounded-2xl p-6 space-y-4 shadow-subtle-lg">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-bold text-base text-[var(--text-primary)]">تسجيل سند قبض وتحصيل نقدًا / POS</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                <p className="text-[var(--text-muted)]">الفاتورة رقم: <strong className="text-indigo-600 dark:text-indigo-400">{selectedInvoice.invoiceNumber}</strong></p>
                <p className="text-[var(--text-muted)]">العميل: <strong className="text-[var(--text-primary)]">{selectedInvoice.clientName}</strong></p>
                <p className="text-[var(--text-muted)]">المتبقي غير المحصل: <strong className="text-rose-600 dark:text-rose-400 font-bold">{selectedInvoice.remainingAmount} ج.م</strong></p>
              </div>

              <div>
                <label className="block text-[var(--text-primary)] mb-1 font-bold">المبلغ المستلم الآن (ج.م) *</label>
                <input
                  required
                  type="number"
                  max={selectedInvoice.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`أدخل المبلغ حتى ${selectedInvoice.remainingAmount}`}
                  className="enterprise-input font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <Printer className="w-4 h-4" /> طباعة سند القبض والاعتماد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
