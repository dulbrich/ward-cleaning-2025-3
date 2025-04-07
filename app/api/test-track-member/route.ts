import { testTrackWardMember } from "@/app/app/tools/test-db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    if (!body.member) {
      return NextResponse.json({ error: 'No member data provided' }, { status: 400 });
    }
    
    // Test tracking the member
    const result = await testTrackWardMember(body.member);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error testing member tracking:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      success: false
    }, { status: 500 });
  }
} 