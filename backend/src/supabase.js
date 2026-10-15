import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.warn(
    "[wrapmate] SUPABASE_URL or SUPABASE_SERVICE_KEY is not set. Set them in .env"
  );
}

export const supabase = createClient(url ?? "", serviceKey ?? "", {
  auth: { persistSession: false },
});

export async function nextCounter(name) {
  const { data, error } = await supabase
    .from("counters")
    .select("value")
    .eq("name", name)
    .single();
  if (error) throw error;

  const next = (data?.value ?? 0) + 1;
  const { error: updateError } = await supabase
    .from("counters")
    .update({ value: next })
    .eq("name", name);
  if (updateError) throw updateError;

  return next;
}
