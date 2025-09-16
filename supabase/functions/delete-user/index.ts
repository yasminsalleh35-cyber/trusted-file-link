// Supabase Edge Function: delete-user
// Deletes a user from Supabase Auth and removes their profile row.
// Access control:
// - Admin path: either header x-admin-secret === ADMIN_SECRET, OR
//   requester is admin role (checked via Authorization token)
// - Client path: requires Authorization: Bearer <token>; only allows
//   client role users to delete their own team users (same client_id, target role 'user')

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
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return json({ error: "userId is required" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return json({ error: "Server not configured" }, 500);
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

    const adminHeader = req.headers.get("x-admin-secret") || "";
    let isAdmin = ADMIN_SECRET && adminHeader === ADMIN_SECRET;

    // If no admin secret header, infer admin by JWT role
    if (!isAdmin) {
      const actorId = parseBearerUserId(req);
      if (!actorId) return json({ error: "Unauthorized" }, 401);

      const { data: actor, error: actorErr } = await adminClient
        .from("profiles")
        .select("id, role, client_id")
        .eq("id", actorId)
        .single();
      if (actorErr || !actor) return json({ error: "Profile not found" }, 403);
      if (actor.role === "admin") isAdmin = true;
    }

    if (!isAdmin) {
      // Client-managed path: verify requester and ownership
      const actorId = parseBearerUserId(req);
      if (!actorId) return json({ error: "Unauthorized" }, 401);

      const { data: actor, error: actorErr } = await adminClient
        .from("profiles")
        .select("id, role, client_id")
        .eq("id", actorId)
        .single();
      if (actorErr || !actor) return json({ error: "Profile not found" }, 403);

      if (actor.role !== "client") {
        return json({ error: "Forbidden" }, 403);
      }

      // Load target profile (admin client to bypass RLS)
      const { data: target, error: targetErr } = await adminClient
        .from("profiles")
        .select("id, role, client_id")
        .eq("id", userId)
        .single();
      if (targetErr || !target) {
        return json({ error: "Target profile not found" }, 404);
      }

      if (target.client_id !== actor.client_id || target.role !== "user") {
        return json({ error: "Forbidden" }, 403);
      }
    }

    // Perform deletion (Auth user + profile row)
    const { error: authErr } = await adminClient.auth.admin.deleteUser(userId);
    if (authErr) {
      return json({ error: `Auth delete failed: ${authErr.message}` }, 400);
    }

    const { error: profileErr } = await adminClient.from("profiles").delete().eq("id", userId);
    if (profileErr) {
      // Not fatal; return warning
      return json({ ok: true, warning: `Profile cleanup failed: ${profileErr.message}` }, 200);
    }

    return json({ ok: true }, 200);
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