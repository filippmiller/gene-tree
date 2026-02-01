/**
 * API Route: Get Family Leaderboard
 * GET /api/gamification/leaderboard
 *
 * Returns the family leaderboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSSR } from "@/lib/supabase/server-ssr";
import { getLeaderboard } from "@/lib/gamification/service";
import type { LeaderboardPeriod } from "@/lib/gamification/types";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "all") as LeaderboardPeriod;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    const leaderboard = await getLeaderboard(user.id, period, limit);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("[API] Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
