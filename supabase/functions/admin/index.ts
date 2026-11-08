// Account control for admins (users.html). Everything that needs the service key happens here,
// so the key never reaches the browser. Every call checks that the caller is an admin first.
//
// Deploy (JWT verification on is fine, every call comes from a signed-in admin):
//   supabase functions deploy admin
//
// Calls from the site, all {action, ...}:
//   {action:"details", email}                       everything about one account: login, role, dogs, entries, payments
//   {action:"create",  email, name, role, password?} makes the login (confirmed, ready to use) and gives it a role.
//                                                    No password: one is made up and sent back once so the admin can pass it on.
//   {action:"update",  email, name?, role?, new_email?, password?, blocked?}
//        role "" takes them off the team (the login stays). new_email moves the login, the team row,
//        the dogs linked to them and their payments to the new email. blocked stops (or allows) signing in.
//   {action:"delete",  email}                       deletes the login and takes them off the team. Their dogs stay.
//   {action:"act",     email}                       a one-time sign-in token for that account, so the admin can use the site
//                                                    as them with full control (the site swaps back to the admin afterwards).
// Rules: an admin can't change their own role, block, delete or sign in as themselves, and the club always keeps one admin.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
class Say extends Error {}
const say = (m: string): never => { throw new Say(m); };

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const ROLES = ["admin", "organiser", "steward", "viewer", "owner"];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const clean = (e: unknown) => String(e || "").trim().toLowerCase();

async function caller(req: Request) {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await db.auth.getUser(jwt);
  const email = clean(data?.user?.email);
  if (!email) return null;
  const { data: m } = await db.from("team_members").select("role").eq("email", email).maybeSingle();
  return m ? { email, role: String(m.role) } : null;
}

// auth.users has no lookup by email in the admin API, so page through (the club has a handful of logins).
async function findUser(email: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find((x) => clean(x.email) === email);
    if (u) return u;
    if (data.users.length < 1000) return null;
  }
  return null;
}
async function member(email: string) {
  const { data, error } = await db.from("team_members").select("*").eq("email", email).maybeSingle();
  if (error) throw error;
  return data as { email: string; name: string; role: string; added_at: string } | null;
}
async function adminCount() {
  const { count, error } = await db.from("team_members").select("email", { count: "exact", head: true }).eq("role", "admin");
  if (error) throw error;
  return count || 0;
}
function makePassword() {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(b, (x) => abc[x % abc.length]).join("");
}
const loginOut = (u: any) => u ? {
  id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at || null,
  confirmed_at: u.email_confirmed_at || u.confirmed_at || null, phone: u.phone || "",
  providers: (u.app_metadata?.providers || [u.app_metadata?.provider]).filter(Boolean),
  blocked: !!(u.banned_until && new Date(u.banned_until) > new Date()), banned_until: u.banned_until || null,
} : null;

async function details(email: string) {
  const [u, m] = await Promise.all([findUser(email), member(email)]);
  if (!u && !m) say(`There's no account for ${email}.`);
  const { data: dogs, error: e1 } = await db.from("dogs").select("*").contains("owner_emails", [email]).order("name");
  if (e1) throw e1;
  const names = (dogs || []).map((d: any) => String(d.name));
  let entries: any[] = [];
  if (names.length) {
    // entries link to dogs by name (any case); fetch by the names, then match case-insensitively
    const { data, error } = await db.from("entries_view").select("*").order("created_at");
    if (error) throw error;
    const set = new Set(names.map((n) => n.toLowerCase()));
    entries = (data || []).filter((e: any) => set.has(String(e.dog_name).toLowerCase()) && !["Junior Handler", "Childrens Class"].includes(e.class));
  }
  const ids = entries.map((e) => e.id);
  const { data: pays, error: e2 } = await db.from("payments").select("id,show_id,entry_ids,payer,amount_cents,currency,state,mode,created_by,created_at,paid_at").order("created_at", { ascending: false }).limit(1000);
  if (e2) throw e2;
  const payments = (pays || []).filter((p: any) => p.created_by === email || (p.entry_ids || []).some((x: string) => ids.includes(x)));
  return { ok: true, login: loginOut(u), member: m, dogs: dogs || [], entries, payments };
}

async function setRole(me: string, email: string, role: string, name?: string) {
  const cur = await member(email);
  if (role === "") {
    if (!cur) return;
    if (email === me) say("You can't take yourself off the team.");
    if (cur.role === "admin" && (await adminCount()) <= 1) say("The club needs at least one admin.");
    const { error } = await db.from("team_members").delete().eq("email", email);
    if (error) throw error;
    return;
  }
  if (!ROLES.includes(role)) say("Pick a role.");
  if (email === me && role !== "admin") say("You can't take admin away from yourself. Ask another admin to do it.");
  if (cur?.role === "admin" && role !== "admin" && (await adminCount()) <= 1) say("The club needs at least one admin.");
  const row: Record<string, unknown> = { email, role };
  if (name !== undefined) row.name = name;
  else if (!cur) row.name = "";
  const { error } = await db.from("team_members").upsert(row, { onConflict: "email" });
  if (error) throw error;
}

