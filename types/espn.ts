export interface EspnTeam {
  id: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  record?: {
    items: Array<{
      summary: string;
      stats: Array<{ name: string; value: number }>;
    }>;
  };
}

export interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  team: EspnTeam;
  score?: string;
  winner?: boolean;
  statistics?: Array<{ name: string; displayValue: string; abbreviation: string }>;
  leaders?: Array<{
    name: string;
    displayName: string;
    leaders: Array<{
      displayValue: string;
      athlete: { displayName: string; headshot?: { href: string } };
    }>;
  }>;
  records?: Array<{ name: string; summary: string }>;
}

export interface EspnGameStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    id: string;
    name: string;
    state: "pre" | "in" | "post";
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

export interface EspnGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: { year: number; type: number; slug: string };
  competitions: Array<{
    id: string;
    date: string;
    attendance?: number;
    venue?: { fullName: string; address?: { city: string; state: string } };
    competitors: EspnCompetitor[];
    status: EspnGameStatus;
    notes?: Array<{ type: string; headline: string }>;
    broadcasts?: Array<{ names: string[] }>;
    situation?: {
      lastPlay?: { text: string; athletesInvolved?: Array<{ displayName: string }> };
      downDistanceText?: string;
      possession?: string;
    };
  }>;
  status: EspnGameStatus;
}

export interface EspnScheduleResponse {
  team: EspnTeam;
  events: EspnGame[];
}

export interface EspnRosterAthlete {
  id: string;
  displayName: string;
  fullName: string;
  shortName: string;
  jersey?: string;
  position: { abbreviation: string; displayName: string };
  height?: number;
  displayHeight?: string;
  weight?: number;
  displayWeight?: string;
  experience?: { displayValue: string; years: number };
  headshot?: { href: string; alt: string };
  statistics?: Array<{ name: string; displayValue: string; abbreviation: string }>;
  birthPlace?: { city: string; state: string; country: string; displayText: string };
  dateOfBirth?: string;
}

export interface EspnRosterResponse {
  team: EspnTeam;
  athletes: EspnRosterAthlete[];
  coach?: Array<{ id: string; firstName: string; lastName: string; experience: number }>;
}

export interface EspnScoreboardResponse {
  events: EspnGame[];
}

export interface EspnPlay {
  id: string;
  text: string;
  clock: { displayValue: string };
  period: { number: number };
  team?: { id: string };
  homeScore?: number;
  awayScore?: number;
  type?: { id: string; text: string };
}

export interface EspnGameSummaryResponse {
  boxscore?: {
    teams: Array<{
      team: EspnTeam;
      statistics: Array<{ name: string; displayValue: string; label: string }>;
    }>;
    players?: Array<{
      team: EspnTeam;
      statistics: Array<{
        names: string[];
        totals?: string[];
        athletes: Array<{
          athlete: {
            id: string;
            displayName: string;
            jersey?: string;
            headshot?: { href: string };
            position?: { abbreviation: string };
          };
          stats: string[];
          active: boolean;
          starter?: boolean;
          didNotPlay?: boolean;
        }>;
      }>;
    }>;
  };
  plays?: EspnPlay[];
  header?: {
    competitions: Array<{
      date?: string;
      competitors: EspnCompetitor[];
      status: EspnGameStatus;
      venue?: { fullName: string };
    }>;
  };
}

// Normalized types for our app
export interface NormalizedGame {
  id: string;
  date: string;
  opponent: string;
  opponentLogo: string;
  opponentId: string;
  isHome: boolean;
  venue: string;
  dukeScore: string | null;
  opponentScore: string | null;
  status: "pre" | "in" | "post";
  statusText: string;
  broadcastInfo: string;
  isWin: boolean | null;
  notes: string;
  period?: number;
  clock?: string;
}

export interface NormalizedPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  positionFull: string;
  height: string;
  weight: string;
  year: string;
  photo: string | null;
  ppg: string;
  rpg: string;
  apg: string;
  fgp: string;
  hometown: string;
}

export interface NormalizedTeamStats {
  record: string;
  wins: number;
  losses: number;
  ppg: string;
  oppPpg: string;
  fgp: string;
  threePtp: string;
  ftPct: string;
  rpg: string;
  apg: string;
  spg: string;
  bpg: string;
  topg: string;
}

export interface LiveBoxScorePlayer {
  id: string;
  name: string;
  jersey: string;
  photo: string;
  position: string;
  starter: boolean;
  didNotPlay: boolean;
  stats: string[];
}

export interface LiveBoxScoreTeam {
  teamName: string;
  teamId: string;
  teamLogo: string;
  isDuke: boolean;
  columns: string[];
  players: LiveBoxScorePlayer[];
  totals: string[];
}

export interface LiveGameData {
  gameId: string;
  status: "pre" | "in" | "post";
  period: number;
  clock: string;
  statusText: string;
  dukeScore: string;
  opponentScore: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  venue: string;
  broadcastInfo: string;
  lastPlay: string;
  dukeStats: Record<string, string>;
  opponentStats: Record<string, string>;
  recentPlays: EspnPlay[];
  boxScore?: LiveBoxScoreTeam[];
}
