import { fetchCategoryBreakdown } from "@/lib/stats";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await fetchCategoryBreakdown(user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch category breakdown", error);
    return NextResponse.json(
      { error: "Failed to fetch category breakdown" },
      { status: 500 },
    );
  }
}
