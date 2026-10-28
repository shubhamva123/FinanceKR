import type {
  Account,
  AccountTransaction,
  AuditEntry,
  AuditLog,
  Contract,
  Dashboard,
  DateProjection,
  DueItem,
  Financer,
  MonthlyReport,
  Note,
  PaymentRecord,
  Person,
  PersonDetail,
  ScheduleEntry,
  Subscription,
  User,
  AdminDashboard,
  ContractSummary,
  Adjustment,
} from '@/types';

export const mockFinancer: Financer = {
  id: 'fin-001',
  businessName: 'Shree Lakshmi Finance',
  ownerName: 'Rajesh Patel',
  status: 'ACTIVE',
  subscriptionStatus: 'ACTIVE',
  createdAt: '2024-03-15T10:00:00Z',
  lastActivity: '2026-10-07T08:30:00Z',
  userCount: 3,
};

export const mockUsers: User[] = [
  {
    id: 'usr-001',
    financerId: 'fin-001',
    name: 'Rajesh Patel',
    email: 'rajesh@shreelakshmi.com',
    role: 'financer',
    status: 'ACTIVE',
    createdAt: '2024-03-15T10:00:00Z',
    lastLogin: '2026-10-07T08:30:00Z',
  },
  {
    id: 'usr-002',
    financerId: 'fin-001',
    name: 'Priya Patel',
    email: 'priya@shreelakshmi.com',
    role: 'financer',
    status: 'ACTIVE',
    createdAt: '2024-06-20T10:00:00Z',
    lastLogin: '2026-10-06T17:00:00Z',
  },
  {
    id: 'usr-003',
    financerId: 'fin-001',
    name: 'Amit Shah',
    email: 'amit@shreelakshmi.com',
    role: 'financer',
    status: 'ACTIVE',
    createdAt: '2025-01-10T10:00:00Z',
    lastLogin: '2026-10-05T14:00:00Z',
  },
];

export const mockAccounts: Account[] = [
  { id: 'acc-cash', financerId: 'fin-001', name: 'Cash in Hand', type: 'CASH', balance: 185000, createdAt: '2024-03-15T10:00:00Z' },
  { id: 'acc-bob', financerId: 'fin-001', name: 'Bank of Baroda', type: 'BANK', bankName: 'BOB', accountNumber: '****4521', balance: 540000, createdAt: '2024-03-15T10:00:00Z' },
  { id: 'acc-hdfc', financerId: 'fin-001', name: 'HDFC Bank', type: 'BANK', bankName: 'HDFC', accountNumber: '****8830', balance: 320000, createdAt: '2024-03-20T10:00:00Z' },
  { id: 'acc-icici', financerId: 'fin-001', name: 'ICICI Bank', type: 'BANK', bankName: 'ICICI', accountNumber: '****1107', balance: 150000, createdAt: '2024-05-01T10:00:00Z' },
  { id: 'acc-card-hdfc', financerId: 'fin-001', name: 'HDFC Credit Card', type: 'CARD', balance: 85000, creditLimit: 200000, used: 85000, available: 115000, dueDate: '2026-10-15', createdAt: '2024-03-15T10:00:00Z' },
  { id: 'acc-card-icici', financerId: 'fin-001', name: 'ICICI Credit Card', type: 'CARD', balance: 42000, creditLimit: 150000, used: 42000, available: 108000, dueDate: '2026-10-20', createdAt: '2024-04-01T10:00:00Z' },
];

