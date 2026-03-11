import { getCached, setCached } from "./cache";
import type {
  EspnScheduleResponse,
  EspnRosterResponse,
  EspnScoreboardResponse,
  EspnGameSummaryResponse,
  NormalizedGame,
  NormalizedPlayer,
  NormalizedTeamStats,
  LiveGameData,
} from "@/types/espn";
import { formatHeight } from "./utils";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";
const DUKE_ID = "150";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; DukeBasketballApp/1.0)" };

async function espnFetch<T>(url: string, cacheKey: string, ttlMs: number): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url, { headers: HEADERS, next: { revalidate: ttlMs / 1000 } });
  if (!res.ok) throw new Error(`ESPN API error ${res.status}: ${url}`);
  const data = await res.json();
  setCached(cacheKey, data, ttlMs);
  return data as T;
}

export async function fetchRawSchedule(): Promise<EspnScheduleResponse> {
  return espnFetch<EspnScheduleResponse>(
    `${BASE}/teams/${DUKE_ID}/schedule`,
    "schedule",
    10 * 60 * 1000
  );
}

export async function fetchSchedule(): Promise<NormalizedGame[]> {
  const data = await fetchRawSchedule();
  return (data.events || []).map(normalizeGame);
}

export async function fetchRawRoster(): Promise<EspnRosterResponse> {
  return espnFetch<EspnRosterResponse>(
    `${BASE}/teams/${DUKE_ID}/roster`,
    "roster",
    60 * 60 * 1000
  );
}

export async function fetchRoster(): Promise<NormalizedPlayer[]> {
  const data = await fetchRawRoster();
  return (data.athletes || []).map((athlete) => ({
    id: athlete.id,
    name: athlete.displayName,
    jersey: athlete.jersey || "-",
    position: athlete.position?.abbreviation || "-",
    positionFull: athlete.position?.displayName || "-",
    height: athlete.displayHeight || (athlete.height ? formatHeight(athlete.height) : "-"),
    weight: athlete.displayWeight || (athlete.weight ? `${athlete.weight} lbs` : "-"),
    year: athlete.experience?.displayValue || "-",
    photo: athlete.headshot?.href || null,
    ppg: "-",
    rpg: "-",
    apg: "-",
    fgp: "-",
    hometown: athlete.birthPlace?.displayText || "-",
  }));
}

export async function fetchRawScoreboard(): Promise<EspnScoreboardResponse> {
  return espnFetch<EspnScoreboardResponse>(
    `${BASE}/scoreboard?groups=50&limit=100`,
    "scoreboard",
    20 * 1000
  );
}

