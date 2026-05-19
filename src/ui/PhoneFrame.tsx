import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronLeft, LogOut } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/db/browser";
import { signOut } from "@/services/auth";

interface PhoneFrameProps {
  children: ReactNode;
  title?: string;
  back?: string;
  hideHeader?: boolean;
}

export function PhoneFrame({ children, title, back, hideHeader }: PhoneFrameProps) {
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    await getSupabaseBrowser().auth.signOut();
    await router.invalidate();
    await router.navigate({ to: "/app/login" });
  }

  return (
    <div className="min-h-screen w-full bg-background py-6 md:py-12">
      <div className="mx-auto w-full max-w-[420px] px-4">
        <div className="overflow-hidden rounded-[2.5rem] border border-border bg-surface shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-border bg-background/60 px-5 py-2.5 text-[11px] text-muted-foreground">
            <span className="font-semibold">9:41</span>
            <span className="font-display tracking-widest text-primary">EMPEÑALO</span>
            <span>100%</span>
          </div>

          {!hideHeader && (title || back) && (
            <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-4">
              {back && (
                <Link to={back} className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              )}
              {title && <h2 className="font-display text-xl font-bold uppercase tracking-wide">{title}</h2>}
            </div>
          )}

          <div className="min-h-[680px] bg-background">{children}</div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>Vista cliente · mobile</span>
          <span>·</span>
          <Link to="/negocio" className="text-primary hover:underline">Ver panel del negocio</Link>
          <span>·</span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            title="Cerrar sesión"
          >
            <LogOut className="h-3 w-3" /> Salir
          </button>
        </div>
      </div>
    </div>
  );
}
