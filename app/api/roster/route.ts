import { NextResponse } from "next/server";
import { fetchRoster } from "@/lib/espn";

export async function GET() {
  try {
    const players = await fetchRoster();
    return NextResponse.json(players);
  } catch (err) {
    console.error("Roster API error:", err);
    return NextResponse.json({ error: "Failed to fetch roster" }, { status: 502 });
  }
}
