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

      return NextResponse.json({ conferences });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
