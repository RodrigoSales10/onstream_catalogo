import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://siooqwcxgmilrtnolyoc.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTE3OTksImV4cCI6MjEwNTc4Nzc5OX0.-IRcvyaKrYBJoL9iNuV3dSuSuZb_a-QiLJMhY69OSVs";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