export const mockPeople: Person[] = [
  { id: 'p-001', financerId: 'fin-001', name: 'Suresh Kumar', phone: '9876543210', address: 'MG Road, Pune', status: 'ACTIVE', activeContracts: 2, totalOutstanding: 48000, totalOverdue: 5000, lastActivity: '2026-10-07T08:00:00Z', createdAt: '2024-06-01T10:00:00Z' },
  { id: 'p-002', financerId: 'fin-001', name: 'Mahesh Yadav', phone: '9822334455', address: 'FC Road, Pune', status: 'ACTIVE', activeContracts: 1, totalOutstanding: 15000, totalOverdue: 0, lastActivity: '2026-10-06T17:00:00Z', createdAt: '2024-08-15T10:00:00Z' },
  { id: 'p-003', financerId: 'fin-001', name: 'Ramesh Gupta', phone: '9988776655', address: 'Kothrud, Pune', status: 'ACTIVE', activeContracts: 3, totalOutstanding: 125000, totalOverdue: 12000, lastActivity: '2026-10-07T09:00:00Z', createdAt: '2024-04-10T10:00:00Z' },
  { id: 'p-004', financerId: 'fin-001', name: 'Anil Deshmukh', phone: '9090909090', address: 'Hadapsar, Pune', status: 'ACTIVE', activeContracts: 1, totalOutstanding: 9000, totalOverdue: 0, lastActivity: '2026-10-05T14:00:00Z', createdAt: '2025-01-20T10:00:00Z' },
  { id: 'p-005', financerId: 'fin-001', name: 'Vijay More', phone: '9123456780', address: 'Camp, Pune', status: 'ACTIVE', activeContracts: 2, totalOutstanding: 67000, totalOverdue: 3000, lastActivity: '2026-10-04T16:00:00Z', createdAt: '2024-09-05T10:00:00Z' },
  { id: 'p-006', financerId: 'fin-001', name: 'Sunita Sharma', phone: '9000011122', address: 'Aundh, Pune', status: 'ACTIVE', activeContracts: 1, totalOutstanding: 32000, totalOverdue: 0, lastActivity: '2026-10-03T11:00:00Z', createdAt: '2025-02-14T10:00:00Z' },
  { id: 'p-007', financerId: 'fin-001', name: 'Deepak Joshi', phone: '9555566677', address: 'Baner, Pune', status: 'ACTIVE', activeContracts: 2, totalOutstanding: 78000, totalOverdue: 8000, lastActivity: '2026-10-02T15:00:00Z', createdAt: '2024-07-18T10:00:00Z' },
  { id: 'p-008', financerId: 'fin-001', name: 'Kavita Nair', phone: '9333344455', address: 'Wakad, Pune', status: 'INACTIVE', activeContracts: 0, totalOutstanding: 0, totalOverdue: 0, lastActivity: '2026-08-15T10:00:00Z', createdAt: '2024-05-22T10:00:00Z' },
  { id: 'p-009', financerId: 'fin-001', name: 'Prakash Rao', phone: '9444455566', address: 'Kothrud, Pune', status: 'ACTIVE', activeContracts: 1, totalOutstanding: 21000, totalOverdue: 0, lastActivity: '2026-10-01T13:00:00Z', createdAt: '2025-03-10T10:00:00Z' },
  { id: 'p-010', financerId: 'fin-001', name: 'Nilesh Pawar', phone: '9666677788', address: 'Dhayari, Pune', status: 'ACTIVE', activeContracts: 1, totalOutstanding: 10500, totalOverdue: 1500, lastActivity: '2026-09-30T17:00:00Z', createdAt: '2024-11-30T10:00:00Z' },
];

