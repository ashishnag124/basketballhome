import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchPregameData, fetchSchedule } from "@/lib/espn";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);

    const games = await fetchSchedule(tc.id);
    const game = games.find((g) => g.id === id);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const data = await fetchPregameData(id, game.opponentId, tc.id);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
