// Entry fee payments by card through Stripe Checkout. Stripe pays the money out to the club's
// Revolut account (add the Revolut IBAN as the payout bank account in the Stripe dashboard).
//
// Secrets (Supabase dashboard > Edge Functions > Secrets), never in the code:
//   STRIPE_SECRET_KEY   sk_test_... while testing (no real money), sk_live_... for real payments
//   SITE_URL            optional, defaults to https://register.maltacaninefederation.com/
//
// Deploy with JWT verification off (Stripe's webhook has no Supabase login); the function checks
// the caller's team role itself:  supabase functions deploy payments --no-verify-jwt
//
// Calls from the site (signed in):
//   {action:"checkout", show_id, entry_ids:[...], payer, back}  creates a Stripe Checkout Session, returns {payment}.
//        Organisers and admins pay for any entries; owners only for their own dogs' entries.
//        back: "mydogs" sends the payer back to the My dogs page instead of Payments.
//   {action:"refresh", payment_id}                        asks Stripe for the session's state, marks entries paid
// Calls from Stripe (webhook, checkout.session.completed etc.): {type, data:{object:{id}}}
//   The body is only a hint: the session is fetched back from Stripe with the secret key before anything is marked paid.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

const KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const MODE = KEY.startsWith("sk_live_") || KEY.startsWith("rk_live_") ? "live" : "test";
const SITE = (Deno.env.get("SITE_URL") || "https://register.maltacaninefederation.com/").replace(/\/?$/, "/");
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

