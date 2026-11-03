// Reads an uploaded catalogue (spreadsheet text, photos or PDF) with Claude and returns the entries.
// Needs the secret ANTHROPIC_API_KEY (Supabase dashboard > Edge Functions > Secrets). Only signed-in users can call it.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MODEL = "claude-sonnet-5-5";
const GROUPS = ["Utility", "Hound", "Gundog", "Toy", "Working", "Terrier", "Pastoral"];
const CLASSES = ["Puppy Dog", "Puppy Bitch", "Junior Dog", "Junior Bitch", "Open Dog", "Open Bitch", "Veteran Dog", "Veteran Bitch", "AV Locally Bred", "Junior Handler", "Childrens Class"];
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return reply({ ok: false, error: "The Claude API key isn't set up yet. Add ANTHROPIC_API_KEY under Edge Functions > Secrets in Supabase." });
    const d = await req.json();
    const files = d.files || [];
    if (!files.length) return reply({ ok: false, error: "Add a file first." });
    const content: unknown[] = [];
    for (const f of files) {
      if (f.kind === "text") content.push({ type: "text", text: `File: ${f.name || "spreadsheet"}\n\n${String(f.data).slice(0, 400000)}` });
      else if (f.kind === "image") content.push({ type: "image", source: { type: "base64", media_type: f.mediaType || "image/jpeg", data: f.data } });
      else if (f.kind === "pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
    }
    content.push({ type: "text", text: [
      "These files are entries for a dog show run by the Maltese National Canine Federation (MNCF). They may be a spreadsheet, a printed show catalogue, or photos of catalogue pages.",
      "Record every entry with the record_entries tool. One entry is one dog in one class. A dog entered in two classes (for example Open Bitch and AV Locally Bred) is two entries, usually with different ring numbers.",
      "Classes must be one of: " + CLASSES.join(", ") + ". Catalogue class codes: PD Puppy Dog, PB Puppy Bitch, JD Junior Dog, JB Junior Bitch, OD Open Dog, OB Open Bitch, VD Veteran Dog, VB Veteran Bitch, AVLB AV Locally Bred. In catalogues a dog's sex follows its date of birth as D or B.",
      "Junior Handler and Childrens Class entries are people, not dogs: put the person's name in dog_name and leave breed empty.",
      "Keep dog names exactly as printed, including titles like Ch. or Sh.Ch. Use the breed names below when they match; otherwise write the breed as printed and give its group.",
      "Known breeds and groups: " + String(d.breeds || ""),
      "Groups: " + GROUPS.join(", ") + ".",
      "Leave a field empty when the document doesn't show it. Don't guess ring numbers. If something is unclear, still record the entry and explain in note.",
      "If the documents show the show's name, date, venue or judge, fill in show.",
    ].join("\n") });
    const tool = {
      name: "record_entries",
      description: "Record the show details and every entry found in the documents.",
      input_schema: {
        type: "object",
        properties: {
          show: { type: "object", properties: { name: { type: "string" }, date: { type: "string" }, venue: { type: "string" }, judge: { type: "string" } } },
          entries: { type: "array", items: { type: "object", properties: {
            ring_no: { type: "string" }, dog_name: { type: "string" }, breed: { type: "string" },
            group: { type: "string", enum: [...GROUPS, ""] }, sex: { type: "string", enum: ["Dog", "Bitch", ""] },
            class: { type: "string", enum: CLASSES }, date_of_birth: { type: "string", description: "YYYY-MM-DD" },
            owner: { type: "string" }, phone: { type: "string" }, address: { type: "string" },
            breeder: { type: "string" }, sire: { type: "string" }, dam: { type: "string" }, note: { type: "string" },
          }, required: ["dog_name", "class"] } },
        },
        required: ["entries"],
      },
    };
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL, max_tokens: 32000,
        system: "Answer only by calling the record_entries tool once, with everything you found. Don't reply with plain text.",
        tools: [tool], tool_choice: { type: "auto" },
        messages: [{ role: "user", content }],
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) return reply({ ok: false, error: "Claude didn't accept the API key. Check ANTHROPIC_API_KEY in Supabase secrets." });
    if (res.status === 429 || res.status === 529) return reply({ ok: false, error: "Claude is busy right now. Try again in a minute." });
    if (res.status === 413) return reply({ ok: false, error: "The upload is too big. Try fewer pages or smaller photos." });
    if (!res.ok) return reply({ ok: false, error: `Claude couldn't read the file (${res.status}): ${body?.error?.message || "unknown error"}` });
    let input = (body.content || []).find((c: { type: string; name?: string }) => c.type === "tool_use" && c.name === "record_entries")?.input;
    if (!input) {
      const text = (body.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n");
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { input = JSON.parse(m[0]); } catch { /* ignore */ } }
    }
    if (!input) return reply({ ok: false, error: "Claude didn't return any entries. Try a clearer file." });
    return reply({ ok: true, show: input.show || {}, entries: input.entries || [], truncated: body.stop_reason === "max_tokens", usage: body.usage || {} });
  } catch (e) {
    return reply({ ok: false, error: "Something went wrong reading the files: " + (e instanceof Error ? e.message : String(e)) });
  }
});
