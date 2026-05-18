// Culqi webhook receiver.
//
// Culqi POSTs events here when charges succeed / fail / get refunded.
// We verify the HMAC-SHA256 signature in the `culqi-signature` header,
// then update the matching invoice row.
//
// Configure the webhook URL in the Culqi dashboard:
//   https://<your-domain>/api/culqi-webhook
// Set the same secret as CULQI_SECRET_KEY.

import { createServerFileRoute } from "@tanstack/react-start/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/culqi";

type CulqiEvent = {
  type: string; // e.g. "charge.succeeded", "charge.failed", "charge.refunded"
  data: {
    id: string;
    metadata?: Record<string, string>;
    outcome?: { type: string };
  };
};

export const ServerRoute = createServerFileRoute("/api/culqi-webhook").methods({
  POST: async ({ request }) => {
    const raw = await request.text();
    const sig = request.headers.get("culqi-signature") ?? "";

    if (!sig) {
      return new Response(JSON.stringify({ error: "missing signature" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const valid = await verifyWebhookSignature(raw, sig);
    if (!valid) {
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    let event: CulqiEvent;
    try {
      event = JSON.parse(raw) as CulqiEvent;
    } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    const chargeId = event.data?.id;
    if (!chargeId) {
      return new Response(JSON.stringify({ ok: true, noop: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    let newStatus: "paid" | "failed" | "refunded" | null = null;
    if (event.type === "charge.succeeded") newStatus = "paid";
    else if (event.type === "charge.failed") newStatus = "failed";
    else if (event.type === "charge.refunded") newStatus = "refunded";

    if (newStatus) {
      const { error } = await admin
        .from("invoices")
        .update({
          status: newStatus,
          paid_at: newStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("culqi_charge_id", chargeId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, applied: newStatus }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  },
});
