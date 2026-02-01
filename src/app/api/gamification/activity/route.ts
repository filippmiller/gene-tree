/**
 * API Route: Record Gamification Activity
 * POST /api/gamification/activity
 *
 * Records user activity for gamification (points, streaks, badges)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSSR } from "@/lib/supabase/server-ssr";
import { recordActivity } from "@/lib/gamification/service";
import type { ActionType } from "@/lib/gamification/types";

const VALID_ACTION_TYPES: ActionType[] = [
  "photo_upload",
  "photo_tag",
  "story_write",
  "story_respond",
  "voice_story_record",
  "invite_send",
  "invite_accepted",
  "relative_add",
  "comment_add",
  "reaction_add",
  "profile_update",
  "profile_photo_set",
  "bio_write",
  "daily_login",
  "daily_streak_bonus",
  "milestone_reached",
  "tribute_create",
  "interview_elder",
];

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
    const { actionType, actionId, description } = body;

    if (!actionType || !VALID_ACTION_TYPES.includes(actionType)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }

    const result = await recordActivity(
      user.id,
      actionType as ActionType,
      actionId,
      description
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to record activity" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Gamification activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
