import { NextResponse } from "next/server";
import { fetchSchedule } from "@/lib/espn";

export async function GET() {
  try {
    const games = await fetchSchedule();
    return NextResponse.json(games);
  } catch (err) {
    console.error("Schedule API error:", err);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 502 });
  }
}