export const mockContracts: Contract[] = [
  // LDD — the canonical example: ₹41,000 given, ₹1,000/day, 50 days, ₹50,000 recovery
  {
    id: 'c-001', financerId: 'fin-001', personId: 'p-001', personName: 'Suresh Kumar',
    type: 'LDD', status: 'ACTIVE',
    actualAmountGiven: 41000, totalExpectedRecovery: 50000, totalCollected: 2000,
    outstanding: 48000, overdue: 5000,
    nextDueDate: '2026-10-08', nextDueAmount: 1000,
    startDate: '2026-09-19', endDate: '2026-11-07', createdAt: '2026-09-19T10:00:00Z',
    dailyCollection: 1000, days: 50, upfrontDeduction: 9000, dateRule: 'AUTO',
  },
  {
    id: 'c-002', financerId: 'fin-001', personId: 'p-001', personName: 'Suresh Kumar',
    type: 'LDD', status: 'ACTIVE',
    actualAmountGiven: 20000, totalExpectedRecovery: 25000, totalCollected: 5000,
    outstanding: 20000, overdue: 0,
    nextDueDate: '2026-10-08', nextDueAmount: 500,
    startDate: '2026-09-30', endDate: '2026-11-19', createdAt: '2026-09-30T10:00:00Z',
    dailyCollection: 500, days: 50, upfrontDeduction: 5000, dateRule: 'AUTO',
  },
  // Monthly Manual
  {
    id: 'c-003', financerId: 'fin-001', personId: 'p-003', personName: 'Ramesh Gupta',
    type: 'MONTHLY_MANUAL', status: 'ACTIVE',
    actualAmountGiven: 100000, totalExpectedRecovery: 130000, totalCollected: 25000,
    outstanding: 105000, overdue: 12000,
    nextDueDate: '2026-10-10', nextDueAmount: 10000,
    startDate: '2026-07-10', endDate: '2027-01-10', createdAt: '2026-07-10T10:00:00Z',
    monthlyInterest: 5000, period: 6, plannedMonthlyPayment: 10000, dateRule: 'FIXED', firstDueDate: '2026-08-10',
  },
  // Monthly Direct
  {
    id: 'c-004', financerId: 'fin-001', personId: 'p-005', personName: 'Vijay More',
    type: 'MONTHLY_DIRECT', status: 'ACTIVE',
    actualAmountGiven: 50000, totalExpectedRecovery: 62000, totalCollected: 18000,
    outstanding: 44000, overdue: 3000,
    nextDueDate: '2026-10-12', nextDueAmount: 2000,
    startDate: '2026-06-15', endDate: '2026-12-15', createdAt: '2026-06-15T10:00:00Z',
    monthlyInterest: 2000, numberOfMonths: 6, interestCreditDate: '2026-07-15', finalPrincipalDate: '2026-12-15',
  },
  // Direct 2 — the canonical example: ₹10,000 given, ₹10,500 expected
  {
    id: 'c-005', financerId: 'fin-001', personId: 'p-004', personName: 'Anil Deshmukh',
    type: 'DIRECT2', status: 'ACTIVE',
    actualAmountGiven: 10000, totalExpectedRecovery: 10500, totalCollected: 1500,
    outstanding: 9000, overdue: 0,
    nextDueDate: '2026-10-25', nextDueAmount: 10500,
    startDate: '2026-09-25', endDate: '2026-10-25', createdAt: '2026-09-25T10:00:00Z',
    totalAmountToReceive: 10500, dueDate: '2026-10-25', profit: 500,
  },
  // Third Party — Loan Given
  {
    id: 'c-006', financerId: 'fin-001', personId: 'p-007', personName: 'Deepak Joshi',
    type: 'THIRD_PARTY', status: 'ACTIVE',
    actualAmountGiven: 80000, totalExpectedRecovery: 88000, totalCollected: 10000,
    outstanding: 78000, overdue: 8000,
    nextDueDate: '2026-10-15', nextDueAmount: 8000,
    startDate: '2026-08-15', endDate: '2026-12-15', createdAt: '2026-08-15T10:00:00Z',
    thirdPartyType: 'LOAN_GIVEN', recoveryMode: 'EMI', monthlyAmount: 8000,
  },
  // Third Party — EMI (Loan Taken)
  {
    id: 'c-007', financerId: 'fin-001', personId: 'p-002', personName: 'Mahesh Yadav',
    type: 'THIRD_PARTY', status: 'ACTIVE',
    actualAmountGiven: 15000, totalExpectedRecovery: 15000, totalCollected: 0,
    outstanding: 15000, overdue: 0,
    nextDueDate: '2026-10-10', nextDueAmount: 2500,
    startDate: '2026-08-10', endDate: '2027-02-10', createdAt: '2026-08-10T10:00:00Z',
    thirdPartyType: 'EMI', recoveryMode: 'EMI', monthlyAmount: 2500,
  },
  // Monthly Manual — Ramesh Gupta second
  {
    id: 'c-008', financerId: 'fin-001', personId: 'p-003', personName: 'Ramesh Gupta',
    type: 'MONTHLY_MANUAL', status: 'ACTIVE',
    actualAmountGiven: 20000, totalExpectedRecovery: 26000, totalCollected: 4000,
    outstanding: 22000, overdue: 0,
    nextDueDate: '2026-10-18', nextDueAmount: 4000,
    startDate: '2026-09-18', endDate: '2027-03-18', createdAt: '2026-09-18T10:00:00Z',
    monthlyInterest: 1000, period: 6, plannedMonthlyPayment: 4000, dateRule: 'AUTO', firstDueDate: '2026-10-18',
  },
  // LDD — Sunita Sharma
  {
    id: 'c-009', financerId: 'fin-001', personId: 'p-006', personName: 'Sunita Sharma',
    type: 'LDD', status: 'ACTIVE',
    actualAmountGiven: 30000, totalExpectedRecovery: 37000, totalCollected: 5000,
    outstanding: 32000, overdue: 0,
    nextDueDate: '2026-10-08', nextDueAmount: 740,
    startDate: '2026-09-23', endDate: '2026-11-12', createdAt: '2026-09-23T10:00:00Z',
    dailyCollection: 740, days: 50, upfrontDeduction: 7000, dateRule: 'AUTO',
  },
  // Third Party — Family/Personal
  {
    id: 'c-010', financerId: 'fin-001', personId: 'p-009', personName: 'Prakash Rao',
    type: 'THIRD_PARTY', status: 'ACTIVE',
    actualAmountGiven: 21000, totalExpectedRecovery: 21000, totalCollected: 0,
    outstanding: 21000, overdue: 0,
    nextDueDate: null, nextDueAmount: 0,
    startDate: '2026-10-01', endDate: '2026-12-01', createdAt: '2026-10-01T10:00:00Z',
    thirdPartyType: 'FAMILY_PERSONAL', recoveryMode: 'NONE', monthlyAmount: 0,
  },
  // LDD — Nilesh Pawar (has overdue)
  {
    id: 'c-011', financerId: 'fin-001', personId: 'p-010', personName: 'Nilesh Pawar',
    type: 'LDD', status: 'OVERDUE',
    actualAmountGiven: 12000, totalExpectedRecovery: 15000, totalCollected: 4500,
    outstanding: 10500, overdue: 1500,
    nextDueDate: '2026-10-07', nextDueAmount: 500,
    startDate: '2026-09-22', endDate: '2026-11-11', createdAt: '2026-09-22T10:00:00Z',
    dailyCollection: 500, days: 30, upfrontDeduction: 3000, dateRule: 'AUTO',
  },
  // Third Party — Deepak Joshi second
  {
    id: 'c-012', financerId: 'fin-001', personId: 'p-007', personName: 'Deepak Joshi',
    type: 'THIRD_PARTY', status: 'ACTIVE',
    actualAmountGiven: 50000, totalExpectedRecovery: 0, totalCollected: 0,
    outstanding: 0, overdue: 0,
    nextDueDate: '2026-10-12', nextDueAmount: 5000,
    startDate: '2026-09-12', endDate: '2027-09-12', createdAt: '2026-09-12T10:00:00Z',
    thirdPartyType: 'LOAN_TAKEN', recoveryMode: 'MONTHLY', monthlyAmount: 5000,
  },
  // Closed contract
  {
    id: 'c-013', financerId: 'fin-001', personId: 'p-005', personName: 'Vijay More',
    type: 'LDD', status: 'CLOSED',
    actualAmountGiven: 15000, totalExpectedRecovery: 18000, totalCollected: 18000,
    outstanding: 0, overdue: 0,
    nextDueDate: null, nextDueAmount: 0,
    startDate: '2026-06-01', endDate: '2026-07-01', createdAt: '2026-06-01T10:00:00Z',
    dailyCollection: 600, days: 30, upfrontDeduction: 3000, dateRule: 'AUTO',
  },
];

