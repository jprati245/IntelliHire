import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: roles } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  const results: { email: string | undefined; user_id: string }[] = [];
  for (const r of roles ?? []) {
    const { data } = await admin.auth.admin.getUserById(r.user_id);
    results.push({ user_id: r.user_id, email: data.user?.email });
  }
  return new Response(JSON.stringify({ admins: results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
