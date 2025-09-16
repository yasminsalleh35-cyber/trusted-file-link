// Supabase Edge Function: delete-client
// Deletes a client and (optionally) all associated users from Auth and profiles, then deletes the client row.
// Access control:
// - Admin path: header x-admin-secret OR requester is admin (via Authorization token)
// - Client path: requires client role and that clientId matches their own client_id.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-admin-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseBearerUserId(req: Request): string | null {
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
    const json = atob(base64 + pad);
    const obj = JSON.parse(json);
    return obj?.sub || null; // Supabase user id
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const { clientId, deleteUsers = true } = await req.json();
    if (!clientId || typeof clientId !== "string") return json({ error: "clientId is required" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: "Server not configured" }, 500);

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Admin via secret header
    const adminHeader = req.headers.get("x-admin-secret") || "";
    let isAdmin = ADMIN_SECRET && adminHeader === ADMIN_SECRET;

    // If not admin by secret, infer from JWT
    let actorId: string | null = null;
    if (!isAdmin) {
      actorId = parseBearerUserId(req);
      if (!actorId) return json({ error: "Unauthorized" }, 401);

      const { data: actor, error: actorErr } = await adminClient
        .from("profiles")
        .select("id, role, client_id")
        .eq("id", actorId)
        .single();
      if (actorErr || !actor) return json({ error: "Profile not found" }, 403);

      if (actor.role === "admin") {
        isAdmin = true;
      } else if (!(actor.role === "client" && actor.client_id === clientId)) {
        return json({ error: "Forbidden" }, 403);
      }
    }

    const deletedUserIds: string[] = [];
    const warnings: string[] = [];

    if (deleteUsers) {
      const { data: profiles, error: profilesErr } = await adminClient
        .from("profiles")
        .select("id")
        .eq("client_id", clientId);
      if (profilesErr) return json({ error: `Fetch client users failed: ${profilesErr.message}` }, 400);

      for (const p of profiles || []) {
        if (!p?.id) continue;
        const { error: authErr } = await adminClient.auth.admin.deleteUser(p.id);
        if (authErr) warnings.push(`Auth delete failed for ${p.id}: ${authErr.message}`);
        else deletedUserIds.push(p.id);
      }

      const { error: profileDelErr } = await adminClient.from("profiles").delete().eq("client_id", clientId);
      if (profileDelErr) warnings.push(`Profile cleanup failed: ${profileDelErr.message}`);
    }

    const { error: clientDelErr } = await adminClient.from("clients").delete().eq("id", clientId);
    if (clientDelErr) return json({ error: `Client delete failed: ${clientDelErr.message}` }, 400);

    return json({ ok: true, deletedUserIds, warnings }, 200);
  } catch (e) {
    return json({ error: e?.message || "Internal error" }, 500);
  }
});

function json(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}