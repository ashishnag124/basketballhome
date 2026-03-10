import { NextResponse } from "next/server";
import { fetchTeamStats, fetchRoster } from "@/lib/espn";

export async function GET() {
  try {
    const [teamStats, players] = await Promise.all([fetchTeamStats(), fetchRoster()]);
    return NextResponse.json({ teamStats, players });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 502 });
  }
}
