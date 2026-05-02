import { createClient } from "@supabase/supabase-js";

/**
 * V-Signal Supabase -asiakas.
 *
 * Käytämme samaa julkista projektia kuin v_signal-4.html:n alkuperäinen
 * prototyyppi. Anon-key on tarkoitettu julkiseen käyttöön ja kannan RLS
 * suojaa kirjoitukset. Kun siirrymme Lovable Cloud -hallintaan, nämä
 * vakiot vaihdetaan ympäristömuuttujiin.
 */
const SUPABASE_URL = "https://yjkabgtbcgvrfqtewtna.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqa2FiZ3RiY2d2cmZxdGV3dG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDc0MDYsImV4cCI6MjA5MjUyMzQwNn0.pvJK5WLz-uPzl9Zrk37mXFhdcFXbq2azI0UHaay4Tug";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
