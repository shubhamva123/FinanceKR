
import { supabase } from '@/lib/supabase';
import type { Session, UserRole } from '@/types';
import type { AuthService } from './auth';

export class SupabaseAuthService implements AuthService {
  async login(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed — no user returned.');

    return this.buildSession(data.user.id);
  }

  async signUp(
    email: string,
    password: string,
    name: string,
    businessName: string,
  ): Promise<Session> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          business_name: businessName.trim(),
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Sign up failed — no user returned.');

    // The database trigger creates the financer and profile.
    // If email confirmation is enabled, a session may not exist yet.
    if (!data.session) {
      throw new Error(
        'Account created. Please confirm your email, then log in.',
      );
    }

    return this.buildSession(data.user.id);
  }

  private async buildSession(userId: string): Promise<Session> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, financer_id, name, email, role, status')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Could not load user profile: ${error.message}`);
    }

    if (!profile) {
      throw new Error(
        'Your profile was not found. Please contact support before retrying signup.',
      );
    }

    if (profile.status !== 'ACTIVE') {
      await supabase.auth.signOut();
      throw new Error('Your account is inactive. Please contact support.');
    }

    let businessName = 'My Finance';

    if (profile.financer_id) {
      const { data: financer, error: financerError } = await supabase
        .from('financers')
        .select('business_name')
        .eq('id', profile.financer_id)
        .maybeSingle();

      if (financerError) {
        throw new Error(
          `Could not load business details: ${financerError.message}`,
        );
      }

      businessName = financer?.business_name ?? businessName;
    }

    const role = profile.role as UserRole;

    return {
      userId: profile.id,
      financerId: profile.financer_id,
      userName: profile.name,
      userEmail: profile.email,
      role,
      businessName,
      isSupportMode: false,
    };
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  getSession(): Session | null {
    // Supabase session restoration is asynchronous.
    // Use restoreSession() to retrieve the authenticated app session.
    return null;
  }

  async restoreSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.user) return null;

    try {
      return await this.buildSession(data.session.user.id);
    } catch {
      return null;
    }
  }
}
