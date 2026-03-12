import { getCached, setCached } from "./cache";
import type {
  EspnScheduleResponse,
  EspnRosterResponse,
  EspnRosterAthlete,
  EspnScoreboardResponse,
  EspnGameSummaryResponse,
  NormalizedGame,
  NormalizedPlayer,
  NormalizedTeamStats,
  LiveGameData,
} from "@/types/espn";
import { formatHeight } from "./utils";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";
const WEB_BASE = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BasketballTrackerApp/1.0)" };

async function espnFetch<T>(url: string, cacheKey: string, ttlMs: number): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url, { headers: HEADERS, next: { revalidate: ttlMs / 1000 } });
  if (!res.ok) throw new Error(`ESPN API error ${res.status}: ${url}`);
  const data = await res.json();
  setCached(cacheKey, data, ttlMs);
  return data as T;
}

export async function fetchRawSchedule(teamId: string): Promise<EspnScheduleResponse> {
  return espnFetch<EspnScheduleResponse>(
    `${BASE}/teams/${teamId}/schedule`,
    `schedule:${teamId}`,
    10 * 60 * 1000
  );
}

export async function fetchSchedule(teamId: string): Promise<NormalizedGame[]> {
  const data = await fetchRawSchedule(teamId);
  return (data.events || []).map((e) => normalizeGame(e, teamId));
}

export async function fetchRawRoster(teamId: string): Promise<EspnRosterResponse> {
  return espnFetch<EspnRosterResponse>(
    `${BASE}/teams/${teamId}/roster`,
    `roster:${teamId}`,
    60 * 60 * 1000
  );
}

async function fetchAthleteStats(athleteId: string): Promise<{ ppg: string; rpg: string; apg: string; fgp: string }> {
  try {
    const data = await espnFetch<{ categories: Array<{ name: string; totals: string[] }> }>(
      `${WEB_BASE}/athletes/${athleteId}/stats?season=2025&seasontype=2&per=perGame`,
      `playerstats:${athleteId}`,
      15 * 60 * 1000
    );
    const avgs = data.categories?.find((c) => c.name === "averages");
    const tots = avgs?.totals || [];
    return {
      ppg: tots[17] || "-",
      rpg: tots[11] || "-",
      apg: tots[12] || "-",
      fgp: tots[4] ? `${tots[4]}%` : "-",
    };
  } catch {
    return { ppg: "-", rpg: "-", apg: "-", fgp: "-" };
  }
}