async function create(me: string, d: any) {
  const email = clean(d.email), name = String(d.name || "").trim().slice(0, 120), role = String(d.role || "");
  if (!EMAIL.test(email)) say("Type a valid email.");
  if (!ROLES.includes(role)) say("Pick a role.");
  let password = String(d.password || "");
  const made = !password;
  if (made) password = makePassword();
  if (password.length < 6) say("The password needs at least 6 characters.");
  if (await findUser(email)) say(`${email} already has a login. Change their role in the list instead.`);
  const { error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: name ? { name } : {} });
  if (error) say(error.message);
  await setRole(me, email, role, name);
  return { ok: true, email, password: made ? password : undefined };
}

async function update(me: string, d: any) {
  const email = clean(d.email);
  if (!EMAIL.test(email)) say("That account wasn't found. Reload and try again.");
  let u = await findUser(email);
  const cur = await member(email);
  if (!u && !cur) say(`There's no account for ${email}.`);
  const name = d.name === undefined || d.name === null ? undefined : String(d.name).trim().slice(0, 120);
  // role and name
  if (d.role !== undefined && d.role !== null) await setRole(me, email, String(d.role), name);
  else if (name !== undefined) {
    if (cur) { const { error } = await db.from("team_members").update({ name }).eq("email", email); if (error) throw error; }
    if (u) await db.auth.admin.updateUserById(u.id, { user_metadata: { ...(u.user_metadata || {}), name } });
  }
  // password
  if (d.password) {
    if (!u) say(`${email} has no login yet. Make one first.`);
    if (String(d.password).length < 6) say("The password needs at least 6 characters.");
    const { error } = await db.auth.admin.updateUserById(u!.id, { password: String(d.password) });
    if (error) say(error.message);
  }
  // stop or allow signing in
  if (d.blocked === true || d.blocked === false) {
    if (!u) say(`${email} has no login.`);
    if (email === me && d.blocked) say("You can't block your own login.");
    const { error } = await db.auth.admin.updateUserById(u!.id, { ban_duration: d.blocked ? "876000h" : "none" });
    if (error) say(error.message);
  }
  // new email: the login, the team row, the dogs linked to them and the payments they made all move together
  let now = email;
  if (d.new_email && clean(d.new_email) !== email) {
    const ne = clean(d.new_email);
    if (!EMAIL.test(ne)) say("Type a valid new email.");
    if (email === me) say("Change your own email from your own login settings, not here.");
    if ((await findUser(ne)) || (await member(ne))) say(`${ne} is already used by another account.`);
    if (u) {
      const { error } = await db.auth.admin.updateUserById(u.id, { email: ne, email_confirm: true });
      if (error) say(error.message);
    }
    if (await member(email)) { const { error } = await db.from("team_members").update({ email: ne }).eq("email", email); if (error) throw error; }
    const { data: dogs, error: e1 } = await db.from("dogs").select("id,owner_emails").contains("owner_emails", [email]);
    if (e1) throw e1;
    for (const g of dogs || []) {
      const list = [...new Set((g.owner_emails as string[]).map((x) => x === email ? ne : x))];
      const { error } = await db.from("dogs").update({ owner_emails: list }).eq("id", g.id);
      if (error) throw error;
    }
    const r = await db.from("payments").update({ created_by: ne }).eq("created_by", email);
    if (r.error) throw r.error;
    now = ne;
  }
  return { ok: true, email: now, ...(await details(now)) };
}

async function remove(me: string, d: any) {
  const email = clean(d.email);
  if (email === me) say("You can't delete your own account.");
  const cur = await member(email);
  if (cur?.role === "admin" && (await adminCount()) <= 1) say("The club needs at least one admin.");
  const u = await findUser(email);
  if (u) { const { error } = await db.auth.admin.deleteUser(u.id); if (error) say(error.message); }
  if (cur) { const { error } = await db.from("team_members").delete().eq("email", email); if (error) throw error; }
  return { ok: true };
}

async function act(me: string, d: any) {
  const email = clean(d.email);
  if (email === me) say("That's you already.");
  const u = await findUser(email);
  if (!u) say(`${email} has no login yet. Make one first.`);
  if (loginOut(u)!.blocked) say(`${email} is blocked from signing in. Allow it first.`);
  // generateLink sends no email: it only hands back a one-time token that the site exchanges for a session.
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error) say(error.message);
  const token_hash = data?.properties?.hashed_token;
  if (!token_hash) say("Couldn't make a sign-in token for that account.");
  return { ok: true, email, token_hash };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const who = await caller(req);
    if (!who || who.role !== "admin") return reply({ ok: false, error: "Only admins can manage accounts." }, 403);
    const d = await req.json().catch(() => ({}));
    switch (d.action) {
      case "details": return reply(await details(clean(d.email)));
      case "create": return reply(await create(who.email, d));
      case "update": return reply(await update(who.email, d));
      case "delete": return reply(await remove(who.email, d));
      case "act": return reply(await act(who.email, d));
      default: return reply({ ok: false, error: "Unknown action." }, 400);
    }
  } catch (e) {
    if (e instanceof Say) return reply({ ok: false, error: e.message }, 400);
    console.error(e);
    return reply({ ok: false, error: (e as Error).message || "Something went wrong." }, 500);
  }
});
