// Entry fee payments through Revolut checkout. The money goes to the club's Revolut Business account.
//
// Secrets (Supabase dashboard > Edge Functions > Secrets), never in the code:
//   REVOLUT_SECRET_KEY  Merchant API secret key (Sandbox key while testing, Production key for real money)
//   REVOLUT_MODE        "sandbox" (default, test money) or "live"
//   SITE_URL            optional, defaults to https://register.maltacaninefederation.com/
//
// Deploy with JWT verification off (Revolut's webhook has no Supabase login); the function checks
// the caller's team role itself:  supabase functions deploy payments --no-verify-jwt
//
// Calls from the site (signed in, organisers and admins):
//   {action:"checkout", show_id, entry_ids:[...], payer}  -> creates a Revolut order, returns {payment}
//   {action:"refresh", payment_id}                        -> asks Revolut for the order's state, marks entries paid
// Calls from Revolut (webhook, ORDER_COMPLETED etc.): {event, order_id, ...}
//   The body is only a hint: the order is fetched back from Revolut with the secret key before anything is marked paid.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

const KEY = Deno.env.get("REVOLUT_SECRET_KEY") || "";
const MODE = Deno.env.get("REVOLUT_MODE") === "live" ? "live" : "sandbox";
const BASE = MODE === "live" ? "https://merchant.revolut.com" : "https://sandbox-merchant.revolut.com";
const SITE = (Deno.env.get("SITE_URL") || "https://register.maltacaninefederation.com/").replace(/\/?$/, "/");
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function revolut(path: string, method = "GET", body?: unknown) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Authorization": "Bearer " + KEY, "Revolut-Api-Version": "2024-09-01", "Content-Type": "application/json", "Accept": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Revolut didn't accept the API key. Check REVOLUT_SECRET_KEY (and that REVOLUT_MODE matches a Sandbox or Production key).");
  if (!res.ok) throw new Error(`Revolut said no (${res.status}): ${j?.message || j?.code || "unknown error"}`);
  return j;
}

type Payment = { id: string; show_id: string; entry_ids: string[]; revolut_order_id: string | null; state: string; paid_at: string | null };

// Ask Revolut where the order is; when it's completed, mark the payment and its entries paid.
async function refresh(p: Payment) {
  if (!p.revolut_order_id) return p;
  const o = await revolut(`/api/orders/${encodeURIComponent(p.revolut_order_id)}`);
  const state = String(o.state || "").toLowerCase() || p.state;
  const upd: Record<string, unknown> = { state };
  const now = new Date().toISOString();
  if (state === "completed" && !p.paid_at) upd.paid_at = now;
  const { data, error } = await db.from("payments").update(upd).eq("id", p.id).select().single();
  if (error) throw error;
  if (state === "completed") {
    const r = await db.from("entries").update({ paid_at: data.paid_at || now, paid_via: "revolut", payment_id: p.id })
      .in("id", p.entry_ids).is("paid_at", null);
    if (r.error) throw r.error;
  }
  return data;
}

async function caller(req: Request) {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await db.auth.getUser(jwt);
  const email = (data?.user?.email || "").toLowerCase();
  if (!email) return null;
  const { data: m } = await db.from("team_members").select("role").eq("email", email).maybeSingle();
  return m ? { email, role: String(m.role) } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ ok: false, error: "POST only" }, 405);
  let d: Record<string, unknown> = {};
  try { d = await req.json(); } catch { return reply({ ok: false, error: "Bad request" }, 400); }

  // ---- Revolut webhook ----
  if (d.event && d.order_id) {
    try {
      const { data: p } = await db.from("payments").select("*").eq("revolut_order_id", String(d.order_id)).maybeSingle();
      if (p && KEY) await refresh(p as Payment);
    } catch (e) { console.error("webhook", e); return reply({ ok: false }, 500); } // 5xx: Revolut tries again later
    return new Response(null, { status: 204, headers: cors });
  }

  // ---- calls from the site ----
  try {
    if (!KEY) return reply({ ok: false, error: "Card payments aren't set up yet. Add REVOLUT_SECRET_KEY under Edge Functions > Secrets in Supabase." });
    const who = await caller(req);
    if (!who) return reply({ ok: false, error: "Sign in with a team login first." }, 401);

    if (d.action === "refresh") {
      const { data: p, error } = await db.from("payments").select("*").eq("id", String(d.payment_id || "")).maybeSingle();
      if (error) throw error;
      if (!p) return reply({ ok: false, error: "That payment wasn't found." });
      return reply({ ok: true, payment: await refresh(p as Payment), mode: MODE });
    }

    if (d.action === "checkout") {
      if (!["admin", "organiser"].includes(who.role)) return reply({ ok: false, error: "Only organisers and admins can take payments." }, 403);
      const { data: show, error: se } = await db.from("shows").select("id,name,entry_fee_cents").eq("id", String(d.show_id || "")).maybeSingle();
      if (se) throw se;
      if (!show) return reply({ ok: false, error: "That show wasn't found." });
      const fee = Number(show.entry_fee_cents || 0);
      if (!(fee > 0)) return reply({ ok: false, error: "Set the entry fee for this show first." });
      const ids = Array.isArray(d.entry_ids) ? (d.entry_ids as unknown[]).map(String).slice(0, 200) : [];
      const { data: ents, error: ee } = await db.from("entries").select("id").eq("show_id", show.id).in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).is("paid_at", null);
      if (ee) throw ee;
      if (!ents?.length) return reply({ ok: false, error: "Those entries are already paid." });
      const entryIds = ents.map((e) => e.id as string);
      const amount = fee * entryIds.length;
      const payer = String(d.payer || "").slice(0, 120);
      const { data: p, error: pe } = await db.from("payments").insert({
        show_id: show.id, entry_ids: entryIds, payer, amount_cents: amount, currency: "EUR", mode: MODE, created_by: who.email,
      }).select().single();
      if (pe) throw pe;
      try {
        const back = `${SITE}payments.html?show=${encodeURIComponent(show.name)}&payment=${p.id}`;
        const o = await revolut("/api/orders", "POST", {
          amount, currency: "EUR",
          description: `${show.name}: ${entryIds.length} ${entryIds.length === 1 ? "entry" : "entries"}${payer ? " for " + payer : ""}`.slice(0, 1024),
          merchant_order_data: { reference: p.id },
          redirect_url: back,
        });
        const { data: p2, error: ue } = await db.from("payments").update({
          revolut_order_id: o.id, checkout_url: o.checkout_url, state: String(o.state || "pending").toLowerCase(),
        }).eq("id", p.id).select().single();
        if (ue) throw ue;
        return reply({ ok: true, payment: p2, mode: MODE });
      } catch (e) {
        await db.from("payments").update({ state: "failed" }).eq("id", p.id);
        throw e;
      }
    }
    return reply({ ok: false, error: "Unknown action" }, 400);
  } catch (e) {
    return reply({ ok: false, error: (e as Error).message || String(e) });
  }
});
