import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPaths = [
  resolve(__dirname, "../../.env"),
  resolve(__dirname, "../../.env.local"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), ".env.local"),
];
envPaths.forEach(p => { if (existsSync(p)) dotenv.config({ path: p }); });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) throw new Error("SUPABASE_URL is missing. Check your .env file in the backend folder.");

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const supabaseAnon = createClient(
  SUPABASE_URL,
  ANON_KEY
);

export function supabaseWithToken(jwt) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
