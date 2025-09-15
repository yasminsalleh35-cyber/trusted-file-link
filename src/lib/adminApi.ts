// Simple admin API client for local server

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:8787';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';

export async function deleteAuthUser(userId: string): Promise<{ ok: boolean; warning?: string; error?: string }> {
  const res = await fetch(`${ADMIN_API_BASE}/admin/delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ADMIN_SECRET ? { 'x-admin-secret': ADMIN_SECRET } : {}),
    },
    body: JSON.stringify({ userId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data?.error || `Request failed: ${res.status}` };
  }
  return { ok: true, warning: data?.warning };
}

export async function deleteClientCascade(clientId: string, deleteUsers = true): Promise<{ ok: boolean; warnings?: string[]; error?: string }> {
  const res = await fetch(`${ADMIN_API_BASE}/admin/delete-client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ADMIN_SECRET ? { 'x-admin-secret': ADMIN_SECRET } : {}),
    },
    body: JSON.stringify({ clientId, deleteUsers }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data?.error || `Request failed: ${res.status}` };
  }
  return { ok: true, warnings: data?.warnings };
}