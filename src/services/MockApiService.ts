import type { ApiService } from '@/api/ApiService';
import type {
  Account,
  AccountDetail,
  AccountTransaction,
  Adjustment,
  AdminDashboard,
  AuditEntry,
  AuditLog,
  Contract,
  ContractSummary,
  CreateLDDInput,
  CreateMonthlyInput,
  CreatePersonInput,
  CreateThirdPartyInput,
  CreateTransactionInput,
  TransactionStatus,
  Dashboard,
  DateProjection,
  DueItem,
  DueSummary,
  Financer,
  Ledger,
  MonthlyReport,
  Note,
  PaymentRecord,
  Person,
  PersonDetail,
  RecordPaymentInput,
  ScheduleEntry,
  Subscription,
  User,
} from '@/types';
import {
  mockAccounts,
  mockAdjustments,
  mockAdminDashboard,
  mockAdminFinancers,
  mockAuditEntries,
  mockAuditLogs,
  mockContracts,
  mockDashboard,
  mockDateProjection,
  mockMonthlyReport,
  mockNotes,
  mockPayments,
  mockPeople,
  mockSubscription,
  mockTransactions,
  mockUsers,
  generateDueItems,
  generateScheduleForContract,
} from '@/mock/data';
import { generateId } from '@/utils/format';

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockApiService implements ApiService {
  private payments: PaymentRecord[] = [...mockPayments];
  private notes: Note[] = [...mockNotes];
  private people: Person[] = [...mockPeople];
  private contracts: Contract[] = [...mockContracts];
  private transactions: AccountTransaction[] = [...mockTransactions];
  private adjustments: Adjustment[] = [...mockAdjustments];

  // --- People ---
  async getPeople(filters?: {
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<{ items: Person[]; total: number }> {
    let items = [...this.people];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q));
    }
    if (filters?.status) {
      items = items.filter((p) => p.status === filters.status);
    }
    if (filters?.sortBy) {
      const dir = filters.sortDir === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[filters.sortBy!];
        const bv = (b as unknown as Record<string, unknown>)[filters.sortBy!];
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }
    const total = items.length;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return delay({ items: items.slice(start, start + pageSize), total });
  }

  async getPerson(id: string): Promise<PersonDetail | null> {
    const person = this.people.find((p) => p.id === id);
    if (!person) return delay(null);
    const activeContracts = this.contracts
      .filter((c) => c.personId === id && c.status === 'ACTIVE')
      .map((c) => ({ id: c.id, personName: c.personName, type: c.type, outstanding: c.outstanding, overdue: c.overdue, status: c.status, nextDueDate: c.nextDueDate }));
    const closedContracts = this.contracts
      .filter((c) => c.personId === id && c.status === 'CLOSED')
      .map((c) => ({ id: c.id, personName: c.personName, type: c.type, outstanding: 0, overdue: 0, status: c.status as 'CLOSED', nextDueDate: null }));
    const recentPayments = this.payments.filter((p) => p.contractId && this.contracts.find((c) => c.id === p.contractId)?.personId === id).slice(0, 5);
    const personNotes = this.notes.filter((n) => n.entityType === 'PERSON' && n.entityId === id);
    return delay({
      ...person,
      contacts: [{ label: 'Phone', value: person.phone }],
      documents: [],
      notes: personNotes,
      activeContracts,
      closedContracts,
      recentPayments,
      recentActivity: mockAuditEntries.filter((a) => a.entityId === id).slice(0, 5),
    });
  }

  async createPerson(data: CreatePersonInput): Promise<Person> {
    const person: Person = {
      id: generateId('p-'),
      financerId: 'fin-001',
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      status: 'ACTIVE',
      activeContracts: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.people.push(person);
    return delay(person);
  }

  // --- Accounts ---
  async getAccounts(): Promise<Account[]> {
    return delay([...mockAccounts]);
  }

  async createAccount(data: {
    name: string;
    type: Account['type'];
    balance: number;
    bankName?: string;
    accountNumber?: string;
    creditLimit?: number;
    used?: number;
    dueDate?: string;
  }): Promise<Account> {
    const account: Account = {
      id: generateId('account-'),
      financerId: 'fin-001',
      name: data.name.trim(),
      type: data.type,
      balance: data.balance,
      bankName: data.bankName,
      accountNumber: data.type === 'BANK' ? data.accountNumber : undefined,
      creditLimit: data.type === 'CARD' ? data.creditLimit : undefined,
      used: data.type === 'CARD' ? (data.used ?? 0) : undefined,
      available: data.type === 'CARD' ? (data.creditLimit ?? 0) - (data.used ?? 0) : undefined,
      dueDate: data.type === 'CARD' ? data.dueDate : undefined,
      createdAt: new Date().toISOString(),
    };
    mockAccounts.push(account);
    return delay(account);
  }

  async getAccount(id: string): Promise<AccountDetail | null> {
    const account = mockAccounts.find((a) => a.id === id);
    if (!account) return delay(null);
    const transactions = this.transactions.filter((t) => t.accountId === id);
    const relatedContracts: ContractSummary[] = this.contracts
      .filter((c) => c.personId && transactions.some((t) => t.contractId === c.id))
      .map((c) => ({ id: c.id, personName: c.personName, type: c.type, outstanding: c.outstanding, overdue: c.overdue, status: c.status, nextDueDate: c.nextDueDate }));
    return delay({ ...account, transactions, relatedContracts });
  }

  // --- Contracts ---
  async getContracts(filters?: { personId?: string; status?: string }): Promise<Contract[]> {
    let items = [...this.contracts];
    if (filters?.personId) items = items.filter((c) => c.personId === filters.personId);
    if (filters?.status) items = items.filter((c) => c.status === filters.status);
    return delay(items);
  }

  async getContract(id: string): Promise<Contract | null> {
    const c = this.contracts.find((x) => x.id === id);
    return delay(c ?? null);
  }

  async createLDD(data: CreateLDDInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }> {
    const upfrontDeduction = data.totalRecovery - data.actualAmountGiven;
    const contract = {
      id: generateId('c-'),
      financerId: 'fin-001',
      personId: generateId('p-'),
      personName: data.personName,
      type: 'LDD' as const,
      status: 'ACTIVE' as const,
      actualAmountGiven: data.actualAmountGiven,
      totalExpectedRecovery: data.totalRecovery,
      totalCollected: 0,
      outstanding: data.totalRecovery,
      overdue: 0,
      nextDueDate: data.startDate,
      nextDueAmount: data.dailyCollection,
      startDate: data.startDate,
      endDate: new Date(new Date(data.startDate).getTime() + data.days * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      dailyCollection: data.dailyCollection,
      days: data.days,
      upfrontDeduction,
      dateRule: data.dateRule,
    };
    this.contracts.push(contract);
    const schedule = generateScheduleForContract(contract);
    return delay({ contract, schedule }, 400);
  }

  async createMonthly(data: CreateMonthlyInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }> {
    const baseContract = {
      id: generateId('c-'),
      financerId: 'fin-001',
      personId: generateId('p-'),
      personName: data.personName,
      status: 'ACTIVE' as const,
      totalCollected: 0,
      overdue: 0,
      createdAt: new Date().toISOString(),
    };

    let contract: Contract;
    if (data.mode === 'MANUAL') {
      contract = {
        ...baseContract,
        type: 'MONTHLY_MANUAL',
        actualAmountGiven: data.amountGiven,
        totalExpectedRecovery: data.plannedMonthlyPayment * data.period,
        outstanding: data.plannedMonthlyPayment * data.period,
        nextDueDate: data.firstDueDate ?? data.startDate,
        nextDueAmount: data.plannedMonthlyPayment,
        startDate: data.startDate,
        endDate: new Date(new Date(data.startDate).getTime() + data.period * 30 * 86400000).toISOString().split('T')[0],
        monthlyInterest: data.monthlyInterest,
        period: data.period,
        plannedMonthlyPayment: data.plannedMonthlyPayment,
        dateRule: data.dateRule,
        firstDueDate: data.firstDueDate ?? data.startDate,
      };
    } else if (data.mode === 'DIRECT') {
      contract = {
        ...baseContract,
        type: 'MONTHLY_DIRECT',
        actualAmountGiven: data.amountGiven,
        totalExpectedRecovery: data.amountGiven + data.monthlyInterest * data.numberOfMonths,
        outstanding: data.amountGiven + data.monthlyInterest * data.numberOfMonths,
        nextDueDate: data.interestCreditDate ?? data.startDate,
        nextDueAmount: data.monthlyInterest,
        startDate: data.startDate,
        endDate: data.finalPrincipalDate ?? data.startDate,
        monthlyInterest: data.monthlyInterest,
        numberOfMonths: data.numberOfMonths,
        interestCreditDate: data.interestCreditDate ?? data.startDate,
        finalPrincipalDate: data.finalPrincipalDate ?? data.startDate,
      };
    } else {
      contract = {
        ...baseContract,
        type: 'DIRECT2',
        actualAmountGiven: data.amountGiven,
        totalExpectedRecovery: data.totalAmountToReceive ?? 0,
        outstanding: data.totalAmountToReceive ?? 0,
        nextDueDate: data.dueDate ?? data.startDate,
        nextDueAmount: data.totalAmountToReceive ?? 0,
        startDate: data.startDate,
        endDate: data.dueDate ?? data.startDate,
        totalAmountToReceive: data.totalAmountToReceive ?? 0,
        dueDate: data.dueDate ?? data.startDate,
        profit: (data.totalAmountToReceive ?? 0) - data.amountGiven,
      };
    }

    this.contracts.push(contract);
    const schedule = generateScheduleForContract(contract);
    return delay({ contract, schedule }, 400);
  }

  async createThirdParty(data: CreateThirdPartyInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }> {
    const contract = {
      id: generateId('c-'),
      financerId: 'fin-001',
      personId: generateId('p-'),
      personName: data.personName,
      type: 'THIRD_PARTY' as const,
      status: 'ACTIVE' as const,
      actualAmountGiven: data.amount,
      totalExpectedRecovery: data.recoveryMode === 'NONE' ? 0 : data.amount,
      totalCollected: 0,
      outstanding: data.recoveryMode === 'NONE' ? 0 : data.amount,
      overdue: 0,
      nextDueDate: data.recoveryMode === 'NONE' ? null : data.dueDate ?? data.startDate,
      nextDueAmount: data.monthlyAmount ?? 0,
      startDate: data.startDate,
      endDate: data.dueDate ?? data.startDate,
      createdAt: new Date().toISOString(),
      thirdPartyType: data.type,
      recoveryMode: data.recoveryMode,
      monthlyAmount: data.monthlyAmount ?? 0,
      purpose: data.notes,
    };
    this.contracts.push(contract);
    const schedule = generateScheduleForContract(contract);
    return delay({ contract, schedule }, 400);
  }

  // --- Schedule & Ledger ---
  async getSchedule(contractId: string): Promise<ScheduleEntry[]> {
    const contract = this.contracts.find((c) => c.id === contractId);
    if (!contract) return delay([]);
    return delay(generateScheduleForContract(contract));
  }

  async getLedger(contractId: string): Promise<Ledger | null> {
    const contract = this.contracts.find((c) => c.id === contractId);
    if (!contract) return delay(null);
    const schedule = generateScheduleForContract(contract);
    const payments = this.payments.filter((p) => p.contractId === contractId);
    const adjustments = this.adjustments.filter((a) => a.contractId === contractId);
    const notes = this.notes.filter((n) => n.entityType === 'CONTRACT' && n.entityId === contractId);
    const activityHistory = mockAuditEntries.filter((a) => a.entityId === contractId);
    return delay({ contract, schedule, payments, adjustments, notes, activityHistory });
  }

  // --- Due ---
  async getDue(filter?: 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'ALL'): Promise<{ items: DueItem[]; summary: DueSummary }> {
    let items = generateDueItems();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'TODAY') {
      items = items.filter((i) => new Date(i.dueDate) <= today && i.status !== 'OVERDUE' || i.status === 'OVERDUE' && new Date(i.dueDate).toDateString() === today.toDateString());
    } else if (filter === 'UPCOMING') {
      items = items.filter((i) => new Date(i.dueDate) > today);
    } else if (filter === 'OVERDUE') {
      items = items.filter((i) => i.status === 'OVERDUE');
    }

    const totalDue = items.reduce((s, i) => s + i.dueAmount, 0);
    const collected = items.reduce((s, i) => s + i.paid, 0);
    const pending = totalDue - collected;
    const overdue = items.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.remaining, 0);

    return delay({ items, summary: { totalDue, collected, pending, overdue } });
  }

  async recordPayment(data: RecordPaymentInput): Promise<{ success: boolean; paymentId: string }> {
    const account = mockAccounts.find((a) => a.id === data.accountId);
    const payment: PaymentRecord = {
      id: generateId('pay-'),
      contractId: data.contractId,
      personName: this.contracts.find((c) => c.id === data.contractId)?.personName ?? '',
      date: data.date,
      amount: data.amount,
      method: data.method,
      accountName: account?.name ?? '',
      reference: data.reference,
      notes: data.notes,
      collectedBy: 'Rajesh Patel',
    };
    this.payments.push(payment);
    return delay({ success: true, paymentId: payment.id }, 500);
  }

  // --- Contract Actions ---
  async createAdjustment(contractId: string, amount: number, reason: string, type: 'CREDIT' | 'DEBIT'): Promise<{ success: boolean }> {
    this.adjustments.push({ id: generateId('adj-'), contractId, date: new Date().toISOString().split('T')[0], amount, reason, type, createdBy: 'Rajesh Patel' });
    return delay({ success: true }, 300);
  }

  async createAddon(contractId: string, amount: number, notes: string): Promise<{ success: boolean }> {
    return delay({ success: true }, 300);
  }

  async renewContract(contractId: string): Promise<{ success: boolean }> {
    return delay({ success: true }, 300);
  }

  async closeContract(contractId: string): Promise<{ success: boolean }> {
    const c = this.contracts.find((x) => x.id === contractId);
    if (c) c.status = 'CLOSED';
    return delay({ success: true }, 300);
  }

  // --- Transactions ---
  async getTransactions(filters?: {
    date?: string;
    accountId?: string;
    type?: string;
    direction?: 'IN' | 'OUT' | 'TRANSFER';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: AccountTransaction[]; total: number }> {
    let items = [...this.transactions];
    if (filters?.date) items = items.filter((t) => t.date === filters.date || (t.status === 'PENDING' && t.date < filters.date!));
    if (filters?.accountId) items = items.filter((t) => t.accountId === filters.accountId);
    if (filters?.type) items = items.filter((t) => t.type === filters.type);
    if (filters?.direction) items = items.filter((t) => t.direction === filters.direction);
    const total = items.length;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({ items: items.slice(start, start + pageSize), total });
  }

  async createTransaction(data: CreateTransactionInput): Promise<{ success: boolean }> {
    const account = mockAccounts.find((a) => a.id === data.accountId);
    this.transactions.unshift({
      id: generateId('t-'),
      ...data,
      status: data.status ?? 'DONE',
      originalDueDate: data.date,
      accountName: account?.name ?? '',
    });
    return delay({ success: true }, 300);
  }

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<{ success: boolean }> {
    const transaction = this.transactions.find((item) => item.id === id);
    if (transaction) transaction.status = status;
    return delay({ success: true }, 300);
  }

  // --- Dashboard ---
  async getDashboard(): Promise<Dashboard> {
    return delay(mockDashboard);
  }

  // --- Date Planner ---
  async getDatePlanner(targetDate: string): Promise<DateProjection> {
    return delay({ ...mockDateProjection, targetDate });
  }

  // --- Reports ---
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    return delay({ ...mockMonthlyReport, year, month });
  }

  // --- Subscription ---
  async getSubscription(): Promise<Subscription> {
    return delay(mockSubscription);
  }

  // --- Notes ---
  async addNote(entityType: 'PERSON' | 'CONTRACT', entityId: string, content: string): Promise<Note> {
    const note: Note = {
      id: generateId('n-'),
      entityType,
      entityId,
      content,
      createdBy: 'Rajesh Patel',
      createdAt: new Date().toISOString(),
    };
    this.notes.push(note);
    return delay(note, 200);
  }

  async getNotes(entityType: 'PERSON' | 'CONTRACT', entityId: string): Promise<Note[]> {
    return delay(this.notes.filter((n) => n.entityType === entityType && n.entityId === entityId));
  }

  // --- Admin ---
  async getAdminDashboard(): Promise<AdminDashboard> {
    return delay(mockAdminDashboard);
  }

  async getAdminFinancers(): Promise<Financer[]> {
    return delay(mockAdminFinancers);
  }

  async getAdminFinancer(id: string): Promise<Financer | null> {
    return delay(mockAdminFinancers.find((f) => f.id === id) ?? null);
  }

  async getAdminUsers(): Promise<User[]> {
    return delay(mockUsers);
  }

  async getAdminAuditLogs(): Promise<AuditLog[]> {
    return delay(mockAuditLogs);
  }
}
