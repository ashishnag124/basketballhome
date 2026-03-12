import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchLiveGameData } from "@/lib/espn";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
    const data = await fetchLiveGameData(id, tc.id);
    if (!data) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Game summary API error:", err);
    return NextResponse.json({ error: "Failed to fetch game data" }, { status: 502 });
  }
}
