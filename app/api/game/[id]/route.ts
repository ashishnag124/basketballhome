import { NextResponse } from "next/server";
import { fetchLiveGameData } from "@/lib/espn";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await fetchLiveGameData(id);
    if (!data) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Game summary API error:", err);
    return NextResponse.json({ error: "Failed to fetch game data" }, { status: 502 });
  }
}
