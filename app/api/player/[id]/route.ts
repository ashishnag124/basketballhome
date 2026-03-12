import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchPlayerGameLog } from "@/lib/espn";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
    const data = await fetchPlayerGameLog(id, tc.id);
    if (!data) return NextResponse.json({ error: "Player not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Player gamelog API error:", err);
    return NextResponse.json({ error: "Failed to fetch player data" }, { status: 502 });
  }
}
