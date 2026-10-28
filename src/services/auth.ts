import { SupabaseAuthService } from '@/services/SupabaseAuthService';
import type { Session, UserRole } from '@/types';

export interface AuthService {
  login(email: string, password: string): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Session | null;
  restoreSession(): Promise<Session | null>;
}

export const authService: AuthService & SupabaseAuthService = new SupabaseAuthService();

export function hasRole(session: Session | null, ...roles: UserRole[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}