export function generateMockSchedule(contractId: string, entries: ScheduleEntry[]): ScheduleEntry[] {
  if (entries.length) return entries;
  return [];
}

export const mockPayments: PaymentRecord[] = [
  { id: 'pay-001', contractId: 'c-001', personName: 'Suresh Kumar', date: '2026-10-07', amount: 1000, method: 'CASH', accountName: 'Cash in Hand', collectedBy: 'Rajesh Patel' },
  { id: 'pay-002', contractId: 'c-001', personName: 'Suresh Kumar', date: '2026-10-06', amount: 1000, method: 'CASH', accountName: 'Cash in Hand', collectedBy: 'Rajesh Patel' },
  { id: 'pay-003', contractId: 'c-003', personName: 'Ramesh Gupta', date: '2026-10-05', amount: 10000, method: 'BANK', accountName: 'HDFC Bank', reference: 'NEFT-8830', collectedBy: 'Priya Patel' },
  { id: 'pay-004', contractId: 'c-004', personName: 'Vijay More', date: '2026-10-04', amount: 2000, method: 'UPI', accountName: 'Bank of Baroda', reference: 'UPI-9920', collectedBy: 'Rajesh Patel' },
  { id: 'pay-005', contractId: 'c-005', personName: 'Anil Deshmukh', date: '2026-10-03', amount: 1500, method: 'CASH', accountName: 'Cash in Hand', collectedBy: 'Rajesh Patel' },
];

