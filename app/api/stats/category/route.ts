import { fetchCategoryBreakdown } from "@/lib/stats";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Fetching category data for user:", user.id);
    const data = await fetchCategoryBreakdown(user.id);
    console.log("Category data result:", data);
    
    // Return the actual data from the database
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in category endpoint:", error);
    return NextResponse.json({ error: "Failed to fetch category data" }, { status: 500 });
  }
}
