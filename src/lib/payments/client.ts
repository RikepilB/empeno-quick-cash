// Culqi (Peru-native payments) — server-side helpers.
//
// All functions transparently fall back to a deterministic DEMO mode when
// CULQI_SECRET_KEY is not present in the environment. That keeps the app
// runnable for prototype walkthroughs while the real keys are pending.
//
// Live calls hit the Culqi REST API at https://api.culqi.com/v2/. Their
// docs: https://docs.culqi.com/

type CulqiCharge = {
  id: string;
  amount: number;
  currency_code: string;
  outcome: { type: string; merchant_message?: string; user_message?: string };
  reference_code?: string;
  metadata?: Record<string, string>;
};

type CulqiSubscription = {
  id: string;
  plan_id: string;
  status: string;
  next_billing_date?: number;
};

const CULQI_BASE = "https://api.culqi.com/v2";

function secretKey(): string | null {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const k = proc?.env?.CULQI_SECRET_KEY;
  if (!k || typeof k !== "string" || k.length < 5) return null;
  return k;
}

export function isCulqiLive(): boolean {
  return secretKey() !== null;
}

async function culqiPost<T>(path: string, body: unknown): Promise<T> {
  const key = secretKey();
  if (!key) throw new Error("CULQI_SECRET_KEY missing");
  const res = await fetch(`${CULQI_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { merchant_message?: string; user_message?: string };
  if (!res.ok) {
    const msg = json?.merchant_message || json?.user_message || `Culqi ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

// ---------------------------------------------------------------------------
// chargeOnce — single charge using a Culqi token (from the in-page Checkout)
// ---------------------------------------------------------------------------
export async function chargeOnce(args: {
  token_id: string;
  amount_pen: number;
  email: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; status: "paid" | "failed" | "demo"; raw?: CulqiCharge }> {
  if (!isCulqiLive()) {
    return { id: `demo_charge_${cryptoRandomId()}`, status: "demo" };
  }
  const raw = await culqiPost<CulqiCharge>("/charges", {
    amount: args.amount_pen * 100, // Culqi expects centavos
    currency_code: "PEN",
    email: args.email,
    source_id: args.token_id,
    metadata: args.metadata,
  });
  const ok = raw.outcome?.type === "venta_exitosa";
  return { id: raw.id, status: ok ? "paid" : "failed", raw };
}

// ---------------------------------------------------------------------------
// createSubscription — Culqi recurring subscription tied to a Culqi plan code
// ---------------------------------------------------------------------------
export async function createSubscription(args: {
  token_id: string;
  culqi_plan_id: string;
  email: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; status: "active" | "demo"; raw?: CulqiSubscription }> {
  if (!isCulqiLive()) {
    return { id: `demo_sub_${cryptoRandomId()}`, status: "demo" };
  }
  const raw = await culqiPost<CulqiSubscription>("/subscriptions", {
    card_token: args.token_id,
    plan_id: args.culqi_plan_id,
    metadata: args.metadata,
  });
  return { id: raw.id, status: "active", raw };
}

// ---------------------------------------------------------------------------
// verifyWebhookSignature — Culqi sends an HMAC-SHA256 signature header.
// Reject events whose signature does not match the configured secret.
// ---------------------------------------------------------------------------
export async function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string,
): Promise<boolean> {
  const key = secretKey();
  if (!key) return false;
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(rawBody));
  const expected = bufferToHex(sigBuf);
  return timingSafeEqual(expected, receivedSignature.trim().toLowerCase());
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function cryptoRandomId(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