// Stripe's API takes form-encoded bodies with bracketed keys, e.g. line_items[0][quantity]=2
function form(o: Record<string, unknown>, pre = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(o)) {
    const key = pre ? `${pre}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === "object") form(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}
async function stripe(path: string, method = "GET", body?: Record<string, unknown>) {
  const res = await fetch("https://api.stripe.com/v1" + path, {
    method,
    headers: { "Authorization": "Bearer " + KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body: body ? form(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Stripe didn't accept the key. Check STRIPE_SECRET_KEY in Supabase secrets.");
  if (!res.ok) throw new Error(`Stripe said no (${res.status}): ${j?.error?.message || "unknown error"}`);
  return j;
}

type Payment = { id: string; show_id: string; entry_ids: string[]; order_ref: string | null; state: string; paid_at: string | null };

// Ask Stripe where the checkout is; once it's paid, mark the payment and its entries paid.
async function refresh(p: Payment) {
  if (!p.order_ref) return p;
  const s = await stripe(`/checkout/sessions/${encodeURIComponent(p.order_ref)}`);
  const paid = s.payment_status === "paid" || s.payment_status === "no_payment_required";
  const state = paid ? "completed" : s.status === "expired" ? "expired" : "pending";
  const now = new Date().toISOString();
  const upd: Record<string, unknown> = { state };
  if (paid && !p.paid_at) upd.paid_at = now;
  const { data, error } = await db.from("payments").update(upd).eq("id", p.id).select().single();
  if (error) throw error;
  if (paid) {
    const r = await db.from("entries").update({ paid_at: data.paid_at || now, paid_via: "card", payment_id: p.id })
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
const STAFF = ["admin", "organiser"];
const OWN = ["owner"];

// Owners: the lower-cased names of the dogs linked to their email (entries link to dogs by name).
async function myDogNames(email: string) {
  const { data, error } = await db.from("dogs").select("name").contains("owner_emails", [email]);
  if (error) throw error;
  return new Set((data || []).map((d) => String(d.name).toLowerCase()));
}

// Before a new checkout: an older checkout that is still open for any of the same entries is
// checked with Stripe, and closed if it isn't paid, so nobody can pay twice for one entry.
async function closeOverlapping(showId: string, entryIds: string[]) {
  const { data, error } = await db.from("payments").select("*").eq("show_id", showId).eq("state", "pending").overlaps("entry_ids", entryIds);
  if (error) throw error;
  for (const old of (data || []) as Payment[]) {
    const p = await refresh(old);
    if (p.state === "pending" && old.order_ref) {
      try { await stripe(`/checkout/sessions/${encodeURIComponent(old.order_ref)}/expire`, "POST", {}); } catch (e) { console.error("expire", e); }
      await refresh(old);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ ok: false, error: "POST only" }, 405);
  let d: Record<string, unknown> = {};
  try { d = await req.json(); } catch { return reply({ ok: false, error: "Bad request" }, 400); }

  // ---- Stripe webhook ----
  const obj = (d.data as { object?: { id?: string; object?: string } } | undefined)?.object;
  if (typeof d.type === "string" && obj?.object === "checkout.session" && obj.id) {
    try {
      const { data: p } = await db.from("payments").select("*").eq("order_ref", String(obj.id)).maybeSingle();
      if (p && KEY) await refresh(p as Payment);
    } catch (e) { console.error("webhook", e); return reply({ ok: false }, 500); } // 5xx: Stripe tries again later
    return reply({ received: true });
  }

  // ---- calls from the site ----
  try {
    if (!KEY) return reply({ ok: false, error: "Card payments aren't set up yet. Add STRIPE_SECRET_KEY under Edge Functions > Secrets in Supabase." });
    const who = await caller(req);
    if (!who) return reply({ ok: false, error: "Sign in with a team login first." }, 401);

    if (d.action === "refresh") {
      const { data: p, error } = await db.from("payments").select("*").eq("id", String(d.payment_id || "")).maybeSingle();
      if (error) throw error;
      if (!p) return reply({ ok: false, error: "That payment wasn't found." });
      // owners only check payments they started, or that cover their own dogs
      if (OWN.includes(who.role) && p.created_by !== who.email) {
        const mine = await myDogNames(who.email);
        const { data: es } = await db.from("entries").select("dog_name").in("id", (p as Payment).entry_ids.length ? (p as Payment).entry_ids : ["00000000-0000-0000-0000-000000000000"]);
        if (!(es || []).some((e) => mine.has(String(e.dog_name).toLowerCase()))) return reply({ ok: false, error: "That payment wasn't found." });
      }
      return reply({ ok: true, payment: await refresh(p as Payment), mode: MODE });
    }

    if (d.action === "checkout") {
      if (!STAFF.includes(who.role) && !OWN.includes(who.role)) return reply({ ok: false, error: "Only organisers, admins and the dogs' owners can pay entry fees." }, 403);
      const { data: show, error: se } = await db.from("shows").select("id,name,entry_fee_cents").eq("id", String(d.show_id || "")).maybeSingle();
      if (se) throw se;
      if (!show) return reply({ ok: false, error: "That show wasn't found." });
      const fee = Number(show.entry_fee_cents || 0);
      if (!(fee > 0)) return reply({ ok: false, error: "Set the entry fee for this show first." });
      const ids = Array.isArray(d.entry_ids) ? (d.entry_ids as unknown[]).map(String).slice(0, 200) : [];
      const { data: found, error: ee } = await db.from("entries").select("id,dog_name,class").eq("show_id", show.id).in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).is("paid_at", null);
      if (ee) throw ee;
      let ents = found || [];
      if (!STAFF.includes(who.role)) {
        const mine = await myDogNames(who.email);
        ents = ents.filter((e) => !["Junior Handler", "Childrens Class"].includes(String(e.class)) && mine.has(String(e.dog_name).toLowerCase()));
        if (found?.length && !ents.length) return reply({ ok: false, error: "You can only pay for your own dogs' entries." }, 403);
      }
      if (!ents.length) return reply({ ok: false, error: "Those entries are already paid." });
      // close older unpaid checkouts for these entries, then leave out any that one of them has just paid
      await closeOverlapping(show.id, ents.map((e) => e.id as string));
      const { data: still, error: se2 } = await db.from("entries").select("id").in("id", ents.map((e) => e.id as string)).is("paid_at", null);
      if (se2) throw se2;
      if (!still?.length) return reply({ ok: false, error: "Those entries are already paid." });
      const entryIds = still.map((e) => e.id as string);
      const payer = String(d.payer || (STAFF.includes(who.role) ? "" : who.email)).slice(0, 120);
      const { data: p, error: pe } = await db.from("payments").insert({
        show_id: show.id, entry_ids: entryIds, payer, amount_cents: fee * entryIds.length, currency: "EUR",
        provider: "stripe", mode: MODE, created_by: who.email,
      }).select().single();
      if (pe) throw pe;
      try {
        const back = d.back === "mydogs" || !STAFF.includes(who.role)
          ? `${SITE}mydogs.html?payment=${p.id}`
          : `${SITE}payments.html?show=${encodeURIComponent(show.name)}&payment=${p.id}`;
        const s = await stripe("/checkout/sessions", "POST", {
          mode: "payment",
          line_items: { 0: { quantity: entryIds.length, price_data: { currency: "eur", unit_amount: fee,
            product_data: { name: `${show.name}: entry fee`.slice(0, 250), description: payer ? `Entries for ${payer}`.slice(0, 250) : undefined } } } },
          client_reference_id: p.id,
          customer_email: STAFF.includes(who.role) ? undefined : who.email,
          metadata: { payment_id: p.id, show: show.name.slice(0, 450) },
          payment_intent_data: { description: `${show.name}: ${entryIds.length} ${entryIds.length === 1 ? "entry" : "entries"}${payer ? " for " + payer : ""}`.slice(0, 1000) },
          success_url: back,
          cancel_url: back,
        });
        const { data: p2, error: ue } = await db.from("payments").update({ order_ref: s.id, checkout_url: s.url, state: "pending" })
          .eq("id", p.id).select().single();
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
