import { supabase } from '@/lib/supabase';
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
import type { ContractType } from '@/types';

/**
 * Maps a database contract row to the frontend Contract union type.
 */
function mapContract(row: Record<string, unknown>): Contract {
  const base = {
    id: row.id as string,
    financerId: (row.financer_id ?? row.financerId) as string,
    personId: (row.person_id ?? row.personId) as string ?? '',
    personName: row.person_name as string,
    type: row.type as ContractType,
    status: row.status as Contract['status'],
    actualAmountGiven: Number(row.actual_amount_given ?? row.actualAmountGiven ?? 0),
    totalExpectedRecovery: Number(row.total_expected_recovery ?? row.totalExpectedRecovery ?? 0),
    totalCollected: Number(row.total_collected ?? row.totalCollected ?? 0),
    outstanding: Number(row.outstanding ?? 0),
    overdue: Number(row.overdue ?? 0),
    nextDueDate: (row.next_due_date ?? row.nextDueDate) as string | null,
    nextDueAmount: Number(row.next_due_amount ?? row.nextDueAmount ?? 0),
    startDate: row.start_date as string,
    endDate: (row.end_date ?? row.endDate) as string,
    createdAt: (row.created_at ?? row.createdAt) as string,
  };

  const details = (row.details ?? {}) as Record<string, unknown>;

  switch (row.type) {
    case 'LDD':
      return {
        ...base,
        type: 'LDD',
        dailyCollection: Number(details.dailyCollection ?? 0),
        days: Number(details.days ?? 0),
        upfrontDeduction: Number(details.upfrontDeduction ?? 0),
        dateRule: (details.dateRule ?? 'AUTO') as 'AUTO' | 'FIXED' | 'MANUAL',
      };
    case 'MONTHLY_MANUAL':
      return {
        ...base,
        type: 'MONTHLY_MANUAL',
        monthlyInterest: Number(details.monthlyInterest ?? 0),
        period: Number(details.period ?? 0),
        plannedMonthlyPayment: Number(details.plannedMonthlyPayment ?? 0),
        dateRule: (details.dateRule ?? 'AUTO') as 'AUTO' | 'FIXED' | 'MANUAL',
        firstDueDate: (details.firstDueDate ?? base.startDate) as string,
      };
    case 'MONTHLY_DIRECT':
      return {
        ...base,
        type: 'MONTHLY_DIRECT',
        monthlyInterest: Number(details.monthlyInterest ?? 0),
        numberOfMonths: Number(details.numberOfMonths ?? 0),
        interestCreditDate: (details.interestCreditDate ?? base.startDate) as string,
        finalPrincipalDate: (details.finalPrincipalDate ?? base.endDate) as string,
      };
    case 'DIRECT2':
      return {
        ...base,
        type: 'DIRECT2',
        totalAmountToReceive: Number(details.totalAmountToReceive ?? 0),
        dueDate: (details.dueDate ?? base.endDate) as string,
        profit: Number(details.profit ?? 0),
      };
    case 'THIRD_PARTY':
      return {
        ...base,
        type: 'THIRD_PARTY',
        thirdPartyType: (details.thirdPartyType ?? 'OTHER') as 'LOAN_GIVEN' | 'LOAN_TAKEN' | 'EMI' | 'FAMILY_PERSONAL' | 'OTHER',
        recoveryMode: (details.recoveryMode ?? 'NONE') as 'NONE' | 'ONE_TIME' | 'MONTHLY' | 'EMI' | 'MANUAL',
        monthlyAmount: Number(details.monthlyAmount ?? 0),
        purpose: details.purpose as string | undefined,
      };
    default:
      return { ...base, type: 'LDD', dailyCollection: 0, days: 0, upfrontDeduction: 0, dateRule: 'AUTO' };
  }
}

function mapScheduleEntry(row: Record<string, unknown>): ScheduleEntry {
  return {
    id: row.id as string,
    contractId: (row.contract_id ?? row.contractId) as string,
    dueDate: row.due_date as string,
    amount: Number(row.amount),
    collected: Number(row.collected ?? 0),
    remaining: Number(row.remaining ?? 0),
    status: row.status as ScheduleEntry['status'],
    isOverdue: row.status === 'OVERDUE',
  };
}

function mapPerson(row: Record<string, unknown>): Person {
  return {
    id: row.id as string,
    financerId: (row.financer_id ?? row.financerId) as string,
    name: row.name as string,
    phone: row.phone as string,
    address: (row.address ?? undefined) as string | undefined,
    notes: (row.notes ?? undefined) as string | undefined,
    status: row.status as Person['status'],
    activeContracts: Number(row.active_contracts ?? 0),
    totalOutstanding: Number(row.total_outstanding ?? 0),
    totalOverdue: Number(row.total_overdue ?? 0),
    lastActivity: (row.last_activity ?? row.created_at) as string,
    createdAt: row.created_at as string,
  };
}