export const mockTransactions: AccountTransaction[] = [
  { id: 't-001', date: '2026-10-07', accountId: 'acc-cash', accountName: 'Cash in Hand', direction: 'IN', type: 'COLLECTION', amount: 1000, description: 'Daily collection - Suresh Kumar', contractId: 'c-001', personName: 'Suresh Kumar' },
  { id: 't-002', date: '2026-10-07', accountId: 'acc-cash', accountName: 'Cash in Hand', direction: 'IN', type: 'COLLECTION', amount: 740, description: 'Daily collection - Sunita Sharma', contractId: 'c-009', personName: 'Sunita Sharma' },
  { id: 't-003', date: '2026-10-06', accountId: 'acc-hdfc', accountName: 'HDFC Bank', direction: 'IN', type: 'COLLECTION', amount: 10000, description: 'Monthly payment - Ramesh Gupta', contractId: 'c-003', personName: 'Ramesh Gupta' },
  { id: 't-004', date: '2026-10-05', accountId: 'acc-bob', accountName: 'Bank of Baroda', direction: 'IN', type: 'COLLECTION', amount: 2000, description: 'Interest - Vijay More', contractId: 'c-004', personName: 'Vijay More' },
  { id: 't-005', date: '2026-10-04', accountId: 'acc-cash', accountName: 'Cash in Hand', direction: 'OUT', type: 'DISBURSAL', amount: 41000, description: 'LDD disbursal - Suresh Kumar', contractId: 'c-001', personName: 'Suresh Kumar' },
  { id: 't-006', date: '2026-10-03', accountId: 'acc-hdfc', accountName: 'HDFC Bank', direction: 'OUT', type: 'DISBURSAL', amount: 100000, description: 'Monthly loan - Ramesh Gupta', contractId: 'c-003', personName: 'Ramesh Gupta' },
  { id: 't-007', date: '2026-10-02', accountId: 'acc-card-hdfc', accountName: 'HDFC Credit Card', direction: 'OUT', type: 'EXPENSE', amount: 5000, description: 'Office supplies' },
  { id: 't-008', date: '2026-10-01', accountId: 'acc-cash', accountName: 'Cash in Hand', direction: 'TRANSFER', type: 'TRANSFER', amount: 50000, description: 'Cash deposit to HDFC' },
  { id: 't-009', date: '2026-09-30', accountId: 'acc-icici', accountName: 'ICICI Bank', direction: 'OUT', type: 'EMI', amount: 2500, description: 'EMI - Mahesh Yadav', contractId: 'c-007', personName: 'Mahesh Yadav' },
  { id: 't-010', date: '2026-09-29', accountId: 'acc-cash', accountName: 'Cash in Hand', direction: 'IN', type: 'INTEREST', amount: 2000, description: 'Interest collection - Vijay More', contractId: 'c-004', personName: 'Vijay More' },
];

export const mockAdjustments: Adjustment[] = [
  { id: 'adj-001', contractId: 'c-003', date: '2026-09-20', amount: 500, reason: 'Late payment penalty waiver', type: 'CREDIT', createdBy: 'Rajesh Patel' },
];

export const mockNotes: Note[] = [
  { id: 'n-001', entityType: 'PERSON', entityId: 'p-001', content: 'Reliable payer. Prefers cash collections in the morning.', createdBy: 'Rajesh Patel', createdAt: '2026-09-15T10:00:00Z' },
  { id: 'n-002', entityType: 'PERSON', entityId: 'p-003', content: 'Has multiple active loans. Monitor outstanding closely.', createdBy: 'Priya Patel', createdAt: '2026-08-20T10:00:00Z' },
];

export const mockAuditEntries: AuditEntry[] = [
  { id: 'a-001', action: 'CONTRACT_CREATED', entityType: 'CONTRACT', entityId: 'c-001', performedBy: 'Rajesh Patel', timestamp: '2026-09-19T10:00:00Z', details: 'LDD contract created for Suresh Kumar' },
  { id: 'a-002', action: 'PAYMENT_RECORDED', entityType: 'CONTRACT', entityId: 'c-001', performedBy: 'Rajesh Patel', timestamp: '2026-10-07T08:00:00Z', details: '₹1,000 collected via Cash' },
  { id: 'a-003', action: 'PAYMENT_RECORDED', entityType: 'CONTRACT', entityId: 'c-003', performedBy: 'Priya Patel', timestamp: '2026-10-05T14:00:00Z', details: '₹10,000 collected via NEFT' },
];

export const mockDashboard: Dashboard = {
  cashInHand: 185000,
  cashInBank: 1010000,
  actualCash: 1195000,
  creditCardBalance: 127000,
  creditAvailable: 223000,
  totalOutstanding: 395000,
  todayDue: 32000,
  collectedToday: 1740,
  overdue: 29500,
  expectedIn: 45000,
  expectedOut: 30000,
  activePeople: 9,
  activeContracts: 12,
  upcomingDues: [],
  overdueCustomers: [
    { id: 'p-010', name: 'Nilesh Pawar', overdueAmount: 1500 },
    { id: 'p-003', name: 'Ramesh Gupta', overdueAmount: 12000 },
    { id: 'p-007', name: 'Deepak Joshi', overdueAmount: 8000 },
    { id: 'p-001', name: 'Suresh Kumar', overdueAmount: 5000 },
    { id: 'p-005', name: 'Vijay More', overdueAmount: 3000 },
  ],
};

