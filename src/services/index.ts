import { SupabaseApiService } from '@/services/SupabaseApiService';
import type { ApiService } from '@/api/ApiService';

export const api: ApiService = new SupabaseApiService();

export type { ApiService };
