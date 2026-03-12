import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchSchedule } from "@/lib/espn";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
    const games = await fetchSchedule(tc.id);
    return NextResponse.json(games);
  } catch (err) {
    console.error("Schedule API error:", err);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 502 });
  }
}