export const mockSubscription: Subscription = {
  plan: 'Professional',
  status: 'ACTIVE',
  billingPeriod: 'MONTHLY',
  nextBillingDate: '2026-11-01',
  features: ['Unimited contracts', 'Unlimited people', 'All contract types', 'Date planner', 'Monthly reports', 'Multi-user access'],
  price: 1999,
};

export const mockDateProjection: DateProjection = {
  asOfDate: '2026-10-07',
  targetDate: '2026-10-31',
  cashInHand: 185000,
  cashInBank: 1010000,
  actualCash: 1195000,
  creditCardBalance: 127000,
  creditAvailable: 223000,
  receivable: 285000,
  payable: 75000,
  expectedIn: 285000,
  expectedOut: 105000,
  projectedActualCash: 1375000,
  shortfall: 0,
  timeline: [
    { date: '2026-10-08', event: 'LDD Collection - Suresh Kumar', source: 'c-001', incoming: 1000, outgoing: 0, projectedBalance: 185000 },
    { date: '2026-10-08', event: 'LDD Collection - Sunita Sharma', source: 'c-009', incoming: 740, outgoing: 0, projectedBalance: 185740 },
    { date: '2026-10-10', event: 'Monthly Payment - Ramesh Gupta', source: 'c-003', incoming: 10000, outgoing: 0, projectedBalance: 195740 },
    { date: '2026-10-10', event: 'EMI - Mahesh Yadav', source: 'c-007', incoming: 0, outgoing: 2500, projectedBalance: 193240 },
    { date: '2026-10-12', event: 'Interest - Vijay More', source: 'c-004', incoming: 2000, outgoing: 0, projectedBalance: 195240 },
    { date: '2026-10-15', event: 'HDFC Card Due', source: 'acc-card-hdfc', incoming: 0, outgoing: 85000, projectedBalance: 110240 },
    { date: '2026-10-18', event: 'Monthly Payment - Ramesh Gupta', source: 'c-008', incoming: 4000, outgoing: 0, projectedBalance: 114240 },
    { date: '2026-10-25', event: 'Direct2 - Anil Deshmukh', source: 'c-005', incoming: 10500, outgoing: 0, projectedBalance: 124740 },
  ],
};

export const mockMonthlyReport: MonthlyReport = {
  year: 2026, month: 9,
  openingCash: 980000,
  closingCash: 1195000,
  cashInHand: 185000,
  cashInBank: 1010000,
  creditCardBalance: 127000,
  creditAvailable: 223000,
  moneyGiven: 163000,
  moneyCollected: 89240,
  interestReceived: 18000,
  otherIncome: 5000,
  expenses: 12000,
  emiPaid: 7500,
  cardPaid: 45000,
  receivable: 320000,
  payable: 60000,
  overdue: 29500,
  dailyCollections: [
    { date: '2026-09-01', amount: 3200 },
    { date: '2026-09-05', amount: 5400 },
    { date: '2026-09-10', amount: 12000 },
    { date: '2026-09-15', amount: 8600 },
    { date: '2026-09-20', amount: 4200 },
    { date: '2026-09-25', amount: 15000 },
    { date: '2026-09-30', amount: 40840 },
  ],
};

export const mockAuditLogs: AuditLog[] = [
  { id: 'al-001', financerId: 'fin-001', action: 'CONTRACT_CREATED', performedBy: 'Rajesh Patel', timestamp: '2026-10-07T08:00:00Z', details: 'Created LDD contract c-001 for Suresh Kumar', severity: 'INFO' },
  { id: 'al-002', financerId: 'fin-001', action: 'PAYMENT_RECORDED', performedBy: 'Rajesh Patel', timestamp: '2026-10-07T08:30:00Z', details: 'Recorded ₹1,000 payment for c-001', severity: 'INFO' },
  { id: 'al-003', financerId: 'fin-001', action: 'ADJUSTMENT_MADE', performedBy: 'Priya Patel', timestamp: '2026-10-05T14:00:00Z', details: 'Adjustment of ₹500 on c-003', severity: 'WARNING' },
  { id: 'al-004', financerId: 'fin-001', action: 'CONTRACT_RENEWED', performedBy: 'Rajesh Patel', timestamp: '2026-10-02T16:00:00Z', details: 'Renewed contract c-013', severity: 'INFO' },
  { id: 'al-005', financerId: 'fin-001', action: 'MIC_PERFORMED', performedBy: 'Rajesh Patel', timestamp: '2026-10-01T11:00:00Z', details: 'MIC on contract c-004', severity: 'CRITICAL' },
];

