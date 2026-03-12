import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchTeamStats, fetchRoster } from "@/lib/espn";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
    const [teamStats, players] = await Promise.all([fetchTeamStats(tc.id), fetchRoster(tc.id)]);
    return NextResponse.json({ teamStats, players });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 502 });
  }
}