export async function findDukeGame(): Promise<NormalizedGame | null> {
  try {
    const data = await fetchRawScoreboard();
    for (const event of data.events || []) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      const hasDuke = comp.competitors.some((c) => c.team.id === DUKE_ID);
      if (hasDuke) return normalizeGame(event);
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchLiveGameData(gameId: string): Promise<LiveGameData | null> {
  try {
    const data = await espnFetch<EspnGameSummaryResponse>(
      `${BASE}/summary?event=${gameId}`,
      `summary:${gameId}`,
      20 * 1000
    );

    const comp = data.header?.competitions?.[0];
    if (!comp) return null;

    const dukeComp = comp.competitors.find((c) => c.team.id === DUKE_ID);
    const oppComp = comp.competitors.find((c) => c.team.id !== DUKE_ID);
    if (!dukeComp || !oppComp) return null;

    const dukeTeamStats: Record<string, string> = {};
    const oppTeamStats: Record<string, string> = {};

    for (const team of data.boxscore?.teams || []) {
      const statsMap = Object.fromEntries(
        team.statistics.map((s) => [s.name, s.displayValue])
      );
      if (team.team.id === DUKE_ID) {
        Object.assign(dukeTeamStats, statsMap);
      } else {
        Object.assign(oppTeamStats, statsMap);
      }
    }

    const recentPlays = (data.plays || []).slice(-15).reverse();

    return {
      gameId,
      status: comp.status.type.state,
      period: comp.status.period,
      clock: comp.status.displayClock,
      statusText: comp.status.type.shortDetail,
      dukeScore: dukeComp.score || "0",
      opponentScore: oppComp.score || "0",
      opponent: oppComp.team.displayName,
      opponentLogo: oppComp.team.logo,
      isHome: dukeComp.homeAway === "home",
      venue: "",
      broadcastInfo: "",
      lastPlay: recentPlays[0]?.text || "",
      dukeStats: dukeTeamStats,
      opponentStats: oppTeamStats,
      recentPlays,
    };
  } catch {
    return null;
  }
}

export async function fetchTeamStats(): Promise<NormalizedTeamStats | null> {
  try {
    const [recordData, statsData] = await Promise.all([
      espnFetch<{ team: { record: { items: Array<{ summary: string; stats: Array<{ name: string; value: number }> }> } } }>(
        `${BASE}/teams/${DUKE_ID}?enable=roster,projection,stats`,
        "teamdetail",
        15 * 60 * 1000
      ),
      espnFetch<{ results: { stats: { categories: Array<{ name: string; stats: Array<{ name: string; displayValue: string; value: number }> }> } } }>(
        `${BASE}/teams/${DUKE_ID}/statistics`,
        "teamstats",
        15 * 60 * 1000
      ),
    ]);

    const record = recordData.team?.record?.items?.[0];
    if (!record) return null;
    const recStats = Object.fromEntries(record.stats.map((s) => [s.name, s.value]));

    // Flatten all stat categories into one map
    const allStats: Record<string, string> = {};
    for (const cat of statsData.results?.stats?.categories || []) {
      for (const s of cat.stats || []) {
        allStats[s.name] = s.displayValue;
      }
    }

    const n = (key: string) => parseFloat(allStats[key] || "0");

    return {
      record: record.summary,
      wins: recStats["wins"] || 0,
      losses: recStats["losses"] || 0,
      ppg: allStats["avgPoints"] || (recStats["avgPointsFor"] || 0).toFixed(1),
      oppPpg: (recStats["avgPointsAgainst"] || 0).toFixed(1),
      fgp: allStats["fieldGoalPct"] || "0.0",
      threePtp: allStats["threePointFieldGoalPct"] || "0.0",
      ftPct: allStats["freeThrowPct"] || "0.0",
      rpg: allStats["avgRebounds"] || "0.0",
      apg: allStats["avgAssists"] || "0.0",
      spg: allStats["avgSteals"] || "0.0",
      bpg: allStats["avgBlocks"] || "0.0",
      topg: allStats["avgTurnovers"] || "0.0",
    };
  } catch {
    return null;
  }
}

export async function fetchNextGame(): Promise<NormalizedGame | null> {
  try {
    const games = await fetchSchedule();
    return games.find((g) => g.status === "pre") || null;
  } catch {
    return null;
  }
}

// Safely extract a string from an ESPN value that may be a string or {value, displayValue} object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function espnStr(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    return String(v.displayValue ?? v.value ?? v.text ?? v.name ?? "");
  }
  return String(v);
}

// Normalize an ESPN event into our app's game shape
function normalizeGame(event: import("@/types/espn").EspnGame): NormalizedGame {
  const comp = event.competitions?.[0];
  if (!comp) {
    return {
      id: String(event.id),
      date: event.date,
      opponent: "TBD",
      opponentLogo: "",
      opponentId: "",
      isHome: true,
      venue: "",
      dukeScore: null,
      opponentScore: null,
      status: event.status?.type?.state || "pre",
      statusText: espnStr(event.status?.type?.shortDetail) || "",
      broadcastInfo: "",
      isWin: null,
      notes: "",
    };
  }

  const dukeComp = comp.competitors.find((c) => c.team.id === DUKE_ID);
  const oppComp = comp.competitors.find((c) => c.team.id !== DUKE_ID);

  const dukeScore = dukeComp?.score ? espnStr(dukeComp.score) : null;
  const oppScore = oppComp?.score ? espnStr(oppComp.score) : null;
  const isWin =
    comp.status.type.state === "post" && dukeScore && oppScore
      ? parseInt(dukeScore) > parseInt(oppScore)
      : null;

  // broadcasts[].names may be strings or objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastNames = comp.broadcasts?.[0]?.names?.map((n: any) => espnStr(n)) || [];
  const broadcasts = broadcastNames.join(", ");

  // notes headline can be a string or {value, displayValue} object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notesHeadline = espnStr((comp.notes as any)?.[0]?.headline ?? "");

  return {
    id: String(event.id),
    date: comp.date || event.date,
    opponent: espnStr(oppComp?.team?.displayName) || "TBD",
    opponentLogo: espnStr(oppComp?.team?.logo) || "",
    opponentId: espnStr(oppComp?.team?.id) || "",
    isHome: dukeComp?.homeAway === "home",
    venue: espnStr(comp.venue?.fullName) || "",
    dukeScore,
    opponentScore: oppScore,
    status: comp.status.type.state,
    statusText: espnStr(comp.status.type.shortDetail),
    broadcastInfo: broadcasts,
    isWin,
    notes: notesHeadline,
    period: comp.status.period,
    clock: comp.status.displayClock,
  };
}
