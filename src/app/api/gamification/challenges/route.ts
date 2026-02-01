/**
 * API Route: Manage Challenges
 * GET /api/gamification/challenges - Get active challenges
 * POST /api/gamification/challenges - Join a challenge
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSSR } from "@/lib/supabase/server-ssr";
import { getActiveChallenges, joinChallenge } from "@/lib/gamification/service";

export async function GET() {
  try {
    const supabase = await getSupabaseSSR();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const challenges = await getActiveChallenges(user.id);

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error("[API] Challenges error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { challengeId, action } = body;

    if (!challengeId) {
      return NextResponse.json(
        { error: "Challenge ID required" },
        { status: 400 }
      );
    }

    if (action === "join") {
      const success = await joinChallenge(user.id, challengeId);

      if (!success) {
        return NextResponse.json(
          { error: "Failed to join challenge" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Challenges POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