export async function fetchRoster(teamId: string): Promise<NormalizedPlayer[]> {
  const data = await fetchRawRoster(teamId);
  const athletes = data.athletes || [];
  const statsArr = await Promise.all(athletes.map((a) => fetchAthleteStats(a.id)));
  return athletes.map((athlete, i) => ({
    id: athlete.id,
    name: athlete.displayName,
    jersey: athlete.jersey || "-",
    position: athlete.position?.abbreviation || "-",
    positionFull: athlete.position?.displayName || "-",
    height: athlete.displayHeight || (athlete.height ? formatHeight(athlete.height) : "-"),
    weight: athlete.displayWeight || (athlete.weight ? `${athlete.weight} lbs` : "-"),
    year: athlete.experience?.displayValue || "-",
    photo: athlete.headshot?.href || null,
    ppg: statsArr[i].ppg,
    rpg: statsArr[i].rpg,
    apg: statsArr[i].apg,
    fgp: statsArr[i].fgp,
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

export async function findTeamGame(teamId: string): Promise<NormalizedGame | null> {
  try {
    const data = await fetchRawScoreboard();
    for (const event of data.events || []) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      const hasTeam = comp.competitors.some((c) => c.team.id === teamId);
      if (hasTeam) return normalizeGame(event, teamId);
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchLiveGameData(gameId: string, teamId: string): Promise<LiveGameData | null> {
  try {
    const data = await espnFetch<EspnGameSummaryResponse>(
      `${BASE}/summary?event=${gameId}`,
      `summary:${gameId}`,
      20 * 1000
    );

    const comp = data.header?.competitions?.[0];
    if (!comp) return null;

    const ourComp = comp.competitors.find((c) => c.team.id === teamId);
    const oppComp = comp.competitors.find((c) => c.team.id !== teamId);
    if (!ourComp || !oppComp) return null;

    const ourTeamStats: Record<string, string> = {};
    const oppTeamStats: Record<string, string> = {};

    for (const team of data.boxscore?.teams || []) {
      const statsMap = Object.fromEntries(
        team.statistics.map((s) => [s.name, s.displayValue])
      );
      if (team.team.id === teamId) {
        Object.assign(ourTeamStats, statsMap);
      } else {
        Object.assign(oppTeamStats, statsMap);
      }
    }

    const recentPlays = (data.plays || []).slice(-15).reverse();

    const boxScore = (data.boxscore?.players || []).map((teamData) => {
      const isOurTeam = teamData.team.id === teamId;
      const statTable = teamData.statistics?.[0];
      return {
        teamName: teamData.team.displayName,
        teamId: teamData.team.id,
        teamLogo: teamData.team.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamData.team.id}.png`,
        isDuke: isOurTeam,
        columns: statTable?.names || [],
        totals: statTable?.totals || [],
        players: (statTable?.athletes || []).map((entry) => ({
          id: String(entry.athlete?.id || ""),
          name: entry.athlete?.displayName || "",
          jersey: entry.athlete?.jersey || "",
          photo: entry.athlete?.headshot?.href || "",
          position: entry.athlete?.position?.abbreviation || "",
          starter: entry.starter ?? false,
          didNotPlay: entry.didNotPlay ?? false,
          stats: entry.stats || [],
        })),
      };
    });

    return {
      gameId,
      status: comp.status.type.state,
      period: comp.status.period,
      clock: comp.status.displayClock,
      statusText: comp.status.type.shortDetail,
      dukeScore: ourComp.score || "0",
      opponentScore: oppComp.score || "0",
      opponent: oppComp.team.displayName,
      opponentLogo: oppComp.team.logo,
      isHome: ourComp.homeAway === "home",
      venue: "",
      broadcastInfo: "",
      lastPlay: recentPlays[0]?.text || "",
      dukeStats: ourTeamStats,
      opponentStats: oppTeamStats,
      recentPlays,
      boxScore,
    };
  } catch {
    return null;
  }
}

export async function fetchTeamStats(teamId: string): Promise<NormalizedTeamStats | null> {
  try {
    const [recordData, statsData] = await Promise.all([
      espnFetch<{ team: { record: { items: Array<{ summary: string; stats: Array<{ name: string; value: number }> }> } } }>(
        `${BASE}/teams/${teamId}?enable=roster,projection,stats`,
        `teamdetail:${teamId}`,
        15 * 60 * 1000
      ),
      espnFetch<{ results: { stats: { categories: Array<{ name: string; stats: Array<{ name: string; displayValue: string; value: number }> }> } } }>(
        `${BASE}/teams/${teamId}/statistics`,
        `teamstats:${teamId}`,
        15 * 60 * 1000
      ),
    ]);

    const record = recordData.team?.record?.items?.[0];
    if (!record) return null;
    const recStats = Object.fromEntries(record.stats.map((s) => [s.name, s.value]));

    const allStats: Record<string, string> = {};
    for (const cat of statsData.results?.stats?.categories || []) {
      for (const s of cat.stats || []) {
        allStats[s.name] = s.displayValue;
      }
    }

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

export async function fetchNextGame(teamId: string): Promise<NormalizedGame | null> {
  try {
    const games = await fetchSchedule(teamId);
    return games.find((g) => g.status === "pre") || null;
  } catch {
    return null;
  }
}

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

export async function fetchGameBoxScore(gameId: string, teamId: string): Promise<{
  gameId: string;
  date: string;
  status: string;
  statusText: string;
  dukeScore: string;
  opponentScore: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  venue: string;
  teams: Array<{
    teamName: string;
    teamId: string;
    teamLogo: string;
    isDuke: boolean;
    columns: string[];
    players: Array<{
      id: string;
      name: string;
      jersey: string;
      photo: string;
      position: string;
      starter: boolean;
      didNotPlay: boolean;
      stats: string[];
    }>;
    totals: string[];
  }>;
} | null> {
  try {
    const data = await espnFetch<EspnGameSummaryResponse>(
      `${BASE}/summary?event=${gameId}`,
      `boxscore:${gameId}`,
      60 * 1000
    );

    const comp = data.header?.competitions?.[0];
    if (!comp) return null;

    const ourComp = comp.competitors.find((c) => c.team.id === teamId);
    const oppComp = comp.competitors.find((c) => c.team.id !== teamId);
    if (!ourComp || !oppComp) return null;

    const teams = (data.boxscore?.players || []).map((teamData) => {
      const isOurTeam = teamData.team.id === teamId;
      const statTable = teamData.statistics?.[0];
      const columns: string[] = statTable?.names || [];
      const totals: string[] = statTable?.totals || [];

      const players = (statTable?.athletes || []).map((entry) => ({
        id: String(entry.athlete?.id || ""),
        name: entry.athlete?.displayName || "",
        jersey: entry.athlete?.jersey || "",
        photo: entry.athlete?.headshot?.href || "",
        position: entry.athlete?.position?.abbreviation || "",
        starter: entry.starter ?? false,
        didNotPlay: entry.didNotPlay ?? false,
        stats: entry.stats || [],
      }));

      return {
        teamName: teamData.team.displayName,
        teamId: teamData.team.id,
        teamLogo: teamData.team.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamData.team.id}.png`,
        isDuke: isOurTeam,
        columns,
        players,
        totals,
      };
    });

    return {
      gameId,
      date: comp.date || "",
      status: comp.status.type.state,
      statusText: comp.status.type.shortDetail || "",
      dukeScore: espnStr(ourComp.score) || "0",
      opponentScore: espnStr(oppComp.score) || "0",
      opponent: espnStr(oppComp.team.displayName),
      opponentLogo: espnStr(oppComp.team.logo) || `https://a.espncdn.com/i/teamlogos/ncaa/500/${oppComp.team.id}.png`,
      isHome: ourComp.homeAway === "home",
      venue: espnStr(comp.venue?.fullName) || "",
      teams,
    };
  } catch {
    return null;
  }
}

export async function fetchPlayerGameLog(playerId: string, teamId: string): Promise<{
  columns: string[];
  totals: string[];
  games: Array<{
    gameId: string;
    date: string;
    opponent: string;
    opponentLogo: string;
    isHome: boolean;
    result: string;
    score: string;
    stats: string[];
  }>;
} | null> {
  try {
    const data = await espnFetch<{
      labels: string[];
      totals: string[];
      events: Record<string, {
        atVs: string;
        gameDate: string;
        score: string;
        homeTeamId: string;
        gameResult: string;
        opponent: { displayName: string; logo: string };
        team: { id: string };
      }>;
      seasonTypes: Array<{
        categories: Array<{
          events: Array<{ eventId: string; stats: string[] }>;
        }>;
      }>;
    }>(
      `${WEB_BASE}/athletes/${playerId}/gamelog`,
      `gamelog:${playerId}`,
      10 * 60 * 1000
    );

    const columns = data.labels || [];
    const totals = data.totals || [];
    const eventsMeta = data.events || {};
    const statEvents = data.seasonTypes?.[0]?.categories?.[0]?.events || [];

    const games = statEvents
      .map((se) => {
        const meta = eventsMeta[se.eventId];
        if (!meta) return null;
        const isHome = meta.homeTeamId === teamId;
        return {
          gameId: se.eventId,
          date: meta.gameDate,
          opponent: meta.opponent?.displayName || "Unknown",
          opponentLogo: meta.opponent?.logo || "",
          isHome,
          result: meta.gameResult || "",
          score: meta.score || "",
          stats: se.stats,
        };
      })
      .filter(Boolean) as Array<{
        gameId: string;
        date: string;
        opponent: string;
        opponentLogo: string;
        isHome: boolean;
        result: string;
        score: string;
        stats: string[];
      }>;

    return { columns, totals, games };
  } catch {
    return null;
  }
}

export async function fetchAthleteBasicInfo(athleteId: string): Promise<NormalizedPlayer | null> {
  try {
    const data = await espnFetch<{ athlete: EspnRosterAthlete }>(
      `${WEB_BASE}/athletes/${athleteId}`,
      `athleteinfo:${athleteId}`,
      60 * 60 * 1000
    );
    const a = data.athlete;
    if (!a) return null;
    const stats = await fetchAthleteStats(athleteId);
    return {
      id: a.id,
      name: a.displayName,
      jersey: a.jersey || "-",
      position: a.position?.abbreviation || "-",
      positionFull: a.position?.displayName || "-",
      height: a.displayHeight || (a.height ? formatHeight(a.height) : "-"),
      weight: a.displayWeight || (a.weight ? `${a.weight} lbs` : "-"),
      year: a.experience?.displayValue || "-",
      photo: a.headshot?.href || null,
      ppg: stats.ppg,
      rpg: stats.rpg,
      apg: stats.apg,
      fgp: stats.fgp,
      hometown: a.birthPlace?.displayText || "-",
    };
  } catch {
    return null;
  }
}

export async function fetchOpponentRoster(teamId: string): Promise<NormalizedPlayer[]> {
  try {
    const data = await espnFetch<EspnRosterResponse>(
      `${BASE}/teams/${teamId}/roster`,
      `roster:${teamId}`,
      60 * 60 * 1000
    );
    const athletes = data.athletes || [];
    const statsArr = await Promise.all(athletes.map((a) => fetchAthleteStats(a.id)));
    return athletes.map((athlete, i) => ({
      id: athlete.id,
      name: athlete.displayName,
      jersey: athlete.jersey || "-",
      position: athlete.position?.abbreviation || "-",
      positionFull: athlete.position?.displayName || "-",
      height: athlete.displayHeight || (athlete.height ? formatHeight(athlete.height) : "-"),
      weight: athlete.displayWeight || (athlete.weight ? `${athlete.weight} lbs` : "-"),
      year: athlete.experience?.displayValue || "-",
      photo: athlete.headshot?.href || null,
      ppg: statsArr[i].ppg,
      rpg: statsArr[i].rpg,
      apg: statsArr[i].apg,
      fgp: statsArr[i].fgp,
      hometown: athlete.birthPlace?.displayText || "-",
    }));
  } catch {
    return [];
  }
}

export async function fetchOpponentStats(teamId: string): Promise<NormalizedTeamStats | null> {
  try {
    const [recordData, statsData] = await Promise.all([
      espnFetch<{ team: { record: { items: Array<{ summary: string; stats: Array<{ name: string; value: number }> }> } } }>(
        `${BASE}/teams/${teamId}?enable=roster,projection,stats`,
        `teamdetail:${teamId}`,
        15 * 60 * 1000
      ),
      espnFetch<{ results: { stats: { categories: Array<{ name: string; stats: Array<{ name: string; displayValue: string; value: number }> }> } } }>(
        `${BASE}/teams/${teamId}/statistics`,
        `oppstats:${teamId}`,
        15 * 60 * 1000
      ),
    ]);

    const record = recordData.team?.record?.items?.[0];
    if (!record) return null;
    const recStats = Object.fromEntries(record.stats.map((s) => [s.name, s.value]));
    const allStats: Record<string, string> = {};
    for (const cat of statsData.results?.stats?.categories || []) {
      for (const s of cat.stats || []) {
        allStats[s.name] = s.displayValue;
      }
    }
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

export async function fetchPregameData(gameId: string, opponentId: string, teamId: string): Promise<{
  odds: { spread: string; overUnder: string; homeMoneyline: string; awayMoneyline: string; provider: string } | null;
  winProbability: { dukeChance: number; oppChance: number; oppName: string; dukeName: string } | null;
  opponentStats: NormalizedTeamStats | null;
}> {
  const [summaryResult, oppStatsResult] = await Promise.allSettled([
    espnFetch<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pickcenter?: any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      predictor?: any;
      header?: EspnGameSummaryResponse["header"];
    }>(`${BASE}/summary?event=${gameId}`, `pregame:${gameId}`, 5 * 60 * 1000),
    fetchOpponentStats(opponentId),
  ]);

  let odds = null;
  let winProbability = null;

  if (summaryResult.status === "fulfilled") {
    const summary = summaryResult.value;

    const pick = summary.pickcenter?.[0];
    if (pick) {
      const comp = summary.header?.competitions?.[0];
      const ourComp = comp?.competitors.find((c) => c.team.id === teamId);
      const oppComp = comp?.competitors.find((c) => c.team.id !== teamId);
      const ourIsHome = ourComp?.homeAway === "home";
      const ourOdds = ourIsHome ? pick.homeTeamOdds : pick.awayTeamOdds;
      const oppOdds = ourIsHome ? pick.awayTeamOdds : pick.homeTeamOdds;
      const homeMoneyline = ourIsHome
        ? (ourOdds?.moneyLine != null ? (ourOdds.moneyLine > 0 ? `+${ourOdds.moneyLine}` : String(ourOdds.moneyLine)) : "N/A")
        : (oppOdds?.moneyLine != null ? (oppOdds.moneyLine > 0 ? `+${oppOdds.moneyLine}` : String(oppOdds.moneyLine)) : "N/A");
      const awayMoneyline = ourIsHome
        ? (oppOdds?.moneyLine != null ? (oppOdds.moneyLine > 0 ? `+${oppOdds.moneyLine}` : String(oppOdds.moneyLine)) : "N/A")
        : (ourOdds?.moneyLine != null ? (ourOdds.moneyLine > 0 ? `+${ourOdds.moneyLine}` : String(ourOdds.moneyLine)) : "N/A");
      odds = {
        spread: pick.details || "N/A",
        overUnder: pick.overUnder != null ? String(pick.overUnder) : "N/A",
        homeMoneyline,
        awayMoneyline,
        provider: pick.provider?.name || "ESPN BET",
      };
      void oppComp;
    }

    const predictor = summary.predictor;
    if (predictor?.homeTeam && predictor?.awayTeam) {
      const comp = summary.header?.competitions?.[0];
      const ourComp = comp?.competitors.find((c) => c.team.id === teamId);
      const ourIsHome = ourComp?.homeAway === "home";
      const ourTeam = ourIsHome ? predictor.homeTeam : predictor.awayTeam;
      const oppTeam = ourIsHome ? predictor.awayTeam : predictor.homeTeam;
      const ourChance = parseFloat(ourTeam?.gameProjection ?? "") || (100 - (parseFloat(oppTeam?.gameProjection ?? "") || 50));
      const oppChance = parseFloat(oppTeam?.gameProjection ?? "") || (100 - ourChance);
      winProbability = {
        dukeChance: Math.round(ourChance),
        oppChance: Math.round(oppChance),
        oppName: oppTeam?.name || "Opponent",
        dukeName: ourTeam?.name || "Our Team",
      };
    }
  }

  return {
    odds,
    winProbability,
    opponentStats: oppStatsResult.status === "fulfilled" ? oppStatsResult.value : null,
  };
}

// Normalize an ESPN event into our app's game shape
function normalizeGame(event: import("@/types/espn").EspnGame, teamId: string): NormalizedGame {
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

  const ourComp = comp.competitors.find((c) => c.team.id === teamId);
  const oppComp = comp.competitors.find((c) => c.team.id !== teamId);

  const ourScore = ourComp?.score ? espnStr(ourComp.score) : null;
  const oppScore = oppComp?.score ? espnStr(oppComp.score) : null;
  const isWin =
    comp.status.type.state === "post" && ourScore && oppScore
      ? parseInt(ourScore) > parseInt(oppScore)
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastNames = comp.broadcasts?.[0]?.names?.map((n: any) => espnStr(n)) || [];
  const broadcasts = broadcastNames.join(", ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notesHeadline = espnStr((comp.notes as any)?.[0]?.headline ?? "");

  return {
    id: String(event.id),
    date: comp.date || event.date,
    opponent: espnStr(oppComp?.team?.displayName) || "TBD",
    opponentLogo: espnStr(oppComp?.team?.logo) || "",
    opponentId: espnStr(oppComp?.team?.id) || "",
    isHome: ourComp?.homeAway === "home",
    venue: espnStr(comp.venue?.fullName) || "",
    dukeScore: ourScore,
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