function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    financerId: (row.financer_id ?? row.financerId) as string,
    name: row.name as string,
    type: row.type as Account['type'],
    balance: Number(row.balance ?? 0),
    creditLimit: row.credit_limit != null ? Number(row.credit_limit) : undefined,
    used: row.used != null ? Number(row.used) : undefined,
    available: row.credit_limit != null && row.used != null ? Number(row.credit_limit) - Number(row.used) : undefined,
    dueDate: (row.due_date ?? undefined) as string | undefined,
    bankName: (row.bank_name ?? undefined) as string | undefined,
    accountNumber: (row.account_number ?? undefined) as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapTransaction(row: Record<string, unknown>): AccountTransaction {
  return {
    id: row.id as string,
    date: row.date as string,
    accountId: (row.account_id ?? row.accountId) as string,
    accountName: row.account_name as string,
    direction: row.direction as AccountTransaction['direction'],
    type: row.type as AccountTransaction['type'],
    amount: Number(row.amount),
    description: row.description as string,
    contractId: (row.contract_id ?? row.contractId ?? undefined) as string | undefined,
    personName: (row.person_name ?? undefined) as string | undefined,
    personId: (row.person_id ?? undefined) as string | undefined,
    status: (row.status ?? 'DONE') as AccountTransaction['status'],
    originalDueDate: (row.original_due_date ?? row.date) as string,
    transferGroupId: (row.transfer_group_id ?? undefined) as string | undefined,
  };
}

function mapPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: row.id as string,
    contractId: (row.contract_id ?? row.contractId) as string,
    personName: row.person_name as string,
    date: row.date as string,
    amount: Number(row.amount),
    method: row.method as PaymentRecord['method'],
    accountName: (row.account_name ?? '') as string,
    reference: (row.reference ?? undefined) as string | undefined,
    notes: (row.notes ?? undefined) as string | undefined,
    collectedBy: row.collected_by as string,
  };
}

function mapNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    entityType: row.entity_type as Note['entityType'],
    entityId: row.entity_id as string,
    content: row.content as string,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  };
}

function mapAdjustment(row: Record<string, unknown>): Adjustment {
  return {
    id: row.id as string,
    contractId: (row.contract_id ?? row.contractId) as string,
    date: row.date as string,
    amount: Number(row.amount),
    reason: row.reason as string,
    type: row.type as Adjustment['type'],
    createdBy: row.created_by as string,
  };
}

