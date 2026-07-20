import { create } from 'zustand';
import { UserRole } from './types';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    jobTitle?: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
  setAuth: (token: string, user: any, tenant: any) => void;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: 'demo-jwt-token-active-session',
  user: {
    id: 'usr-owner-001',
    tenantId: 'tnt-elite-001',
    name: 'د. أحمد عبد الفتاح (المالك)',
    email: 'owner@elite.com',
    role: UserRole.OWNER,
    phone: '01011111111',
    jobTitle: 'المدير التنفيذي والمالك',
  },
  tenant: {
    id: 'tnt-elite-001',
    name: 'مكتب النخبة للخدمات والاستشارات الحكومية والمالية',
    subdomain: 'elite-consulting',
  },
  setAuth: (token, user, tenant) => set({ token, user, tenant }),
  logout: () => set({ token: null, user: null, tenant: null }),
  switchDemoRole: (role: UserRole) => {
    let name = '';
    let email = '';
    let jobTitle = '';

    switch (role) {
      case UserRole.OWNER:
        name = 'د. أحمد عبد الفتاح (المالك)';
        email = 'owner@elite.com';
        jobTitle = 'المدير التنفيذي والمالك';
        break;
      case UserRole.MANAGER:
        name = 'أ/ سارة محمود (مديرة العمليات)';
        email = 'manager@elite.com';
        jobTitle = 'مديرة التشغيل والمعاملات';
        break;
      case UserRole.ACCOUNTANT:
        name = 'أ/ محمد طاهر (محاسب مكتب)';
        email = 'accountant@elite.com';
        jobTitle = 'رئيس قسم الحسابات والضرائب';
        break;
      case UserRole.EMPLOYEE:
        name = 'أ/ خليل ابراهيم (مندوب ميداني)';
        email = 'employee@elite.com';
        jobTitle = 'مسؤول علاقات حكومية ومندوب ميداني';
        break;
      case UserRole.VIEWER:
        name = 'أ/ علاء مرسي (مراقب جودة)';
        email = 'viewer@elite.com';
        jobTitle = 'مستشار قانوني خارجي (اطلاع)';
        break;
    }

    set((state) => ({
      user: state.user ? { ...state.user, role, name, email, jobTitle } : null,
    }));
  },
}));