export const mockAdminDashboard: AdminDashboard = {
  totalFinancers: 47,
  activeFinancers: 38,
  trialFinancers: 6,
  suspended: 3,
  mrr: 75962,
  recentSignups: [
    { id: 'fin-045', businessName: 'Patel Finance', ownerName: 'Jignesh Patel', status: 'ACTIVE', subscriptionStatus: 'TRIAL', createdAt: '2026-10-05T10:00:00Z', lastActivity: '2026-10-07T08:00:00Z', userCount: 1 },
    { id: 'fin-046', businessName: 'Sharma Money Lenders', ownerName: 'Karan Sharma', status: 'ACTIVE', subscriptionStatus: 'TRIAL', createdAt: '2026-10-03T10:00:00Z', lastActivity: '2026-10-06T17:00:00Z', userCount: 2 },
    { id: 'fin-047', businessName: 'Gupta Lending Corp', ownerName: 'Aakash Gupta', status: 'ACTIVE', subscriptionStatus: 'ACTIVE', createdAt: '2026-10-01T10:00:00Z', lastActivity: '2026-10-07T09:00:00Z', userCount: 4 },
  ],
  recentActivity: mockAuditLogs.slice(0, 3),
  systemErrors: [
    { id: 'err-001', message: 'Payment gateway timeout for fin-022', timestamp: '2026-10-07T07:15:00Z' },
  ],
};

export const mockAdminFinancers: Financer[] = [
  mockFinancer,
  { id: 'fin-002', businessName: 'Patel Finance', ownerName: 'Jignesh Patel', status: 'ACTIVE', subscriptionStatus: 'TRIAL', createdAt: '2026-10-05T10:00:00Z', lastActivity: '2026-10-07T08:00:00Z', userCount: 1 },
  { id: 'fin-003', businessName: 'Sharma Money Lenders', ownerName: 'Karan Sharma', status: 'ACTIVE', subscriptionStatus: 'TRIAL', createdAt: '2026-10-03T10:00:00Z', lastActivity: '2026-10-06T17:00:00Z', userCount: 2 },
  { id: 'fin-004', businessName: 'Gupta Lending Corp', ownerName: 'Aakash Gupta', status: 'ACTIVE', subscriptionStatus: 'ACTIVE', createdAt: '2026-10-01T10:00:00Z', lastActivity: '2026-10-07T09:00:00Z', userCount: 4 },
  { id: 'fin-005', businessName: 'Verma Finance', ownerName: 'Suresh Verma', status: 'ACTIVE', subscriptionStatus: 'ACTIVE', createdAt: '2026-09-15T10:00:00Z', lastActivity: '2026-10-07T10:00:00Z', userCount: 3 },
  { id: 'fin-006', businessName: 'Reddy Loans', ownerName: 'Krishna Reddy', status: 'ACTIVE', subscriptionStatus: 'PAYMENT_DUE', createdAt: '2026-08-20T10:00:00Z', lastActivity: '2026-10-05T14:00:00Z', userCount: 2 },
  { id: 'fin-007', businessName: 'Singh Enterprises', ownerName: 'Harpreet Singh', status: 'SUSPENDED', subscriptionStatus: 'SUSPENDED', createdAt: '2026-07-01T10:00:00Z', lastActivity: '2026-09-28T11:00:00Z', userCount: 5 },
  { id: 'fin-008', businessName: 'Nair Financial Services', ownerName: 'Lakshmi Nair', status: 'ACTIVE', subscriptionStatus: 'GRACE', createdAt: '2026-06-15T10:00:00Z', lastActivity: '2026-10-04T16:00:00Z', userCount: 2 },
];

export const mockContractSummaries: ContractSummary[] = mockContracts.map((c) => ({
  id: c.id,
  personName: c.personName,
  type: c.type,
  outstanding: c.outstanding,
  overdue: c.overdue,
  status: c.status,
  nextDueDate: c.nextDueDate,
}));

