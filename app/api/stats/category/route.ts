import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fetchCategoryBreakdown } from "@/lib/stats";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await fetchCategoryBreakdown(user.id);
  return NextResponse.json(data);
}
