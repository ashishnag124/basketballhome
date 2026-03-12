import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { findTeamGame, fetchLiveGameData } from "@/lib/espn";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);

    const game = await findTeamGame(tc.id);
    if (!game) {
      return NextResponse.json({ status: "no_game", game: null });
    }

    if (game.status === "in") {
      const liveData = await fetchLiveGameData(game.id, tc.id);
      return NextResponse.json({ status: "live", game: liveData || game });
    }

    return NextResponse.json({ status: game.status, game });
  } catch (err) {
    console.error("Live API error:", err);
    return NextResponse.json({ error: "Failed to fetch live data" }, { status: 502 });
  }
}
