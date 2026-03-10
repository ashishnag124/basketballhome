import { NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/cache";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; DukeBasketballApp/1.0)" };

export async function GET() {
  try {
    const cached = getCached("tournament");
    if (cached) return NextResponse.json(cached);

    const res = await fetch(`${BASE}/tournaments`, { headers: HEADERS });
    if (!res.ok) throw new Error(`ESPN error ${res.status}`);
    const data = await res.json();

    // Filter for NCAA Tournament
    const tournaments = data.tournaments || [];
    const ncaaTournament = tournaments.find(
      (t: { name?: string; slug?: string }) =>
        t.name?.toLowerCase().includes("ncaa") ||
        t.slug?.toLowerCase().includes("ncaa") ||
        t.name?.toLowerCase().includes("march madness")
    );

    const result = { tournament: ncaaTournament || null, all: tournaments };
    setCached("tournament", result, 5 * 60 * 1000);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Tournament API error:", err);
    return NextResponse.json({ tournament: null, all: [] }, { status: 200 });
  }
}
