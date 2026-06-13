// Standalone mock Supabase client for goal.teoh.my (no backend needed)
// Replaces auto-generated Lovable/Supabase client with localStorage persistence

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'local-key';

// For goal.teoh.my: if no real Supabase URL, use localStorage-only mock
const isRealSupabase = SUPABASE_URL.includes('supabase.co');

class LocalStorageSupabase {
  private prefix = 'goal_ui_';
  
  from(table: string) {
    return {
      select: (columns: string = '*') => ({
        eq: (col: string, val: string) => ({
          single: async () => {
            const key = `${this.prefix}${table}_${col}_${val}`;
            const raw = localStorage.getItem(key);
            return { data: raw ? JSON.parse(raw) : null, error: raw ? null : { message: 'Not found' } };
          },
          order: (col: string, opts: any) => this.from(table).select(columns),
          limit: (n: number) => this.from(table).select(columns),
        }),
        order: (col: string, opts: any) => ({
          limit: (n: number) => {
            const items: any[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k?.startsWith(`${this.prefix}${table}_`)) {
                items.push(JSON.parse(localStorage.getItem(k)!));
              }
            }
            return { data: items.slice(0, n), error: null };
          }
        }),
        limit: (n: number) => {
          const items: any[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(`${this.prefix}${table}_`)) {
              items.push(JSON.parse(localStorage.getItem(k)!));
            }
          }
          return { data: items.slice(0, n), error: null };
        }
      }),
      insert: (data: any) => ({
        select: () => {
          const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
          const record = { ...data, id, created_at: new Date().toISOString() };
          localStorage.setItem(`${this.prefix}${table}_id_${id}`, JSON.stringify(record));
          return { data: [record], error: null };
        }
      }),
      update: (data: any) => ({
        eq: (col: string, val: string) => {
          const key = `${this.prefix}${table}_${col}_${val}`;
          const existing = localStorage.getItem(key);
          const record = existing ? { ...JSON.parse(existing), ...data, [col]: val } : { ...data, id: val };
          localStorage.setItem(key, JSON.stringify(record));
          return { data: [record], error: null };
        }
      }),
      delete: () => ({
        eq: (col: string, val: string) => {
          const key = `${this.prefix}${table}_${col}_${val}`;
          localStorage.removeItem(key);
          return { data: null, error: null };
        }
      })
    };
  }
  
  auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  };
}

export const supabase = isRealSupabase 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
    })
  : new LocalStorageSupabase() as any;
