import { NextResponse } from "next/server";
import { fetchPregameData, fetchSchedule } from "@/lib/espn";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const games = await fetchSchedule();
    const game = games.find((g) => g.id === id);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const data = await fetchPregameData(id, game.opponentId);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
