import { NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/cache";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BasketballTrackerApp/1.0)" };
const TTL = 24 * 60 * 60 * 1000; // 24 hours

interface EspnTeamEntry {
  id: string;
  displayName: string;
  shortDisplayName: string;
  logos?: Array<{ href: string }>;
}

interface EspnConferenceChild {
  name: string;
  abbreviation: string;
  teams: EspnTeamEntry[];
}

interface EspnGroupsResponse {
  groups: Array<{
    name: string;
    children: EspnConferenceChild[];
  }>;
}

async function espnFetch<T>(url: string, cacheKey: string): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`ESPN API error ${res.status}`);
  const data = await res.json();
  setCached(cacheKey, data, TTL);
  return data as T;
}

export async function GET() {
  try {
    // ESPN groups?ids=50 returns actual per-conference team lists under groups[0].children
    // Each child has: { name, abbreviation, teams: [{ id, displayName, shortDisplayName, logos }] }
    // NOTE: teams?groups=N with any N returns ALL teams — that endpoint ignores the group filter.
    // We must use the groups endpoint and filter client-side.
    const data = await espnFetch<EspnGroupsResponse>(
      `${BASE}/groups?ids=50`,
      "conferences-with-teams"
    );

    const children: EspnConferenceChild[] = data?.groups?.[0]?.children ?? [];

    const conferences = children
      .map((conf) => ({
        id: conf.abbreviation.toLowerCase(), // e.g. "acc", "big12", "sec"
        name: conf.name,
        shortName: conf.abbreviation,
        teams: conf.teams
          .map((t) => ({
            id: t.id,
            name: t.displayName,
            shortName: t.shortDisplayName,
            logo:
              t.logos?.[0]?.href ||
              `https://a.espncdn.com/i/teamlogos/ncaa/500/${t.id}.png`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ conferences });
  } catch (err) {
    return NextResponse.json({ error: String(err), conferences: [] }, { status: 500 });
  }
}
