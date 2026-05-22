// Culqi Checkout v4 (client-side, lazy-loaded). Opens the hosted modal,
// returns a Culqi card token. The server then turns that token into a charge.
//
// Live mode requires:
//   - VITE_CULQI_PUBLIC_KEY in the client env (.env.local)
//   - CULQI_SECRET_KEY in the server env (.dev.vars / wrangler secret)
//
// Demo mode (no keys) never imports this module.

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (s: Record<string, unknown>) => void;
      options?: (o: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      token?: { id: string };
      error?: { user_message?: string; merchant_message?: string };
    };
    culqi?: () => void;
  }
}

const SCRIPT_SRC = "https://checkout.culqi.com/js/v4";
let loaderPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    if (window.Culqi) return resolve();
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loaderPromise = null;
      reject(new Error("No se pudo cargar Culqi Checkout."));
    };
    document.head.appendChild(s);
  });
  return loaderPromise;
}

export function getCulqiPublicKey(): string | null {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const k = env?.VITE_CULQI_PUBLIC_KEY;
  return typeof k === "string" && k.length > 5 ? k : null;
}

export async function openCheckout(args: {
  amount_pen: number;
  plan_id: string;
  email?: string;
}): Promise<{ token_id: string } | null> {
  const publicKey = getCulqiPublicKey();
  if (!publicKey) throw new Error("Falta VITE_CULQI_PUBLIC_KEY.");
  await loadScript();
  const Culqi = window.Culqi;
  if (!Culqi) throw new Error("Culqi Checkout no disponible.");

  return new Promise((resolve, reject) => {
    Culqi.publicKey = publicKey;
    Culqi.settings({
      title: "EMPEÑALO",
      currency: "PEN",
      amount: Math.round(args.amount_pen * 100),
      description: `Plan ${args.plan_id}`,
      order: undefined,
    });
    Culqi.options?.({ style: { logo: undefined } });

    window.culqi = function culqiCb() {
      if (Culqi.token?.id) {
        Culqi.close();
        resolve({ token_id: Culqi.token.id });
      } else if (Culqi.error) {
        Culqi.close();
        reject(
          new Error(Culqi.error.user_message || Culqi.error.merchant_message || "Error de Culqi"),
        );
      } else {
        resolve(null);
      }
    };

    Culqi.open();
  });
}
