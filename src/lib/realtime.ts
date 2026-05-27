import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/db/browser";

export function useSupabaseRealtime(
  table: string,
  filter: string | undefined,
  onChange: () => void,
): void {
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`rt:${table}:${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => onChange(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onChange]);
}
