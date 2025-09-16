// Admin API wrapper now targets Supabase Edge Functions with auth.
// If a local ADMIN_API_BASE is set and reachable, it will be used; otherwise falls back to Functions.

import { supabase } from '@/integrations/supabase/client';

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || '';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function isLocalhostHost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
}

function getLocalBaseOrNull() {
  // Only use local admin server when we are actually on localhost to avoid production calling localhost
  if (!ADMIN_API_BASE) return '';
  return isLocalhostHost() ? ADMIN_API_BASE : '';
}

function getFunctionsUrl(name: string) {
  if (!SUPABASE_URL) throw new Error('Missing VITE_SUPABASE_URL');
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function deleteAuthUser(userId: string): Promise<{ ok: boolean; warning?: string; error?: string }> {
  // Try local server first if configured; otherwise call function directly
  const tryLocal = async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ADMIN_SECRET) headers['x-admin-secret'] = ADMIN_SECRET;
    const res = await fetch(`${ADMIN_API_BASE}/admin/delete-user`, {
      method: 'POST', headers, body: JSON.stringify({ userId }), credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
    return { ok: true, warning: data?.warning } as const;
  };

  const tryFunction = async () => {
    const url = getFunctionsUrl('delete-user');
    const headers = await getAuthHeaders();
    if (SUPABASE_ANON_KEY) headers['apikey'] = SUPABASE_ANON_KEY;
    if (ADMIN_SECRET) headers['x-admin-secret'] = ADMIN_SECRET; // optional admin path
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ userId }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
    return { ok: true, warning: data?.warning } as const;
  };

  try {
    const local = getLocalBaseOrNull();
    if (local) return await tryLocal();
    return await tryFunction();
  } catch (e) {
    try {
      return await tryFunction();
    } catch (e2: any) {
      return { ok: false, error: e2?.message || 'Request failed' };
    }
  }
}

export async function deleteClientCascade(clientId: string, deleteUsers = true): Promise<{ ok: boolean; warnings?: string[]; error?: string }> {
  const tryLocal = async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ADMIN_SECRET) headers['x-admin-secret'] = ADMIN_SECRET;
    const res = await fetch(`${ADMIN_API_BASE}/admin/delete-client`, {
      method: 'POST', headers, body: JSON.stringify({ clientId, deleteUsers }), credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
    return { ok: true, warnings: data?.warnings } as const;
  };

  const tryFunction = async () => {
    const url = getFunctionsUrl('delete-client');
    const headers = await getAuthHeaders();
    if (SUPABASE_ANON_KEY) headers['apikey'] = SUPABASE_ANON_KEY;
    if (ADMIN_SECRET) headers['x-admin-secret'] = ADMIN_SECRET; // allow admin path
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ clientId, deleteUsers }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
    return { ok: true, warnings: data?.warnings } as const;
  };

  try {
    const local = getLocalBaseOrNull();
    if (local) return await tryLocal();
    return await tryFunction();
  } catch (e) {
    try {
      return await tryFunction();
    } catch (e2: any) {
      return { ok: false, error: e2?.message || 'Request failed' };
    }
  }
}