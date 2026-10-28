import type {
  AdminDashboard,
  AuditLog,
  Contract,
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
  Person,
  PersonDetail,
  Account,
  AccountDetail,
  AccountTransaction,
  RecordPaymentInput,
  ScheduleEntry,
  Subscription,
  User,
} from '@/types';

/**
 * ApiService — the single abstraction layer between UI and data source.
 *
 * During frontend-only development, this is implemented by MockApiService.
 * Later, FastApiService will implement the same interface against the FastAPI backend.
 * UI components import from '@/services' and never know which implementation is active.
 */
export interface ApiService {
  // --- Auth ---
  // (auth is handled by AuthService, not here)

  // --- People ---
  getPeople(filters?: {
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<{ items: Person[]; total: number }>;
  getPerson(id: string): Promise<PersonDetail | null>;
  createPerson(data: CreatePersonInput): Promise<Person>;

  // --- Accounts ---
  getAccounts(): Promise<Account[]>;
  createAccount(data: {
    name: string;
    type: Account['type'];
    balance: number;
    bankName?: string;
    accountNumber?: string;
    creditLimit?: number;
    used?: number;
    dueDate?: string;
  }): Promise<Account>;
  getAccount(id: string): Promise<AccountDetail | null>;

  // --- Contracts ---
  getContracts(filters?: { personId?: string; status?: string }): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | null>;
  createLDD(data: CreateLDDInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }>;
  createMonthly(data: CreateMonthlyInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }>;
  createThirdParty(data: CreateThirdPartyInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }>;

  // --- Schedule & Ledger ---
  getSchedule(contractId: string): Promise<ScheduleEntry[]>;
  getLedger(contractId: string): Promise<Ledger | null>;

  // --- Due ---
  getDue(filter?: 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'ALL'): Promise<{ items: DueItem[]; summary: DueSummary }>;
  recordPayment(data: RecordPaymentInput): Promise<{ success: boolean; paymentId: string }>;

  // --- Contract Actions ---
  createAdjustment(contractId: string, amount: number, reason: string, type: 'CREDIT' | 'DEBIT'): Promise<{ success: boolean }>;
  createAddon(contractId: string, amount: number, notes: string): Promise<{ success: boolean }>;
  renewContract(contractId: string): Promise<{ success: boolean }>;
  closeContract(contractId: string): Promise<{ success: boolean }>;

  // --- Transactions ---
  getTransactions(filters?: {
    date?: string;
    accountId?: string;
    type?: string;
    direction?: 'IN' | 'OUT' | 'TRANSFER';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: AccountTransaction[]; total: number }>;
  createTransaction(data: CreateTransactionInput): Promise<{ success: boolean }>;
  updateTransactionStatus(id: string, status: TransactionStatus): Promise<{ success: boolean }>; 

  // --- Dashboard ---
  getDashboard(): Promise<Dashboard>;

  // --- Date Planner ---
  getDatePlanner(targetDate: string): Promise<DateProjection>;

  // --- Reports ---
  getMonthlyReport(year: number, month: number): Promise<MonthlyReport>;

  // --- Subscription ---
  getSubscription(): Promise<Subscription>;

  // --- Notes ---
  addNote(entityType: 'PERSON' | 'CONTRACT', entityId: string, content: string): Promise<Note>;
  getNotes(entityType: 'PERSON' | 'CONTRACT', entityId: string): Promise<Note[]>;

  // --- Admin ---
  getAdminDashboard(): Promise<AdminDashboard>;
  getAdminFinancers(): Promise<Financer[]>;
  getAdminFinancer(id: string): Promise<Financer | null>;
  getAdminUsers(): Promise<User[]>;
  getAdminAuditLogs(): Promise<AuditLog[]>;
}
