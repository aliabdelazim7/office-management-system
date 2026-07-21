'use client';

import React, { useState } from 'react';
import { GitPullRequest, CheckCircle2, Clock, AlertCircle, Plus, ChevronLeft, User, ArrowRight } from 'lucide-react';

export default function ServicesWorkflowPage() {
  const [services, setServices] = useState([
    {
      id: 'srv-1',
      orderNumber: 'SRV-2026-001',
      clientName: 'شركة المصرية للحلول البرمجية',
      serviceName: 'تجديد السجل التجاري والبطاقة الضريبية',
      assignedStaff: 'أ/ خليل ابراهيم (مندوب)',
      agreedPrice: '7,500 ج.م',
      status: 'IN_PROGRESS',
      dueDate: '2026-07-27',
      steps: [
        { stepIndex: 1, title: 'استلام الأوراق الأصلية من العميل', status: 'COMPLETED', notes: 'تم الاستلام بفرع المكتب الرئيسي' },
        { stepIndex: 2, title: 'مراجعة المستندات وتسديد الرسوم الحكومية', status: 'IN_PROGRESS', notes: 'جاري الدفع بمأمورية الاستثمار' },
        { stepIndex: 3, title: 'الذهاب للغرفة التجارية واستلام السجل الجديد', status: 'PENDING' },
        { stepIndex: 4, title: 'تسليم السجل المجدد للعميل', status: 'PENDING' },
      ],
    },
  ]);

  const [activeService, setActiveService] = useState<any>(services[0]);

  const handleUpdateStep = (stepIndex: number, newStatus: string) => {
    const updatedSteps = activeService.steps.map((s: any) =>
      s.stepIndex === stepIndex ? { ...s, status: newStatus } : s
    );

    const isAllCompleted = updatedSteps.every((s: any) => s.status === 'COMPLETED');

    const updatedService = {
      ...activeService,
      steps: updatedSteps,
      status: isAllCompleted ? 'COMPLETED' : 'IN_PROGRESS',
    };

    setActiveService(updatedService);
    setServices(services.map((srv) => (srv.id === updatedService.id ? updatedService : srv)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-indigo-500" />
            محرك إدارة المسارات والخدمات الحكومية (Multi-Step Workflow)
          </h1>
          <p className="text-xs text-[var(--text-muted)]">تتبع خطوات تنفيذ الخدمات خطوة بخطوة، المسند إليهم، الملاحظات والمواعيد.</p>
        </div>
      </div>

      {/* Services Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Service Orders List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-muted)]">طلبات المعاملات والخدمات المفتوحة:</h3>
          {services.map((srv) => (
            <div
              key={srv.id}
              onClick={() => setActiveService(srv)}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                activeService?.id === srv.id
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-subtle-sm'
                  : 'bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{srv.orderNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {srv.status === 'IN_PROGRESS' ? 'قيد التنفيذ الميداني' : 'مكتملة'}
                </span>
              </div>
              <h4 className="font-bold text-[var(--text-primary)] text-xs mb-1">{srv.serviceName}</h4>
              <p className="text-[11px] text-[var(--text-secondary)] mb-2">{srv.clientName}</p>
              <div className="flex justify-between text-[11px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2">
                <span>المسؤول: {srv.assignedStaff}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{srv.agreedPrice}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Multi-Step Workflow Visual Track */}
        {activeService && (
          <div className="lg:col-span-2 enterprise-card p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{activeService.orderNumber}</span>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{activeService.serviceName}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{activeService.clientName}</p>
              </div>

              <div className="text-left text-xs">
                <span className="block text-[var(--text-muted)]">القيمة الإجمالية:</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{activeService.agreedPrice}</span>
              </div>
            </div>

            {/* Workflow Progress Tracker */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-[var(--text-secondary)]">مراحل تنفيذ الخدمة الحكومية الميدانية (Step-by-Step Execution):</h4>

              <div className="space-y-3">
                {activeService.steps.map((step: any) => (
                  <div
                    key={step.stepIndex}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition ${
                      step.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : step.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          step.status === 'COMPLETED'
                            ? 'bg-emerald-500 text-white'
                            : step.status === 'IN_PROGRESS'
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {step.stepIndex}
                      </div>

                      <div className="space-y-1 text-xs">
                        <h5 className="font-bold text-[var(--text-primary)]">{step.title}</h5>
                        {step.notes && <p className="text-[11px] text-[var(--text-secondary)]">ملاحظات: {step.notes}</p>}
                      </div>
                    </div>

                    {/* Step Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center text-xs">
                      {step.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateStep(step.stepIndex, 'COMPLETED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
                        >
                          اعتماد إنجاز المرحلة ✓
                        </button>
                      )}
                      {step.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStep(step.stepIndex, 'IN_PROGRESS')}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow"
                        >
                          بدء المتابعة ⏳
                        </button>
                      )}
                      {step.status === 'COMPLETED' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> تم الإنجاز
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
