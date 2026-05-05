import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Lukee usean Supabase-taulun/näkymän rivimäärän exact-count -kyselyllä.
 *
 * - Käyttää react-query-cachetusta (5 min stale).
 * - Palauttaa Record<table, number | null>; null kun näkymä puuttuu tai
 *   anon-rooli ei pääse, jolloin UI näyttää staattisen fallbackin.
 */
export function useTableCounts(tables: string[]) {
  const queries = useQueries({
    queries: tables.map((t) => ({
      queryKey: ["table-count", t],
      staleTime: 5 * 60 * 1000,
      queryFn: async (): Promise<number | null> => {
        const { count, error } = await supabase
          .from(t)
          .select("*", { count: "exact", head: true });
        if (error) {
          console.warn(`[useTableCounts] ${t}: ${error.message}`);
          return null;
        }
        return count ?? null;
      },
    })),
  });

  const counts: Record<string, number | null> = {};
  const isLoading = queries.some((q) => q.isLoading);
  tables.forEach((t, i) => {
    counts[t] = (queries[i].data as number | null | undefined) ?? null;
  });
  return { counts, isLoading };
}
