import { createClient } from "@supabase/supabase-js";

let _client = null;

export function getSupabase() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// Proxy so existing imports work: supabase.from(...)
export const supabase = new Proxy({}, {
  get(_, prop) {
    return (...args) => getSupabase()[prop](...args);
  },
});
