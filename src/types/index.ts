// ============================================================
// Domain Types — Financer Management SaaS
// ============================================================

export type UserRole = 'financer' | 'admin';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAYMENT_DUE'
  | 'GRACE'
  | 'SUSPENDED'
  | 'CANCELLED';

export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type ContractStatus = 'ACTIVE' | 'CLOSED' | 'PENDING' | 'OVERDUE';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export type DateRule = 'AUTO' | 'FIXED' | 'MANUAL';

export type FundSource = 'CASH' | 'BANK' | 'CARD';

export type AccountType = 'CASH' | 'BANK' | 'CARD' | 'OTHER';

export type TransactionDirection = 'IN' | 'OUT' | 'TRANSFER';
export type TransactionStatus = 'DONE' | 'PENDING';

export type TransactionType =
  | 'COLLECTION'
  | 'DISBURSAL'
  | 'INTEREST'
  | 'EXPENSE'
  | 'INCOME'
  | 'EMI'
  | 'CARD_PAYMENT'
  | 'TRANSFER'
  | 'ADJUSTMENT';

// --- Financer & Users ---

export interface Financer {
  id: string;
  businessName: string;
  ownerName: string;
  status: EntityStatus;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
  lastActivity: string;
  userCount: number;
}

export interface User {
  id: string;
  financerId: string;
  name: string;
  email: string;
  role: UserRole;
  status: EntityStatus;
  createdAt: string;
  lastLogin: string | null;
}

// --- Auth Session ---

export interface Session {
  userId: string;
  financerId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  businessName: string;
  isSupportMode: boolean;
  supportTargetName?: string;
}

// --- Person ---

export interface Person {
  id: string;
  financerId: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  status: EntityStatus;
  activeContracts: number;
  totalOutstanding: number;
  totalOverdue: number;
  lastActivity: string;
  createdAt: string;
}

export interface PersonDetail extends Omit<Person, 'notes' | 'activeContracts'> {
  contacts: PersonContact[];
  documents: DocumentRef[];
  notes: Note[];
  activeContracts: ContractSummary[];
  closedContracts: ContractSummary[];
  recentPayments: PaymentRecord[];
  recentActivity: AuditEntry[];
}

export interface PersonContact {
  label: string;
  value: string;
}

// --- Accounts ---

export interface Account {
  id: string;
  financerId: string;
  name: string;
  type: AccountType;
  balance: number;
  // For credit cards
  creditLimit?: number;
  used?: number;
  available?: number;
  dueDate?: string;
  // For banks
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
}

export interface AccountDetail extends Account {
  transactions: AccountTransaction[];
  relatedContracts: ContractSummary[];
}

export interface AccountTransaction {
  id: string;
  date: string;
  accountId: string;
  accountName: string;
  direction: TransactionDirection;
  type: TransactionType;
  amount: number;
  description: string;
  contractId?: string;
  personName?: string;
  personId?: string;
  status?: TransactionStatus;
  originalDueDate?: string;
  transferGroupId?: string;
}

// --- Contracts ---

export type ContractType = 'LDD' | 'MONTHLY_MANUAL' | 'MONTHLY_DIRECT' | 'DIRECT2' | 'THIRD_PARTY';

