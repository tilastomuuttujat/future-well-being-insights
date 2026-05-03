import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Geneerinen hook V-Signal-näkymien lukemiseen.
 *
 * - Käyttää @tanstack/react-query:tä cachetukseen (5 min stale).
 * - Palauttaa tuloksen tai tyhjän taulukon — ei heitä, jotta UI voi
 *   näyttää siistin "ei dataa" -tilan kun näkymä puuttuu projektista.
 */
export function useSignalView<T = Record<string, unknown>>(
  view: string,
  opts: {
    select?: string;
    filter?: (q: ReturnType<typeof supabase.from>) => any;
    limit?: number;
    enabled?: boolean;
  } = {}
) {
  const { select = "*", filter, limit = 5000, enabled = true } = opts;

  return useQuery<T[]>({
    queryKey: ["signal-view", view, select, limit],
    enabled,
    queryFn: async () => {
      let query: any = supabase.from(view).select(select).limit(limit);
      if (filter) query = filter(query);
      const { data, error } = await query;
      if (error) {
        // Näkymä saattaa puuttua — palauta tyhjä, mutta lokaa konsoliin
        console.warn(`[useSignalView] ${view}: ${error.message}`);
        return [];
      }
      return (data ?? []) as T[];
    },
  });
}
