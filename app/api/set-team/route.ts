import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeColor, TEAM_COOKIE } from "@/lib/team-config";
import type { TeamConfig } from "@/lib/team-config";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("id");
  if (!teamId) return NextResponse.redirect(new URL("/", request.url));

  try {
    const res = await fetch(`${BASE}/teams/${teamId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BasketballTrackerApp/1.0)" },
    });
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const t = data.team;

    const config: TeamConfig = {
      id: t.id,
      name: t.displayName,
      shortName: t.shortDisplayName || t.abbreviation || t.displayName,
      primaryColor: normalizeColor(t.color || "003087"),
      secondaryColor: normalizeColor(t.alternateColor || t.color || "001A57"),
      accentColor: normalizeColor(t.alternateColor || "B5A36A"),
      logo: t.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/ncaa/500/${t.id}.png`,
    };

    const cookieStore = await cookies();
    cookieStore.set(TEAM_COOKIE, JSON.stringify(config), {
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });

    // Redirect to /?team={id} so the URL stays bookmarkable
    return NextResponse.redirect(new URL(`/?team=${teamId}`, request.url));
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
