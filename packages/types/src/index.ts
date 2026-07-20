export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  EMPLOYEE = 'EMPLOYEE',
  VIEWER = 'VIEWER',
}

export enum LegalType {
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP', // منشأة فردية
  PARTNERSHIP = 'PARTNERSHIP', // شركة تضامن
  LIMITED_PARTNERSHIP = 'LIMITED_PARTNERSHIP', // شركة توصية بسيطة
  LLC = 'LLC', // شركة ذات مسؤولية محدودة
  JOINT_STOCK = 'JOINT_STOCK', // شركة مساهمة
  SINGLE_PERSON = 'SINGLE_PERSON', // شركة شخص واحد
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export interface UserSession {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: UserSession;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    logoUrl?: string;
  };
}

export interface ClientDto {
  id: string;
  tenantId: string;
  clientCode: string;
  name: string;
  companyName: string;
  tradeName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  businessActivity?: string;
  legalType: LegalType;
  branchesCount: number;
  createdAt: string;
}

export interface DocumentDto {
  id: string;
  tenantId: string;
  clientId: string;
  clientName?: string;
  uploaderId: string;
  uploaderName?: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  expiryDate?: string;
  reminderDays: number;
  isExpired: Boolean;
  createdAt: string;
}

export interface CommercialRegisterDto {
  id: string;
  tenantId: string;
  clientId: string;
  registerNumber: string;
  depositNumber?: string;
  tradeName: string;
  capital: number;
  activity: string;
  address: string;
  branches?: string;
  additions?: string;
  registrationDate: string;
  expiryDate: string;
  reminderDays: number;
}

export interface TaxCardDto {
  id: string;
  tenantId: string;
  clientId: string;
  cardNumber: string;
  activity: string;
  taxOffice: string;
  taxCode?: string;
  serialNumber?: string;
  printDate?: string;
  expiryDate: string;
  taxSystemStatus?: string;
  taxSystemStart?: string;
  taxSystemEnd?: string;
  vehiclesData?: any;
}

export interface SocialInsuranceDto {
  id: string;
  tenantId: string;
  clientId: string;
  insuranceNumber: string;
  openDate: string;
  workforceCount: number;
  registeredEmployees?: any;
  vehiclesData?: any;
  lastRenewalDate?: string;
  expiryDate?: string;
}

export interface FederationMembershipDto {
  id: string;
  tenantId: string;
  clientId: string;
  membershipNumber: string;
  enrollmentDate: string;
  annualRenewalDate: string;
  classification: string;
  category: string;
  lastPromotionDate?: string;
  experienceYears: number;
}

export interface ServiceOrderStep {
  stepIndex: number;
  title: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  dueDate?: string;
  status: TaskStatus;
  notes?: string;
  attachmentUrl?: string;
}

export interface ServiceOrderDto {
  id: string;
  tenantId: string;
  orderNumber: string;
  clientId: string;
  clientName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  serviceName: string;
  agreedPrice: number;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  notes?: string;
  steps?: ServiceOrderStep[];
  createdAt: string;
}

export interface FieldLogDto {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  clientId?: string;
  clientName?: string;
  govEntity: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  visitDate: string;
  startTime?: string;
  endTime?: string;
  details: string;
  status: TaskStatus;
  delayReason?: string;
  createdAt: string;
}

export interface InvoiceDto {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  serviceOrderId?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseDto {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  amount: number;
  recipient?: string;
  paidBy: string;
  expenseDate: string;
  receiptUrl?: string;
}

export interface AuditLogDto {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: string;
}

export interface ExpiryReminderAlert {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  type: 'COMMERCIAL_REGISTER' | 'TAX_CARD' | 'DOCUMENT' | 'CONTRACT' | 'INSURANCE' | 'FEDERATION';
  expiryDate: string;
  daysRemaining: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DashboardMetrics {
  totalClients: number;
  activeServices: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  expiringDocumentsCount: number;
  overdueTasksCount: number;
  pendingInvoicesCount: number;
  expiringAlerts: ExpiryReminderAlert[];
}