export class SupabaseApiService implements ApiService {
  // --- People ---
  async getPeople(filters?: {
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<{ items: Person[]; total: number }> {
    let query = supabase.from('people').select('*', { count: 'exact' });
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.sortBy) {
      const col = filters.sortBy === 'name' ? 'name' : filters.sortBy === 'createdAt' ? 'created_at' : filters.sortBy;
      query = query.order(col, { ascending: filters.sortDir !== 'desc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 10;
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { items: (data ?? []).map(mapPerson), total: count ?? 0 };
  }

  async getPerson(id: string): Promise<PersonDetail | null> {
    const { data: person, error } = await supabase.from('people').select('*').eq('id', id).maybeSingle();
    if (error || !person) return null;

    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .eq('person_id', id)
      .order('created_at', { ascending: false });

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .in('contract_id', (contracts ?? []).map((c) => c.id))
      .order('date', { ascending: false })
      .limit(5);

    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('entity_type', 'PERSON')
      .eq('entity_id', id)
      .order('created_at', { ascending: false });

    const toSummary = (c: Record<string, unknown>): ContractSummary => ({
      id: c.id as string,
      personName: c.person_name as string,
      type: c.type as ContractType,
      outstanding: Number(c.outstanding ?? 0),
      overdue: Number(c.overdue ?? 0),
      status: c.status as ContractSummary['status'],
      nextDueDate: (c.next_due_date ?? null) as string | null,
    });

    return {
      ...mapPerson(person),
      contacts: [{ label: 'Phone', value: person.phone }],
      documents: [],
      notes: (notes ?? []).map(mapNote),
      activeContracts: (contracts ?? []).filter((c) => c.status === 'ACTIVE').map(toSummary),
      closedContracts: (contracts ?? []).filter((c) => c.status === 'CLOSED').map(toSummary),
      recentPayments: (payments ?? []).map(mapPayment),
      recentActivity: [],
    };
  }

  async createPerson(data: CreatePersonInput): Promise<Person> {
    const { data: row, error } = await supabase
      .from('people')
      .insert({ name: data.name, phone: data.phone, address: data.address, notes: data.notes })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapPerson(row);
  }

  // --- Accounts ---
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAccount);
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
    const name = data.name.trim();
    if (!name) throw new Error('Account name is required.');
    if (!Number.isFinite(data.balance) || data.balance < 0) {
      throw new Error('Opening balance must be zero or greater.');
    }
    if (!['CASH', 'BANK', 'CARD', 'OTHER'].includes(data.type)) {
      throw new Error('Invalid account type.');
    }
    if (data.type === 'CARD') {
      if (!Number.isFinite(data.creditLimit) || (data.creditLimit ?? -1) < 0) {
        throw new Error('A valid credit limit is required for a credit card.');
      }
      if (!Number.isFinite(data.used ?? 0) || (data.used ?? 0) < 0) {
        throw new Error('The amount used must be zero or greater.');
      }
    }

    // The database default assigns financer_id using the authenticated user.
    // Keep this insert scoped to account creation; no due/payment data is changed.
    const { data: row, error } = await supabase
      .from('accounts')
      .insert({
        name,
        type: data.type,
        balance: data.balance,
        bank_name: data.bankName?.trim() || null,
        account_number: data.type === 'BANK' ? (data.accountNumber?.trim() || null) : null,
        credit_limit: data.type === 'CARD' ? data.creditLimit : null,
        used: data.type === 'CARD' ? (data.used ?? 0) : null,
        due_date: data.type === 'CARD' ? (data.dueDate || null) : null,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Could not create account: ${error.message}`);
    }
    return mapAccount(row);
  }

  async getAccount(id: string): Promise<AccountDetail | null> {
    const { data: account, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle();
    if (error || !account) return null;

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', id)
      .order('date', { ascending: false });

    const contractIds = [...new Set((transactions ?? []).map((t) => t.contract_id).filter(Boolean))];
    const { data: contracts } = await supabase.from('contracts').select('*').in('id', contractIds);

    const toSummary = (c: Record<string, unknown>): ContractSummary => ({
      id: c.id as string,
      personName: c.person_name as string,
      type: c.type as ContractType,
      outstanding: Number(c.outstanding ?? 0),
      overdue: Number(c.overdue ?? 0),
      status: c.status as ContractSummary['status'],
      nextDueDate: (c.next_due_date ?? null) as string | null,
    });

    return {
      ...mapAccount(account),
      transactions: (transactions ?? []).map(mapTransaction),
      relatedContracts: (contracts ?? []).map(toSummary),
    };
  }

  // --- Contracts ---
  async getContracts(filters?: { personId?: string; status?: string }): Promise<Contract[]> {
    let query = supabase.from('contracts').select('*').order('created_at', { ascending: false });
    if (filters?.personId) query = query.eq('person_id', filters.personId);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapContract);
  }

  async getContract(id: string): Promise<Contract | null> {
    const { data, error } = await supabase.from('contracts').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapContract(data);
  }

  async createLDD(data: CreateLDDInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }> {
    const upfrontDeduction = data.totalRecovery - data.actualAmountGiven;
    const endDate = new Date(new Date(data.startDate).getTime() + data.days * 86400000)
      .toISOString().split('T')[0];

    // Find or create person
    const personId = await this.findOrCreatePerson(data.personName, data.contact);

    const { data: row, error } = await supabase.from('contracts').insert({
      person_id: personId,
      person_name: data.personName,
      type: 'LDD',
      status: 'ACTIVE',
      actual_amount_given: data.actualAmountGiven,
      total_expected_recovery: data.totalRecovery,
      outstanding: data.totalRecovery,
      next_due_date: data.startDate,
      next_due_amount: data.dailyCollection,
      start_date: data.startDate,
      end_date: endDate,
      details: {
        dailyCollection: data.dailyCollection,
        days: data.days,
        upfrontDeduction,
        dateRule: data.dateRule,
      },
    }).select('*').single();
    if (error) throw new Error(error.message);

    const contract = mapContract(row);
    const schedule = await this.generateSchedule(contract);
    return { contract, schedule };
  }

  async createMonthly(data: CreateMonthlyInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }> {
    const personId = await this.findOrCreatePerson(data.personName, data.contact);
    const endDate = new Date(new Date(data.startDate).getTime() + data.period * 30 * 86400000)
      .toISOString().split('T')[0];

    let insertRow: Record<string, unknown>;
    let contractType: ContractType;

    if (data.mode === 'MANUAL') {
      contractType = 'MONTHLY_MANUAL';
      insertRow = {
        person_id: personId,
        person_name: data.personName,
        type: 'MONTHLY_MANUAL',
        actual_amount_given: data.amountGiven,
        total_expected_recovery: data.plannedMonthlyPayment * data.period,
        outstanding: data.plannedMonthlyPayment * data.period,
        next_due_date: data.firstDueDate ?? data.startDate,
        next_due_amount: data.plannedMonthlyPayment,
        start_date: data.startDate,
        end_date: endDate,
        details: {
          monthlyInterest: data.monthlyInterest,
          period: data.period,
          plannedMonthlyPayment: data.plannedMonthlyPayment,
          dateRule: data.dateRule,
          firstDueDate: data.firstDueDate ?? data.startDate,
        },
      };
    } else if (data.mode === 'DIRECT') {
      contractType = 'MONTHLY_DIRECT';
      insertRow = {
        person_id: personId,
        person_name: data.personName,
        type: 'MONTHLY_DIRECT',
        actual_amount_given: data.amountGiven,
        total_expected_recovery: data.amountGiven + data.monthlyInterest * data.numberOfMonths,
        outstanding: data.amountGiven + data.monthlyInterest * data.numberOfMonths,
        next_due_date: data.interestCreditDate ?? data.startDate,
        next_due_amount: data.monthlyInterest,
        start_date: data.startDate,
        end_date: data.finalPrincipalDate ?? data.startDate,
        details: {
          monthlyInterest: data.monthlyInterest,
          numberOfMonths: data.numberOfMonths,
          interestCreditDate: data.interestCreditDate ?? data.startDate,
          finalPrincipalDate: data.finalPrincipalDate ?? data.startDate,
        },
      };
    } else {
      contractType = 'DIRECT2';
      insertRow = {
        person_id: personId,
        person_name: data.personName,
        type: 'DIRECT2',
        actual_amount_given: data.amountGiven,
        total_expected_recovery: data.totalAmountToReceive ?? 0,
        outstanding: data.totalAmountToReceive ?? 0,
        next_due_date: data.dueDate ?? data.startDate,
        next_due_amount: data.totalAmountToReceive ?? 0,
        start_date: data.startDate,
        end_date: data.dueDate ?? data.startDate,
        details: {
          totalAmountToReceive: data.totalAmountToReceive ?? 0,
          dueDate: data.dueDate ?? data.startDate,
          profit: (data.totalAmountToReceive ?? 0) - data.amountGiven,
        },
      };
    }

    insertRow = { ...insertRow, status: 'ACTIVE' };

    const { data: row, error } = await supabase.from('contracts').insert(insertRow).select('*').single();
    if (error) throw new Error(error.message);

    const contract = mapContract(row);
    const schedule = await this.generateSchedule(contract);
    return { contract, schedule };
  }

  async createThirdParty(data: CreateThirdPartyInput): Promise<{ contract: Contract; schedule: ScheduleEntry[] }> {
    const personId = await this.findOrCreatePerson(data.personName, '');

    const { data: row, error } = await supabase.from('contracts').insert({
      person_id: personId,
      person_name: data.personName,
      type: 'THIRD_PARTY',
      status: 'ACTIVE',
      actual_amount_given: data.amount,
      total_expected_recovery: data.recoveryMode === 'NONE' ? 0 : data.amount,
      outstanding: data.recoveryMode === 'NONE' ? 0 : data.amount,
      next_due_date: data.recoveryMode === 'NONE' ? null : (data.dueDate ?? data.startDate),
      next_due_amount: data.monthlyAmount ?? 0,
      start_date: data.startDate,
      end_date: data.dueDate ?? data.startDate,
      details: {
        thirdPartyType: data.type,
        recoveryMode: data.recoveryMode,
        monthlyAmount: data.monthlyAmount ?? 0,
        purpose: data.notes,
      },
    }).select('*').single();
    if (error) throw new Error(error.message);

    const contract = mapContract(row);
    const schedule = await this.generateSchedule(contract);
    return { contract, schedule };
  }

  // --- Schedule & Ledger ---
  async getSchedule(contractId: string): Promise<ScheduleEntry[]> {
    const { data, error } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('contract_id', contractId)
      .order('due_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapScheduleEntry);
  }

  async getLedger(contractId: string): Promise<Ledger | null> {
    const contract = await this.getContract(contractId);
    if (!contract) return null;

    const [schedule, payments, adjustments, notes] = await Promise.all([
      this.getSchedule(contractId),
      supabase.from('payments').select('*').eq('contract_id', contractId).order('date', { ascending: false }),
      supabase.from('adjustments').select('*').eq('contract_id', contractId).order('date', { ascending: false }),
      supabase.from('notes').select('*').eq('entity_type', 'CONTRACT').eq('entity_id', contractId).order('created_at', { ascending: false }),
    ]);

    if (payments.error) throw new Error(payments.error.message);

    return {
      contract,
      schedule,
      payments: (payments.data ?? []).map(mapPayment),
      adjustments: (adjustments.data ?? []).map(mapAdjustment),
      notes: (notes.data ?? []).map(mapNote),
      activityHistory: [],
    };
  }

  // --- Due ---
  async getDue(filter?: 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'ALL'): Promise<{ items: DueItem[]; summary: DueSummary }> {
    let query = supabase.from('schedule_entries').select(`
      id, due_date, amount, collected, remaining, status,
      contracts!inner ( id, person_name, type )
    `).order('due_date', { ascending: true });

    const today = new Date().toISOString().split('T')[0];

    if (filter === 'TODAY') {
      query = query.lte('due_date', today).neq('status', 'PAID');
    } else if (filter === 'UPCOMING') {
      query = query.gt('due_date', today);
    } else if (filter === 'OVERDUE') {
      query = query.eq('status', 'OVERDUE');
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const items: DueItem[] = (data ?? []).map((row) => {
      const contract = (row.contracts as unknown as Record<string, unknown>) ?? {};
      return {
        id: row.id as string,
        personName: contract.person_name as string,
        contractId: contract.id as string,
        contractType: contract.type as ContractType,
        dueDate: row.due_date as string,
        dueAmount: Number(row.amount),
        paid: Number(row.collected ?? 0),
        remaining: Number(row.remaining ?? 0),
        status: row.status as DueItem['status'],
      };
    });

    const totalDue = items.reduce((s, i) => s + i.dueAmount, 0);
    const collected = items.reduce((s, i) => s + i.paid, 0);
    const pending = totalDue - collected;
    const overdue = items.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.remaining, 0);

    return { items, summary: { totalDue, collected, pending, overdue } };
  }


  async recordPayment(
    data: RecordPaymentInput
  ): Promise<{ success: boolean; paymentId: string }> {
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    if (!data.contractId || !data.scheduleEntryId) {
      throw new Error('A contract and due entry are required to record a collection.');
    }
    if (!data.accountId) {
      throw new Error('Select the account that received this payment.');
    }

    // This database RPC records the payment, updates the selected due entry,
    // recalculates contract totals, and inserts the matching account transaction
    // in one database transaction.
    const { data: paymentId, error } = await supabase.rpc(
      'record_payment_and_update_account',
      {
        p_contract_id: data.contractId,
        p_schedule_entry_id: data.scheduleEntryId,
        p_date: data.date,
        p_amount: data.amount,
        p_method: data.method,
        p_account_id: data.accountId,
        p_reference: data.reference ?? null,
        p_notes: data.notes ?? null,
      }
    );

    if (error) {
      throw new Error(`Unable to record payment: ${error.message}`);
    }
    if (!paymentId) {
      throw new Error('Payment was not recorded.');
    }

    return { success: true, paymentId: String(paymentId) };
  }

  // --- Contract Actions ---
  async createAdjustment(contractId: string, amount: number, reason: string, type: 'CREDIT' | 'DEBIT'): Promise<{ success: boolean }> {
    const { error } = await supabase.from('adjustments').insert({
      contract_id: contractId,
      date: new Date().toISOString().split('T')[0],
      amount,
      reason,
      type,
      created_by: 'Current User',
    });
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async createAddon(_contractId: string, _amount: number, _notes: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async renewContract(_contractId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async closeContract(contractId: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from('contracts').update({ status: 'CLOSED' }).eq('id', contractId);
    if (error) throw new Error(error.message);
    return { success: true };
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
    let query = supabase.from('transactions').select('*', { count: 'exact' });
    if (filters?.date) query = query.or(`date.eq.${filters.date},and(date.lt.${filters.date},status.eq.PENDING)`);
    if (filters?.accountId) query = query.eq('account_id', filters.accountId);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.direction) query = query.eq('direction', filters.direction);
    query = query.order('date', { ascending: false });

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { items: (data ?? []).map(mapTransaction), total: count ?? 0 };
  }

  async createTransaction(data: CreateTransactionInput): Promise<{ success: boolean }> {
    const accountIds = [data.accountId, ...(data.direction === 'TRANSFER' && data.transferToAccountId ? [data.transferToAccountId] : [])];
    if (data.direction === 'TRANSFER' && (!data.transferToAccountId || data.transferToAccountId === data.accountId)) {
      throw new Error('Choose a different destination account for the transfer.');
    }
    const { data: accounts, error: accountError } = await supabase.from('accounts').select('id,name').in('id', accountIds);
    if (accountError) throw new Error(accountError.message);
    const accountNames = new Map((accounts ?? []).map((a: {id:string;name:string}) => [a.id, a.name]));
    const status = data.status ?? 'DONE';
    const transferGroupId = data.direction === 'TRANSFER' ? crypto.randomUUID() : undefined;
    const common = {
      date: data.date,
      type: data.type,
      amount: data.amount,
      description: data.description,
      contract_id: data.contractId ?? null,
      person_id: data.personId ?? null,
      status,
      original_due_date: data.date,
      transfer_group_id: transferGroupId ?? null,
    };
    const rows = data.direction === 'TRANSFER' && data.transferToAccountId
      ? [
          { ...common, account_id: data.accountId, account_name: accountNames.get(data.accountId) ?? '', direction: 'OUT', description: `${data.description} (transfer out)` },
          { ...common, account_id: data.transferToAccountId, account_name: accountNames.get(data.transferToAccountId) ?? '', direction: 'IN', description: `${data.description} (transfer in)` },
        ]
      : [{ ...common, account_id: data.accountId, account_name: accountNames.get(data.accountId) ?? '', direction: data.direction }];
    const { error } = await supabase.from('transactions').insert(rows);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<{ success: boolean }> {
    const { data: row, error: lookupError } = await supabase.from('transactions').select('transfer_group_id').eq('id', id).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    let query = supabase.from('transactions').update({ status });
    query = row?.transfer_group_id ? query.eq('transfer_group_id', row.transfer_group_id) : query.eq('id', id);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // --- Dashboard ---
  async getDashboard(): Promise<Dashboard> {
    const { data: accounts } = await supabase.from('accounts').select('*');
    const { data: contracts } = await supabase.from('contracts').select('*').eq('status', 'ACTIVE');
    const { data: people } = await supabase.from('people').select('id').eq('status', 'ACTIVE');
    const today = new Date().toISOString().split('T')[0];
    const { data: todayDue } = await supabase
      .from('schedule_entries')
      .select('amount, collected, remaining, status, due_date, contracts!inner(person_name, id, type)')
      .lte('due_date', today)
      .neq('status', 'PAID');

    const mappedAccounts = (accounts ?? []).map(mapAccount);
    const cashAccounts = mappedAccounts.filter((a) => a.type === 'CASH');
    const bankAccounts = mappedAccounts.filter((a) => a.type === 'BANK');
    const cardAccounts = mappedAccounts.filter((a) => a.type === 'CARD');

    const cashInHand = cashAccounts.reduce((s, a) => s + a.balance, 0);
    const cashInBank = bankAccounts.reduce((s, a) => s + a.balance, 0);
    const creditCardBalance = cardAccounts.reduce((s, a) => s + (a.used ?? 0), 0);
    const creditAvailable = cardAccounts.reduce((s, a) => s + (a.available ?? 0), 0);

    const totalOutstanding = (contracts ?? []).reduce((s, c) => s + Number(c.outstanding ?? 0), 0);
    const overdue = (contracts ?? []).reduce((s, c) => s + Number(c.overdue ?? 0), 0);

    const todayDueTotal = (todayDue ?? []).reduce((s, d) => s + Number(d.remaining ?? 0), 0);

    const upcomingDues: DueItem[] = (todayDue ?? []).slice(0, 10).map((row: Record<string, unknown>) => {
      const contract = (row.contracts as unknown as Record<string, unknown>) ?? {};
      return {
        id: row.id as string,
        personName: contract.person_name as string,
        contractId: contract.id as string,
        contractType: contract.type as ContractType,
        dueDate: row.due_date as string,
        dueAmount: Number(row.amount),
        paid: Number(row.collected ?? 0),
        remaining: Number(row.remaining ?? 0),
        status: row.status as DueItem['status'],
      };
    });

    const overdueCustomers = (contracts ?? [])
      .filter((c) => Number(c.overdue ?? 0) > 0)
      .slice(0, 5)
      .map((c) => ({ id: c.id as string, name: c.person_name as string, overdueAmount: Number(c.overdue) }));

    return {
      cashInHand,
      cashInBank,
      actualCash: cashInHand + cashInBank,
      creditCardBalance,
      creditAvailable,
      totalOutstanding,
      todayDue: todayDueTotal,
      collectedToday: 0,
      overdue,
      expectedIn: totalOutstanding,
      expectedOut: 0,
      activePeople: people?.length ?? 0,
      activeContracts: contracts?.length ?? 0,
      upcomingDues,
      overdueCustomers,
    };
  }

  // --- Date Planner ---
  async getDatePlanner(targetDate: string): Promise<DateProjection> {
    const { data: accounts } = await supabase.from('accounts').select('*');
    const { data: schedule } = await supabase
      .from('schedule_entries')
      .select('due_date, amount, collected, remaining, status, contracts!inner(person_name, type)')
      .lte('due_date', targetDate)
      .neq('status', 'PAID')
      .order('due_date', { ascending: true });

    const mappedAccounts = (accounts ?? []).map(mapAccount);
    const cashAccounts = mappedAccounts.filter((a) => a.type === 'CASH');
    const bankAccounts = mappedAccounts.filter((a) => a.type === 'BANK');
    const cardAccounts = mappedAccounts.filter((a) => a.type === 'CARD');

    const cashInHand = cashAccounts.reduce((s, a) => s + a.balance, 0);
    const cashInBank = bankAccounts.reduce((s, a) => s + a.balance, 0);
    const creditCardBalance = cardAccounts.reduce((s, a) => s + (a.used ?? 0), 0);
    const creditAvailable = cardAccounts.reduce((s, a) => s + (a.available ?? 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const futureSchedule = (schedule ?? []).filter((s) => s.due_date > today);

    const expectedIn = futureSchedule
      .filter((s) => {
        const ct = (s.contracts as unknown as Record<string, unknown>)?.type;
        return ct === 'LDD' || ct === 'MONTHLY_MANUAL' || ct === 'MONTHLY_DIRECT' || ct === 'DIRECT2';
      })
      .reduce((s, e) => s + Number(e.remaining ?? 0), 0);

    const expectedOut = futureSchedule
      .filter((s) => {
        const ct = (s.contracts as unknown as Record<string, unknown>)?.type;
        return ct === 'THIRD_PARTY';
      })
      .reduce((s, e) => s + Number(e.remaining ?? 0), 0);

    const projectedActualCash = cashInHand + cashInBank + expectedIn - expectedOut;
    const shortfall = projectedActualCash < 0 ? Math.abs(projectedActualCash) : 0;

    const timeline = futureSchedule.map((event) => {
      const contract = (event.contracts as unknown as Record<string, unknown>) ?? {};
      const isThirdParty = contract.type === 'THIRD_PARTY';
      return {
        date: event.due_date as string,
        event: `${contract.person_name} — ${contract.type}`,
        source: contract.type as string,
        incoming: isThirdParty ? 0 : Number(event.remaining ?? 0),
        outgoing: isThirdParty ? Number(event.remaining ?? 0) : 0,
        projectedBalance: 0,
      };
    });

    return {
      asOfDate: today,
      targetDate,
      cashInHand,
      cashInBank,
      actualCash: cashInHand + cashInBank,
      creditCardBalance,
      creditAvailable,
      receivable: expectedIn,
      payable: expectedOut,
      expectedIn,
      expectedOut,
      projectedActualCash,
      shortfall,
      timeline,
    };
  }

  // --- Reports ---
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: accounts } = await supabase.from('accounts').select('*');
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, date, method')
      .gte('date', startDate)
      .lte('date', endDate);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, direction')
      .gte('date', startDate)
      .lte('date', endDate);

    const { data: contracts } = await supabase
      .from('contracts')
      .select('actual_amount_given, outstanding, overdue, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    const mappedAccounts = (accounts ?? []).map(mapAccount);
    const cashInHand = mappedAccounts.filter((a) => a.type === 'CASH').reduce((s, a) => s + a.balance, 0);
    const cashInBank = mappedAccounts.filter((a) => a.type === 'BANK').reduce((s, a) => s + a.balance, 0);
    const cardAccounts = mappedAccounts.filter((a) => a.type === 'CARD');
    const creditCardBalance = cardAccounts.reduce((s, a) => s + (a.used ?? 0), 0);
    const creditAvailable = cardAccounts.reduce((s, a) => s + (a.available ?? 0), 0);

    const moneyCollected = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const moneyGiven = (contracts ?? []).reduce((s, c) => s + Number(c.actual_amount_given ?? 0), 0);

    const interestReceived = (transactions ?? [])
      .filter((t) => t.type === 'INTEREST')
      .reduce((s, t) => s + Number(t.amount), 0);
    const expenses = (transactions ?? [])
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + Number(t.amount), 0);
    const emiPaid = (transactions ?? [])
      .filter((t) => t.type === 'EMI')
      .reduce((s, t) => s + Number(t.amount), 0);
    const cardPaid = (transactions ?? [])
      .filter((t) => t.type === 'CARD_PAYMENT')
      .reduce((s, t) => s + Number(t.amount), 0);

    const dailyCollections: { date: string; amount: number }[] = [];
    const byDate = new Map<string, number>();
    (payments ?? []).forEach((p) => {
      const d = p.date as string;
      byDate.set(d, (byDate.get(d) ?? 0) + Number(p.amount));
    });
    byDate.forEach((amount, date) => dailyCollections.push({ date, amount }));
    dailyCollections.sort((a, b) => a.date.localeCompare(b.date));

    return {
      year,
      month,
      openingCash: cashInHand + cashInBank - moneyCollected + moneyGiven,
      closingCash: cashInHand + cashInBank,
      cashInHand,
      cashInBank,
      creditCardBalance,
      creditAvailable,
      moneyGiven,
      moneyCollected,
      interestReceived,
      otherIncome: 0,
      expenses,
      emiPaid,
      cardPaid,
      receivable: 0,
      payable: 0,
      overdue: (contracts ?? []).reduce((s, c) => s + Number(c.overdue ?? 0), 0),
      dailyCollections,
    };
  }

  // --- Subscription ---
  async getSubscription(): Promise<Subscription> {
    return {
      plan: 'Pro',
      status: 'ACTIVE',
      billingPeriod: 'MONTHLY',
      nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      features: ['Unlimited contracts', 'Date planner', 'Monthly reports'],
      price: 999,
    };
  }

  // --- Notes ---
  async addNote(entityType: 'PERSON' | 'CONTRACT', entityId: string, content: string): Promise<Note> {
    const { data, error } = await supabase.from('notes').insert({
      entity_type: entityType,
      entity_id: entityId,
      content,
      created_by: 'Current User',
    }).select('*').single();
    if (error) throw new Error(error.message);
    return mapNote(data);
  }

  async getNotes(entityType: 'PERSON' | 'CONTRACT', entityId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapNote);
  }

  // --- Admin ---
  async getAdminDashboard(): Promise<AdminDashboard> {
    const { data: financers } = await supabase.from('financers').select('*');
    const { data: auditLogs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(10);

    const active = (financers ?? []).filter((f) => f.status === 'ACTIVE').length;
    const trial = (financers ?? []).filter((f) => f.subscription_status === 'TRIAL').length;
    const suspended = (financers ?? []).filter((f) => f.status === 'SUSPENDED').length;

    return {
      totalFinancers: financers?.length ?? 0,
      activeFinancers: active,
      trialFinancers: trial,
      suspended,
      mrr: active * 999,
      recentSignups: (financers ?? []).slice(-5).map((f) => ({
        id: f.id,
        businessName: f.business_name,
        ownerName: f.owner_name,
        status: f.status,
        subscriptionStatus: f.subscription_status,
        createdAt: f.created_at,
        lastActivity: f.last_activity,
        userCount: 1,
      })),
      recentActivity: (auditLogs ?? []).map((a) => ({
        id: a.id,
        financerId: a.financer_id ?? '',
        action: a.action,
        performedBy: a.performed_by,
        timestamp: a.timestamp,
        details: a.details ?? '',
        severity: a.severity,
      })),
      systemErrors: [],
    };
  }

  async getAdminFinancers(): Promise<Financer[]> {
    const { data, error } = await supabase.from('financers').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((f) => ({
      id: f.id,
      businessName: f.business_name,
      ownerName: f.owner_name,
      status: f.status,
      subscriptionStatus: f.subscription_status,
      createdAt: f.created_at,
      lastActivity: f.last_activity,
      userCount: 1,
    }));
  }

  async getAdminFinancer(id: string): Promise<Financer | null> {
    const { data, error } = await supabase.from('financers').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      businessName: data.business_name,
      ownerName: data.owner_name,
      status: data.status,
      subscriptionStatus: data.subscription_status,
      createdAt: data.created_at,
      lastActivity: data.last_activity,
      userCount: 1,
    };
  }

  async getAdminUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*, financers!inner(business_name)').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((p) => ({
      id: p.id,
      financerId: p.financer_id,
      name: p.name,
      email: p.email,
      role: p.role,
      status: p.status,
      createdAt: p.created_at,
      lastLogin: p.last_login,
    }));
  }

  async getAdminAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((a) => ({
      id: a.id,
      financerId: a.financer_id ?? '',
      action: a.action,
      performedBy: a.performed_by,
      timestamp: a.timestamp,
      details: a.details ?? '',
      severity: a.severity,
    }));
  }

  // --- Private helpers ---
  private async findOrCreatePerson(name: string, phone: string): Promise<string> {
    if (phone) {
      const { data: existing } = await supabase
        .from('people')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();
      if (existing) return existing.id;
    }
    const { data: person, error } = await supabase
      .from('people')
      .insert({ name, phone: phone || 'N/A' })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return person.id;
  }

  private async generateSchedule(contract: Contract): Promise<ScheduleEntry[]> {
    const entries: { due_date: string; amount: number }[] = [];

    switch (contract.type) {
      case 'LDD': {
        const start = new Date(contract.startDate);
        for (let i = 0; i < contract.days; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          if (contract.dateRule === 'AUTO' && d.getDay() === 0) continue;
          entries.push({
            due_date: d.toISOString().split('T')[0],
            amount: contract.dailyCollection,
          });
        }
        break;
      }
      case 'MONTHLY_MANUAL': {
        const start = new Date(contract.firstDueDate);
        for (let i = 0; i < contract.period; i++) {
          const d = new Date(start);
          d.setMonth(d.getMonth() + i);
          entries.push({
            due_date: d.toISOString().split('T')[0],
            amount: contract.plannedMonthlyPayment,
          });
        }
        break;
      }
      case 'MONTHLY_DIRECT': {
        const interestStart = new Date(contract.interestCreditDate);
        for (let i = 0; i < contract.numberOfMonths; i++) {
          const d = new Date(interestStart);
          d.setMonth(d.getMonth() + i);
          entries.push({
            due_date: d.toISOString().split('T')[0],
            amount: contract.monthlyInterest,
          });
        }
        entries.push({
          due_date: contract.finalPrincipalDate,
          amount: contract.actualAmountGiven,
        });
        break;
      }
      case 'DIRECT2': {
        entries.push({ due_date: contract.dueDate, amount: contract.totalAmountToReceive });
        break;
      }
      case 'THIRD_PARTY': {
        if (contract.recoveryMode === 'ONE_TIME' && contract.endDate) {
          entries.push({ due_date: contract.endDate, amount: contract.monthlyAmount || contract.actualAmountGiven });
        } else if (contract.recoveryMode === 'MONTHLY' || contract.recoveryMode === 'EMI') {
          const start = new Date(contract.startDate);
          const end = new Date(contract.endDate);
          const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 86400000)));
          for (let i = 0; i < months; i++) {
            const d = new Date(start);
            d.setMonth(d.getMonth() + i);
            entries.push({
              due_date: d.toISOString().split('T')[0],
              amount: contract.monthlyAmount,
            });
          }
        }
        break;
      }
    }

    if (entries.length === 0) return [];

    const rows = entries.map((e) => ({
      contract_id: contract.id,
      due_date: e.due_date,
      amount: e.amount,
      remaining: e.amount,
      status: 'PENDING',
    }));

    const { data, error } = await supabase
      .from('schedule_entries')
      .insert(rows)
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapScheduleEntry);
  }
}
