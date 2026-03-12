import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchRoster } from "@/lib/espn";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
    const players = await fetchRoster(tc.id);
    return NextResponse.json(players);
  } catch (err) {
    console.error("Roster API error:", err);
    return NextResponse.json({ error: "Failed to fetch roster" }, { status: 502 });
  }
}
