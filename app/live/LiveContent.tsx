"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import PlayByPlayFeed from "@/components/live/PlayByPlayFeed";
import type { LiveGameData, NormalizedGame, LiveBoxScoreTeam } from "@/types/espn";
import type { TeamConfig } from "@/lib/team-config";

type LiveResponse =
  | { status: "live"; game: LiveGameData }
  | { status: "pre" | "post"; game: NormalizedGame }
  | { status: "no_game"; game: null }
  | { error: string };

const POLL_INTERVAL = 30_000;

function BoxScoreTable({ team }: { team: LiveBoxScoreTeam }) {
  const ptsIdx = team.columns.indexOf("PTS");
  const starters = team.players.filter((p) => p.starter && !p.didNotPlay);
  const bench = team.players.filter((p) => !p.starter && !p.didNotPlay);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Image src={team.teamLogo} alt={team.teamName} width={20} height={20} unoptimized />
        <span className={`text-xs font-bold uppercase ${team.isDuke ? "text-[var(--color-primary)]" : "text-gray-600"}`}>
          {team.teamName}
        </span>
        {team.isDuke && <span className="text-[10px] bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded font-bold">US</span>}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 py-2 font-semibold text-gray-500 sticky left-0 bg-gray-50 min-w-[120px]">PLAYER</th>
                {team.columns.map((col) => (
                  <th key={col} className="text-center px-2 py-2 font-semibold text-gray-500 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {starters.map((player) => (
                <tr key={player.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 sticky left-0 bg-white">
                    <Link href={`/player/${player.id}`} className="flex items-center gap-2 hover:text-[var(--color-primary)]">
                      {player.photo ? (
                        <Image src={player.photo} alt={player.name} width={24} height={24} className="rounded-full object-cover shrink-0" unoptimized />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] shrink-0">👤</div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-800 whitespace-nowrap">{player.name}</div>
                        <div className="text-gray-400">{player.position} · S</div>
                      </div>
                    </Link>
                  </td>
                  {player.stats.map((stat, i) => (
                    <td key={i} className={`text-center px-2 py-2 tabular-nums ${i === ptsIdx ? "font-bold text-[var(--color-primary)]" : "text-gray-700"}`}>
                      {stat}
                    </td>
                  ))}
                </tr>
              ))}
              {bench.length > 0 && (
                <tr>
                  <td colSpan={team.columns.length + 1} className="px-3 py-1 bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Bench</td>
                </tr>
              )}
              {bench.map((player) => (
                <tr key={player.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 sticky left-0 bg-white">
                    <Link href={`/player/${player.id}`} className="flex items-center gap-2 hover:text-[var(--color-primary)]">
                      {player.photo ? (
                        <Image src={player.photo} alt={player.name} width={24} height={24} className="rounded-full object-cover shrink-0" unoptimized />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] shrink-0">👤</div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-800 whitespace-nowrap">{player.name}</div>
                        <div className="text-gray-400">{player.position}</div>
                      </div>
                    </Link>
                  </td>
                  {player.stats.map((stat, i) => (
                    <td key={i} className={`text-center px-2 py-2 tabular-nums ${i === ptsIdx ? "font-bold text-[var(--color-primary)]" : "text-gray-700"}`}>
                      {stat}
                    </td>
                  ))}
                </tr>
              ))}
              {team.totals.length > 0 && (
                <tr className="bg-[var(--color-primary)]/5 border-t border-[var(--color-primary)]/20 font-bold">
                  <td className="px-3 py-2 text-[var(--color-secondary)] font-bold sticky left-0 bg-[var(--color-primary)]/5">TOTALS</td>
                  {team.totals.map((tot, i) => (
                    <td key={i} className="text-center px-2 py-2 text-[var(--color-secondary)] tabular-nums">{tot}</td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, our, opp }: { label: string; our: string; opp: string }) {
  return (
    <div className="flex items-center text-sm">
      <div className="flex-1 text-right font-medium text-[var(--color-primary)]">{our || "—"}</div>
      <div className="w-24 text-center text-xs text-gray-400 px-2">{label}</div>
      <div className="flex-1 text-left text-gray-600">{opp || "—"}</div>
    </div>
  );
}

export default function LiveContent({ teamConfig }: { teamConfig: TeamConfig }) {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      // Keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Checking for live games...</p>
        </div>
      </div>
    );
  }

  if (!data || "error" in data) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏀</div>
        <h1 className="text-xl font-bold text-[var(--color-secondary)] mb-2">Unable to load game data</h1>
        <p className="text-gray-500 mb-4">Check your connection and try again.</p>
        <button
          onClick={fetchData}
          className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[var(--color-secondary)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (data.status === "no_game") {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏀</div>
        <h1 className="text-2xl font-bold text-[var(--color-secondary)] font-['Oswald',sans-serif] mb-2">
          No Game Right Now
        </h1>
        <p className="text-gray-500 mb-6">
          {teamConfig.shortName} doesn&apos;t have a game in progress at the moment. Check the schedule for upcoming games.
        </p>
        <Link
          href="/schedule"
          className="inline-block bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-medium hover:bg-[var(--color-secondary)] transition-colors"
        >
          View Schedule
        </Link>
      </div>
    );
  }

  // Pre-game or post-game with NormalizedGame
  if (data.status === "pre" || data.status === "post") {
    const game = data.game as NormalizedGame;
    const isPre = data.status === "pre";
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">{isPre ? "⏰" : "🏁"}</div>
        {game.opponentLogo && (
          <Image
            src={game.opponentLogo}
            alt={game.opponent}
            width={60}
            height={60}
            className="mx-auto mb-3 object-contain"
            unoptimized
          />
        )}
        <h1 className="text-2xl font-bold text-[var(--color-secondary)] font-['Oswald',sans-serif] mb-1">
          {isPre ? "Game Coming Up" : "Final Score"}
        </h1>
        <p className="text-gray-600 mb-2">
          {isPre ? "vs. " : ""}{game.opponent}
        </p>
        {!isPre && game.dukeScore && (
          <div className="flex items-center justify-center gap-6 my-4">
            <div className="text-center">
              <div className="text-xs text-[var(--color-accent)] font-semibold uppercase mb-1">{teamConfig.shortName}</div>
              <div className="text-5xl font-bold font-['Oswald',sans-serif] text-[var(--color-primary)]">
                {game.dukeScore}
              </div>
            </div>
            <div className="text-gray-300 text-3xl">–</div>
            <div className="text-center">
              <div className="text-xs text-gray-400 font-semibold uppercase mb-1 truncate max-w-[80px]">
                {game.opponent}
              </div>
              <div className="text-5xl font-bold font-['Oswald',sans-serif] text-gray-600">
                {game.opponentScore}
              </div>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-400">{game.statusText}</p>
        <Link href="/schedule" className="inline-block mt-6 text-[var(--color-primary)] font-medium text-sm">
          View Full Schedule →
        </Link>
      </div>
    );
  }

  // Live game
  const liveGame = data.game as LiveGameData;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)] font-['Oswald',sans-serif]">
          Live Game
        </h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse-live inline-block" />
            LIVE
          </span>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Los_Angeles" })}
            </span>
          )}
        </div>
      </div>

      {/* Main score card */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl p-6 text-white">
        {/* Period & clock */}
        <div className="text-center mb-4">
          <span className="text-white/60 text-sm">{liveGame.statusText}</span>
        </div>

        {/* Scoreboard */}
        <div className="flex items-center justify-center gap-6">
          {/* Our team */}
          <div className="flex-1 text-center">
            <div className="text-xs text-[var(--color-accent)] font-bold uppercase tracking-wider mb-2">
              {liveGame.isHome ? "🏠 " : "✈️ "}{teamConfig.shortName}
            </div>
            <div className="text-6xl font-bold font-['Oswald',sans-serif] leading-none">
              {liveGame.dukeScore}
            </div>
          </div>

          <div className="text-center">
            <div className="text-white/30 text-4xl font-light">–</div>
          </div>

          {/* Opponent */}
          <div className="flex-1 text-center">
            {liveGame.opponentLogo && (
              <Image
                src={liveGame.opponentLogo}
                alt={liveGame.opponent}
                width={32}
                height={32}
                className="mx-auto mb-1 object-contain opacity-80"
                unoptimized
              />
            )}
            <div className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 truncate">
              {liveGame.opponent}
            </div>
            <div className="text-6xl font-bold font-['Oswald',sans-serif] leading-none text-white/70">
              {liveGame.opponentScore}
            </div>
          </div>
        </div>

        {/* Last play */}
        {liveGame.lastPlay && (
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-white/70 text-sm italic leading-snug">
              &ldquo;{liveGame.lastPlay}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Team stats comparison */}
      {Object.keys(liveGame.dukeStats).length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="flex-1 text-center text-xs font-bold text-[var(--color-primary)] uppercase">{teamConfig.shortName}</div>
            <div className="w-24 text-center text-xs text-gray-400 uppercase">Stat</div>
            <div className="flex-1 text-center text-xs text-gray-500 uppercase truncate">{liveGame.opponent}</div>
          </div>
          <div className="space-y-2">
            {[
              ["fieldGoalPct", "FG%"],
              ["threePointFieldGoalPct", "3PT%"],
              ["freeThrowPct", "FT%"],
              ["rebounds", "Rebounds"],
              ["assists", "Assists"],
              ["turnovers", "Turnovers"],
              ["steals", "Steals"],
            ]
              .filter(([key]) => liveGame.dukeStats[key] || liveGame.opponentStats[key])
              .map(([key, label]) => (
                <StatRow
                  key={key}
                  label={label}
                  our={liveGame.dukeStats[key] || "—"}
                  opp={liveGame.opponentStats[key] || "—"}
                />
              ))}
          </div>
        </div>
      )}

      {/* Play-by-play */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <PlayByPlayFeed plays={liveGame.recentPlays || []} teamId={teamConfig.id} />
      </div>

      {/* Box score */}
      {liveGame.boxScore && liveGame.boxScore.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Box Score</h2>
          {liveGame.boxScore.map((team) => (
            <BoxScoreTable key={team.teamId} team={team} />
          ))}
        </div>
      )}

      {/* Auto-refresh notice */}
      <p className="text-center text-xs text-gray-400">
        Auto-refreshing every 30 seconds
        <button
          onClick={fetchData}
          className="ml-2 text-[var(--color-primary)] font-medium hover:underline"
        >
          Refresh now
        </button>
      </p>
    </div>
  );
}
