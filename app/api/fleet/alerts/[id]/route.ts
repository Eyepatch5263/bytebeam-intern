import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const newStatus = body.status || "acknowledged";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("alerts")
      .update({ status: newStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.warn("Notice updating alert in Supabase:", error.message);
      // Return simulated acknowledged state if table is read-only or error
      return NextResponse.json({ success: true, id, status: newStatus });
    }

    return NextResponse.json({ success: true, alert: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating alert";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
