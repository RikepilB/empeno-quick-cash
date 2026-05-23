import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "empenalo-cookie-banner-dismissed";

function isEnhancedPrivacyBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  return (
    ua.includes("Firefox") ||
    ua.includes("Safari") ||
    ua.includes("iPhone") ||
    ua.includes("iPad") ||
    ua.includes("Edg")
  );
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!isEnhancedPrivacyBrowser()) return;

    // Delay slightly so the banner doesn't flash on fast loads
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border border-primary/30 bg-surface p-4 shadow-lg md:bottom-6 md:left-1/2 md:-translate-x-1/2">
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm">
          <p className="font-semibold">Este sitio usa cookies para funcionar.</p>
          <p className="mt-1 text-muted-foreground">
            Si usas navegadores como Firefox o Safari, es posible que necesites permitir cookies de
            terceros. En Firefox, haz clic en el escudo de la barra de direcciones y desactiva la
            protección contra rastreo para este sitio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setVisible(false);
          }}
          className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
