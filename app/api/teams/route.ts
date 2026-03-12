import { NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/cache";
import { normalizeColor } from "@/lib/team-config";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BasketballTrackerApp/1.0)" };
const TTL = 24 * 60 * 60 * 1000; // 24 hours

async function espnFetch<T>(url: string, cacheKey: string): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`ESPN API error ${res.status}`);
  const data = await res.json();
  setCached(cacheKey, data, TTL);
  return data as T;
}

// Hardcoded NCAAB conferences with ESPN group IDs (fallback if API returns nothing)
const FALLBACK_CONFERENCES = [
  { id: "1", name: "Atlantic Coast Conference", shortName: "ACC" },
  { id: "2", name: "Big 12 Conference", shortName: "Big 12" },
  { id: "3", name: "Atlantic 10 Conference", shortName: "A-10" },
  { id: "4", name: "Big East Conference", shortName: "Big East" },
  { id: "5", name: "Big South Conference", shortName: "Big South" },
  { id: "6", name: "Big West Conference", shortName: "Big West" },
  { id: "7", name: "Colonial Athletic Association", shortName: "CAA" },
  { id: "8", name: "Conference USA", shortName: "CUSA" },
  { id: "9", name: "Big Ten Conference", shortName: "Big Ten" },
  { id: "10", name: "Mid-American Conference", shortName: "MAC" },
  { id: "11", name: "Mountain West Conference", shortName: "MWC" },
  { id: "12", name: "Ivy League", shortName: "Ivy" },
  { id: "13", name: "Metro Atlantic Athletic Conference", shortName: "MAAC" },
  { id: "14", name: "Missouri Valley Conference", shortName: "MVC" },
  { id: "15", name: "MEAC", shortName: "MEAC" },
  { id: "17", name: "Northeast Conference", shortName: "NEC" },
  { id: "18", name: "Ohio Valley Conference", shortName: "OVC" },
  { id: "19", name: "Patriot League", shortName: "Patriot" },
  { id: "20", name: "Southeastern Conference", shortName: "SEC" },
  { id: "21", name: "Southern Conference", shortName: "SoCon" },
  { id: "22", name: "Southland Conference", shortName: "Southland" },
  { id: "23", name: "SWAC", shortName: "SWAC" },
  { id: "24", name: "Sun Belt Conference", shortName: "Sun Belt" },
  { id: "25", name: "West Coast Conference", shortName: "WCC" },
  { id: "26", name: "WAC", shortName: "WAC" },
  { id: "27", name: "American Athletic Conference", shortName: "AAC" },
  { id: "40", name: "America East Conference", shortName: "America East" },
  { id: "44", name: "Horizon League", shortName: "Horizon" },
  { id: "45", name: "Summit League", shortName: "Summit" },
  { id: "49", name: "Atlantic Sun Conference", shortName: "ASUN" },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conferenceId = searchParams.get("conference");

    if (conferenceId) {
      // Return teams for a specific conference
      const data = await espnFetch<{
        sports: Array<{
          leagues: Array<{
            teams: Array<{
              team: {
                id: string;
                displayName: string;
                shortDisplayName: string;
                logos: Array<{ href: string }>;
                color?: string;
                alternateColor?: string;
              };
            }>;
          }>;
        }>;
      }>(
        `${BASE}/teams?groups=${conferenceId}&limit=200`,
        `teams:${conferenceId}`
      );

      const teams = (data.sports?.[0]?.leagues?.[0]?.teams || [])
        .map(({ team }) => ({
          id: team.id,
          name: team.displayName,
          shortName: team.shortDisplayName,
          logo: team.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`,
          primaryColor: normalizeColor(team.color || "1a1a1a"),
          secondaryColor: normalizeColor(team.alternateColor || "333333"),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return NextResponse.json({ teams });
    } else {
      // Return list of conferences
      const data = await espnFetch<{
        sports: Array<{
          leagues: Array<{
            groups: Array<{
              groupId: string;
              name: string;
              shortName: string;
              children?: Array<{ groupId: string; name: string; shortName: string }>;
            }>;
          }>;
        }>;
      }>(
        `${BASE}/groups?ids=50`,
        "conferences"
      );

      const groups = data.sports?.[0]?.leagues?.[0]?.groups || [];
      // Groups may be top-level conferences or nested — flatten to leaf conferences
      const conferences: Array<{ id: string; name: string; shortName: string }> = [];
      for (const g of groups) {
        if (g.children && g.children.length > 0) {
          for (const child of g.children) {
            conferences.push({ id: child.groupId, name: child.name, shortName: child.shortName });
          }
        } else {
          conferences.push({ id: g.groupId, name: g.name, shortName: g.shortName });
        }
      }
      conferences.sort((a, b) => a.name.localeCompare(b.name));

      // Fall back to hardcoded list if ESPN API returns nothing
      return NextResponse.json({ conferences: conferences.length > 0 ? conferences : FALLBACK_CONFERENCES });
    }
  } catch {
    // On error, return hardcoded fallback for conferences (teams endpoint errors bubble normally)
    return NextResponse.json({ conferences: FALLBACK_CONFERENCES });
  }
}
