// ============================================================================
// SunCash checkout (V1 — Merchant Key) — Supabase Edge Function
//   POST /suncash              -> creates a SunCash checkout, returns { url }
//   GET  /suncash/<ref>/<b64>  -> SunCash redirects here after payment; we mark
//                                 the booking paid, then send the customer to a
//                                 thank-you page.
//
// Set these as Edge Function secrets (Dashboard > Edge Functions > Secrets):
//   SUNCASH_ENV       = "prod"   (or "dev" for testing)
//   SUNCASH_KEY       = your SunCash Merchant Key
//   SUNCASH_MERCHANT  = your SunCash Merchant Name
//   SITE_URL          = https://aquaholicadventurebahamas.com
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.)
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ENV = (Deno.env.get("SUNCASH_ENV") || "prod").toLowerCase();
const PAY_URL = ENV === "dev"
  ? "http://dev.mysuncash.com/api/checkout.php"
  : "https://prod.mysuncash.com/api/checkout.php";
const SITE_URL = Deno.env.get("SITE_URL") || "https://aquaholicadventurebahamas.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function form(params: Record<string, string>) {
  const b = new URLSearchParams();
  for (const k in params) b.append(k, params[k]);
  return b.toString();
}
function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // ---------- CALLBACK  (GET /suncash/<ref>/<base64>) ---------------------
    if (req.method === "GET") {
      const segs = new URL(req.url).pathname.split("/").filter(Boolean);
      const i = segs.indexOf("suncash");
      const ourRef = i >= 0 ? (segs[i + 1] || "") : "";
      const b64 = i >= 0 ? (segs[i + 2] || "") : "";
      let status = "unknown";
      try {
        const parts = atob(decodeURIComponent(b64)).split("||");
        status = (parts[parts.length - 2] || "").toLowerCase(); // ...||status||method
      } catch (_) { /* ignore */ }

      if (status === "success" && ourRef) {
        await admin().from("bookings").update({ payment_status: "paid" }).eq("ref", ourRef);
      }
      const dest = `${SITE_URL}/checkout-success.html?ref=${encodeURIComponent(ourRef)}&status=${encodeURIComponent(status)}`;
      return new Response(null, { status: 302, headers: { ...cors, Location: dest } });
    }

    // ---------- CREATE CHECKOUT  (POST /suncash) ----------------------------
    const { ref, amount, tour } = await req.json();
    if (!ref || !amount) {
      return new Response(JSON.stringify({ error: "Missing ref/amount" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const amt = Number(amount).toFixed(2);
    const callback = `${Deno.env.get("SUPABASE_URL")}/functions/v1/suncash/${encodeURIComponent(ref)}`;

    const pay = await fetch(PAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({
        method: "payment",
        P01: Deno.env.get("SUNCASH_KEY")!,        // Merchant Key
        P02: Deno.env.get("SUNCASH_MERCHANT")!,   // Merchant Name
        P03: amt,                                 // Total (deposit)
        P04: ref,                                 // Our order id
        P05: callback,                            // Return URL
        P06: `Deposit ${tour || "Booking"}|1|${amt}`,
      }),
    }).then((r) => r.json());

    const url = pay?.ResponseMessage?.url;
    const scRef = pay?.ResponseMessage?.reference_id;
    if (!url) {
      return new Response(JSON.stringify({ error: "SunCash checkout failed", detail: pay }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (scRef) await admin().from("bookings").update({ payment_ref: String(scRef) }).eq("ref", ref);
    return new Response(JSON.stringify({ url }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
