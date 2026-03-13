import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeColor, TEAM_COOKIE } from "@/lib/team-config";
import type { TeamConfig } from "@/lib/team-config";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

/**
 * Build the correct public base URL regardless of deployment environment.
 *
 * In Railway (and other proxied deployments) `request.url` is the *internal*
 * server URL (e.g. http://localhost:3000/...) rather than the public URL.
 * The real host is forwarded via x-forwarded-host / x-forwarded-proto headers.
 */
function getPublicOrigin(request: Request): string {
  const forwHost = request.headers.get("x-forwarded-host");
  const forwProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwHost) return `${forwProto}://${forwHost}`;
  // Fallback — works fine in local dev where there is no proxy
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("id");

  const origin = getPublicOrigin(request);

  if (!teamId) {
    return NextResponse.redirect(`${origin}/`);
  }

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

    // Redirect to /?team={id} on the correct public domain
    return NextResponse.redirect(`${origin}/?team=${teamId}`);
  } catch {
    return NextResponse.redirect(`${origin}/`);
  }
}
