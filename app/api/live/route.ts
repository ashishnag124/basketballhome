import { NextResponse } from "next/server";
import { findDukeGame, fetchLiveGameData } from "@/lib/espn";

export async function GET() {
  try {
    const game = await findDukeGame();
    if (!game) {
      return NextResponse.json({ status: "no_game", game: null });
    }

    if (game.status === "in") {
      const liveData = await fetchLiveGameData(game.id);
      return NextResponse.json({ status: "live", game: liveData || game });
    }

    return NextResponse.json({ status: game.status, game });
  } catch (err) {
    console.error("Live API error:", err);
    return NextResponse.json({ error: "Failed to fetch live data" }, { status: 502 });
  }
}