export function generateScheduleForContract(contract: Contract): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  const start = new Date(contract.startDate);

  if (contract.type === 'LDD') {
    for (let i = 0; i < contract.days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const collected = i < Math.floor(contract.totalCollected / contract.dailyCollection) ? contract.dailyCollection : 0;
      const status = collected >= contract.dailyCollection ? 'PAID' : date < new Date() ? 'OVERDUE' : 'PENDING';
      entries.push({
        id: `s-${contract.id}-${i}`,
        contractId: contract.id,
        dueDate: dateStr,
        amount: contract.dailyCollection,
        collected,
        remaining: contract.dailyCollection - collected,
        status: status as 'PAID' | 'PENDING' | 'OVERDUE',
        isOverdue: status === 'OVERDUE',
      });
    }
  } else if (contract.type === 'MONTHLY_MANUAL' || contract.type === 'MONTHLY_DIRECT') {
    const months = contract.type === 'MONTHLY_MANUAL' ? contract.period : contract.numberOfMonths;
    const monthlyAmt = contract.type === 'MONTHLY_MANUAL' ? contract.plannedMonthlyPayment : contract.monthlyInterest;
    for (let i = 0; i < months; i++) {
      const date = new Date(start);
      date.setMonth(date.getMonth() + i + 1);
      const dateStr = date.toISOString().split('T')[0];
      const collected = i < Math.floor(contract.totalCollected / monthlyAmt) ? monthlyAmt : 0;
      const status = collected >= monthlyAmt ? 'PAID' : date < new Date() ? 'OVERDUE' : 'PENDING';
      entries.push({
        id: `s-${contract.id}-${i}`,
        contractId: contract.id,
        dueDate: dateStr,
        amount: monthlyAmt,
        collected,
        remaining: monthlyAmt - collected,
        status: status as 'PAID' | 'PENDING' | 'OVERDUE',
        isOverdue: status === 'OVERDUE',
      });
    }
  } else if (contract.type === 'DIRECT2') {
    entries.push({
      id: `s-${contract.id}-0`,
      contractId: contract.id,
      dueDate: contract.dueDate,
      amount: contract.totalAmountToReceive,
      collected: contract.totalCollected,
      remaining: contract.totalAmountToReceive - contract.totalCollected,
      status: contract.totalCollected >= contract.totalAmountToReceive ? 'PAID' : new Date(contract.dueDate) < new Date() ? 'OVERDUE' : 'PENDING',
      isOverdue: new Date(contract.dueDate) < new Date() && contract.totalCollected < contract.totalAmountToReceive,
    });
  } else if (contract.type === 'THIRD_PARTY') {
    if (contract.recoveryMode === 'NONE') return entries;
    if (contract.recoveryMode === 'ONE_TIME') {
      entries.push({
        id: `s-${contract.id}-0`,
        contractId: contract.id,
        dueDate: contract.endDate,
        amount: contract.actualAmountGiven,
        collected: contract.totalCollected,
        remaining: contract.outstanding,
        status: 'PENDING',
        isOverdue: false,
      });
    } else {
      const months = Math.max(1, Math.ceil(contract.outstanding / Math.max(1, contract.monthlyAmount)));
      for (let i = 0; i < months; i++) {
        const date = new Date(start);
        date.setMonth(date.getMonth() + i + 1);
        const dateStr = date.toISOString().split('T')[0];
        entries.push({
          id: `s-${contract.id}-${i}`,
          contractId: contract.id,
          dueDate: dateStr,
          amount: contract.monthlyAmount,
          collected: 0,
          remaining: contract.monthlyAmount,
          status: date < new Date() ? 'OVERDUE' : 'PENDING',
          isOverdue: date < new Date(),
        });
      }
    }
  }

  return entries;
}

export function generateDueItems(): DueItem[] {
  const items: DueItem[] = [];
  for (const c of mockContracts) {
    if (c.status !== 'ACTIVE' && c.status !== 'OVERDUE') continue;
    if (!c.nextDueDate || c.nextDueAmount === 0) continue;
    const dueDate = new Date(c.nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const status = c.overdue > 0 && dueDate < today ? 'OVERDUE' : dueDate <= today ? 'PENDING' : 'PENDING';
    items.push({
      id: `due-${c.id}`,
      personName: c.personName,
      contractId: c.id,
      contractType: c.type,
      dueDate: c.nextDueDate,
      dueAmount: c.nextDueAmount,
      paid: 0,
      remaining: c.nextDueAmount,
      status: status as 'PENDING' | 'OVERDUE',
    });
  }
  return items;
}
