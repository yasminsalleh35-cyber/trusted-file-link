import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Init admin client once
const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey);

router.post('/delete-user', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Delete from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) return res.status(400).json({ error: `Auth delete failed: ${authError.message}` });

    // Also remove profile row (id = auth user id)
    const { error: profileError } = await adminClient.from('profiles').delete().eq('id', userId);
    if (profileError) {
      // Not fatal for auth deletion, but report it
      return res.status(200).json({ ok: true, warning: `Profile cleanup failed: ${profileError.message}` });
    }

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

// Delete a client and optionally all its users (auth + profiles)
router.post('/delete-client', requireAdmin, async (req, res) => {
  try {
    const { clientId, deleteUsers = true } = req.body as { clientId?: string; deleteUsers?: boolean };
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });

    const deletedUserIds: string[] = [];
    const warnings: string[] = [];

    if (deleteUsers) {
      // Fetch profiles for the client
      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('client_id', clientId);
      if (profilesError) {
        return res.status(400).json({ error: `Fetch client users failed: ${profilesError.message}` });
      }

      // Delete each auth user
      for (const p of profiles || []) {
        if (!p?.id) continue;
        const { error: authError } = await adminClient.auth.admin.deleteUser(p.id);
        if (authError) {
          warnings.push(`Auth delete failed for ${p.id}: ${authError.message}`);
        } else {
          deletedUserIds.push(p.id);
        }
      }

      // Remove all profile rows for the client
      const { error: profileDeleteErr } = await adminClient.from('profiles').delete().eq('client_id', clientId);
      if (profileDeleteErr) warnings.push(`Profile cleanup failed: ${profileDeleteErr.message}`);
    }

    // Finally delete the client row
    const { error: clientDeleteErr } = await adminClient.from('clients').delete().eq('id', clientId);
    if (clientDeleteErr) return res.status(400).json({ error: `Client delete failed: ${clientDeleteErr.message}` });

    return res.json({ ok: true, deletedUserIds, warnings });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

export default router;