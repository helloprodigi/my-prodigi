"use client";
import { createClient } from "@/utils/supabase/client";

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signUp({ email, password });
}