export interface ContractBase {
  id: string;
  financerId: string;
  personId: string;
  personName: string;
  type: ContractType;
  status: ContractStatus;
  actualAmountGiven: number;
  totalExpectedRecovery: number;
  totalCollected: number;
  outstanding: number;
  overdue: number;
  nextDueDate: string | null;
  nextDueAmount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface LDDDetails extends ContractBase {
  type: 'LDD';
  dailyCollection: number;
  days: number;
  upfrontDeduction: number;
  dateRule: DateRule;
}

export interface MonthlyManualDetails extends ContractBase {
  type: 'MONTHLY_MANUAL';
  monthlyInterest: number;
  period: number;
  plannedMonthlyPayment: number;
  dateRule: DateRule;
  firstDueDate: string;
}

export interface MonthlyDirectDetails extends ContractBase {
  type: 'MONTHLY_DIRECT';
  monthlyInterest: number;
  numberOfMonths: number;
  interestCreditDate: string;
  finalPrincipalDate: string;
}

export interface Direct2Details extends ContractBase {
  type: 'DIRECT2';
  totalAmountToReceive: number;
  dueDate: string;
  profit: number;
}

export type ThirdPartyType = 'LOAN_GIVEN' | 'LOAN_TAKEN' | 'EMI' | 'FAMILY_PERSONAL' | 'OTHER';
export type RecoveryMode = 'NONE' | 'ONE_TIME' | 'MONTHLY' | 'EMI' | 'MANUAL';

export interface ThirdPartyDetails extends ContractBase {
  type: 'THIRD_PARTY';
  thirdPartyType: ThirdPartyType;
  recoveryMode: RecoveryMode;
  monthlyAmount: number;
  purpose?: string;
}

export type Contract = LDDDetails | MonthlyManualDetails | MonthlyDirectDetails | Direct2Details | ThirdPartyDetails;

export interface ContractSummary {
  id: string;
  personName: string;
  type: ContractType;
  outstanding: number;
  overdue: number;
  status: ContractStatus;
  nextDueDate: string | null;
}

// --- Schedule ---

export interface ScheduleEntry {
  id: string;
  contractId: string;
  dueDate: string;
  amount: number;
  collected: number;
  remaining: number;
  status: PaymentStatus;
  isOverdue: boolean;
}

// --- Payments ---

export interface PaymentRecord {
  id: string;
  contractId: string;
  personName: string;
  date: string;
  amount: number;
  method: 'CASH' | 'BANK' | 'CARD' | 'UPI';
  accountName: string;
  reference?: string;
  notes?: string;
  collectedBy: string;
}

export interface PaymentAllocation {
  scheduleEntryId: string;
  amount: number;
}

export interface RecordPaymentInput {
  contractId: string;
  scheduleEntryId?: string;
  amount: number;
  method: 'CASH' | 'BANK' | 'CARD' | 'UPI';
  accountId: string;
  date: string;
  reference?: string;
  notes?: string;
}

// --- Adjustments ---

export interface Adjustment {
  id: string;
  contractId: string;
  date: string;
  amount: number;
  reason: string;
  type: 'CREDIT' | 'DEBIT';
  createdBy: string;
}

// --- Ledger (LDA) ---

export interface Ledger {
  contract: Contract;
  schedule: ScheduleEntry[];
  payments: PaymentRecord[];
  adjustments: Adjustment[];
  notes: Note[];
  activityHistory: AuditEntry[];
}

// --- Due ---

export type DueFilter = 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'ALL';

export interface DueItem {
  id: string;
  personName: string;
  contractId: string;
  contractType: ContractType;
  dueDate: string;
  dueAmount: number;
  paid: number;
  remaining: number;
  status: PaymentStatus;
}

export interface DueSummary {
  totalDue: number;
  collected: number;
  pending: number;
  overdue: number;
}

// --- Dashboard ---

export interface Dashboard {
  cashInHand: number;
  cashInBank: number;
  actualCash: number;
  creditCardBalance: number;
  creditAvailable: number;
  totalOutstanding: number;
  todayDue: number;
  collectedToday: number;
  overdue: number;
  expectedIn: number;
  expectedOut: number;
  activePeople: number;
  activeContracts: number;
  upcomingDues: DueItem[];
  overdueCustomers: { id: string; name: string; overdueAmount: number }[];
}

// --- Date Planner / Projection ---

export interface DateProjection {
  asOfDate: string;
  targetDate: string;
  cashInHand: number;
  cashInBank: number;
  actualCash: number;
  creditCardBalance: number;
  creditAvailable: number;
  receivable: number;
  payable: number;
  expectedIn: number;
  expectedOut: number;
  projectedActualCash: number;
  shortfall: number;
  timeline: PlannedCashflow[];
}

export interface PlannedCashflow {
  date: string;
  event: string;
  source: string;
  incoming: number;
  outgoing: number;
  projectedBalance: number;
}

// --- Monthly Report ---

export interface MonthlyReport {
  year: number;
  month: number;
  openingCash: number;
  closingCash: number;
  cashInHand: number;
  cashInBank: number;
  creditCardBalance: number;
  creditAvailable: number;
  moneyGiven: number;
  moneyCollected: number;
  interestReceived: number;
  otherIncome: number;
  expenses: number;
  emiPaid: number;
  cardPaid: number;
  receivable: number;
  payable: number;
  overdue: number;
  // For trend charts
  dailyCollections: { date: string; amount: number }[];
}

// --- Subscription ---

export interface Subscription {
  plan: string;
  status: SubscriptionStatus;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  nextBillingDate: string;
  features: string[];
  price: number;
}

// --- Notes & Documents ---

export interface Note {
  id: string;
  entityType: 'PERSON' | 'CONTRACT';
  entityId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface DocumentRef {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

// --- Audit ---

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface AuditLog {
  id: string;
  financerId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

// --- Form Inputs ---

export interface CreateLDDInput {
  personName: string;
  contact: string;
  totalRecovery: number;
  dailyCollection: number;
  days: number;
  actualAmountGiven: number;
  fundSource: FundSource;
  accountId: string;
  startDate: string;
  dateRule: DateRule;
  notes?: string;
}

export interface CreateMonthlyInput {
  mode: 'MANUAL' | 'DIRECT' | 'DIRECT2';
  personName: string;
  contact: string;
  amountGiven: number;
  monthlyInterest: number;
  period: number;
  plannedMonthlyPayment: number;
  numberOfMonths: number;
  interestCreditDate?: string;
  finalPrincipalDate?: string;
  totalAmountToReceive?: number;
  dueDate?: string;
  startDate: string;
  dateRule: DateRule;
  firstDueDate?: string;
  fundSource: FundSource;
  accountId: string;
  notes?: string;
}

export interface CreateThirdPartyInput {
  personName: string;
  type: ThirdPartyType;
  amount: number;
  recoveryMode: RecoveryMode;
  duration?: number;
  startDate: string;
  dueDate?: string;
  monthlyAmount?: number;
  fundSource: FundSource;
  accountId: string;
  notes?: string;
}

export interface CreateTransactionInput {
  date: string;
  accountId: string;
  direction: TransactionDirection;
  type: TransactionType;
  amount: number;
  description: string;
  contractId?: string;
  personId?: string;
  status?: TransactionStatus;
  transferToAccountId?: string;
}

export interface CreatePersonInput {
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}

// --- Admin ---

export interface AdminDashboard {
  totalFinancers: number;
  activeFinancers: number;
  trialFinancers: number;
  suspended: number;
  mrr: number;
  recentSignups: Financer[];
  recentActivity: AuditLog[];
  systemErrors: { id: string; message: string; timestamp: string }[];
}
