import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PeoplePage, PersonDetailPage } from '@/pages/PeoplePage';
import { LDDPage } from '@/pages/LDDPage';
import { MonthlyPage } from '@/pages/MonthlyPage';
import { ThirdPartyPage } from '@/pages/ThirdPartyPage';
import { DuePage } from '@/pages/DuePage';
import { LedgerPage } from '@/pages/NewEntryPages';
import {
  AccountsPage,
  AccountDetailPage,
  TransactionsPage,
  ReportsPage,
  SettingsPage,
  LedgerEntryPage,
  AdminDashboardPage,
  AdminFinancersPage,
  AdminFinancerDetailPage,
  AdminUsersPage,
  AdminSubscriptionsPage,
  AdminAuditPage,
} from '@/pages/AccountPages';
import { DatePlannerPage } from '@/pages/DatePlannerPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — financer + admin */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/people" element={<PeoplePage />} />
                <Route path="/people/:id" element={<PersonDetailPage />} />
                <Route path="/new/ldd" element={<LDDPage />} />
                <Route path="/new/monthly" element={<MonthlyPage />} />
                <Route path="/new/third-party" element={<ThirdPartyPage />} />
                <Route path="/due" element={<DuePage />} />
                <Route path="/ledger" element={<LedgerPage />} />
                <Route path="/ledger/:contractId" element={<LedgerEntryPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/accounts/:id" element={<AccountDetailPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/date-planner" element={<DatePlannerPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Protected — admin only */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/financers" element={<AdminFinancersPage />} />
                <Route path="/admin/financers/:id" element={<AdminFinancerDetailPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="/admin/audit" element={<AdminAuditPage />} />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
