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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            الإدارة المالية ومقادير المقبوضات ودفتر الحسابات (Client Ledger & POS)
          </h1>
          <p className="text-xs text-slate-400">إدارة مقبوضات الخدمات، سندات القبض، المصروفات، والمتبقي لكل عميل.</p>
        </div>

        <button
          onClick={handlePrintFinanceLedger}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          طباعة كشف الحسابات العام
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold mb-2">
            <span>إجمالي الإيرادات المحصلة</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">20,000 ج.م</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold mb-2">
            <span>إجمالي المصروفات التشغيلية</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">16,850 ج.م</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold mb-2">
            <span>المتبقي غير المحصل (الديون)</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">2,500 ج.م</p>
        </div>
      </div>

      {/* Invoices Directory */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 text-xs">
          <span className="font-bold text-slate-300">سجل فواتير العملاء المقيدة ({invoices.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
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
            <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-sky-400">{inv.invoiceNumber}</td>
                  <td className="p-3.5 font-bold text-white">{inv.clientName}</td>
                  <td className="p-3.5 font-bold text-slate-100">{inv.totalAmount.toLocaleString()} ج.م</td>
                  <td className="p-3.5 font-bold text-emerald-400">{inv.paidAmount.toLocaleString()} ج.م</td>
                  <td className="p-3.5 font-bold text-rose-400">{inv.remainingAmount.toLocaleString()} ج.م</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> تحصيل دفعة (POS)
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintReceipt(inv, inv.paidAmount)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-sky-400" /> طباعة سند
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="font-bold text-base text-white">تسجيل سند قبض وتحصيل نقدًا / POS</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <p className="text-slate-400">الفاتورة رقم: <strong className="text-sky-400">{selectedInvoice.invoiceNumber}</strong></p>
                <p className="text-slate-400">العميل: <strong className="text-white">{selectedInvoice.clientName}</strong></p>
                <p className="text-slate-400">المتبقي غير المحصل: <strong className="text-rose-400 font-bold">{selectedInvoice.remainingAmount} ج.م</strong></p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">المبلغ المستلم الآن (ج.م) *</label>
                <input
                  required
                  type="number"
                  max={selectedInvoice.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`أدخل المبلغ حتى ${selectedInvoice.remainingAmount}`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
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
