/**
 * API Route: Get Gamification Stats
 * GET /api/gamification/stats
 *
 * Returns user's gamification statistics
 */

import { NextResponse } from "next/server";
import { getSupabaseSSR } from "@/lib/supabase/server-ssr";
import { getGamificationStats } from "@/lib/gamification/service";

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

    const stats = await getGamificationStats(user.id);

    if (!stats) {
      // Return default stats if none exist
      return NextResponse.json({
        current_streak: 0,
        longest_streak: 0,
        total_points: 0,
        weekly_points: 0,
        monthly_points: 0,
        rank_in_family: 0,
        total_family_members: 0,
        badges_earned: 0,
        challenges_completed: 0,
        active_challenges: 0,
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API] Gamification stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
