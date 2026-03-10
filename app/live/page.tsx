"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import PlayByPlayFeed from "@/components/live/PlayByPlayFeed";
import type { LiveGameData, NormalizedGame } from "@/types/espn";

type LiveResponse =
  | { status: "live"; game: LiveGameData }
  | { status: "pre" | "post"; game: NormalizedGame }
  | { status: "no_game"; game: null }
  | { error: string };

const POLL_INTERVAL = 30_000;

function StatRow({ label, duke, opp }: { label: string; duke: string; opp: string }) {
  return (
    <div className="flex items-center text-sm">
      <div className="flex-1 text-right font-medium text-[#003087]">{duke || "—"}</div>
      <div className="w-24 text-center text-xs text-gray-400 px-2">{label}</div>
      <div className="flex-1 text-left text-gray-600">{opp || "—"}</div>
    </div>
  );
}

export default function LivePage() {
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
          <div className="h-10 w-10 border-4 border-gray-200 border-t-[#003087] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Checking for live games...</p>
        </div>
      </div>
    );
  }

  if (!data || "error" in data) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏀</div>
        <h1 className="text-xl font-bold text-[#001A57] mb-2">Unable to load game data</h1>
        <p className="text-gray-500 mb-4">Check your connection and try again.</p>
        <button
          onClick={fetchData}
          className="bg-[#003087] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#001A57] transition-colors"
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
        <h1 className="text-2xl font-bold text-[#001A57] font-['Oswald',sans-serif] mb-2">
          No Game Right Now
        </h1>
        <p className="text-gray-500 mb-6">
          Duke doesn&apos;t have a game in progress at the moment. Check the schedule for upcoming games.
        </p>
        <Link
          href="/schedule"
          className="inline-block bg-[#003087] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#001A57] transition-colors"
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
        <h1 className="text-2xl font-bold text-[#001A57] font-['Oswald',sans-serif] mb-1">
          {isPre ? "Game Coming Up" : "Final Score"}
        </h1>
        <p className="text-gray-600 mb-2">
          {isPre ? "vs. " : ""}{game.opponent}
        </p>
        {!isPre && game.dukeScore && (
          <div className="flex items-center justify-center gap-6 my-4">
            <div className="text-center">
              <div className="text-xs text-[#B5A36A] font-semibold uppercase mb-1">Duke</div>
              <div className="text-5xl font-bold font-['Oswald',sans-serif] text-[#003087]">
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
        <Link href="/schedule" className="inline-block mt-6 text-[#003087] font-medium text-sm">
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
        <h1 className="text-2xl font-bold text-[#001A57] font-['Oswald',sans-serif]">
          Live Game
        </h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse-live inline-block" />
            LIVE
          </span>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Main score card */}
      <div className="bg-gradient-to-br from-[#003087] to-[#001A57] rounded-2xl p-6 text-white">
        {/* Period & clock */}
        <div className="text-center mb-4">
          <span className="text-white/60 text-sm">{liveGame.statusText}</span>
        </div>

        {/* Scoreboard */}
        <div className="flex items-center justify-center gap-6">
          {/* Duke */}
          <div className="flex-1 text-center">
            <div className="text-xs text-[#B5A36A] font-bold uppercase tracking-wider mb-2">
              {liveGame.isHome ? "🏠 " : "✈️ "}Duke
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
            <div className="flex-1 text-center text-xs font-bold text-[#003087] uppercase">Duke</div>
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
                  duke={liveGame.dukeStats[key] || "—"}
                  opp={liveGame.opponentStats[key] || "—"}
                />
              ))}
          </div>
        </div>
      )}

      {/* Play-by-play */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <PlayByPlayFeed plays={liveGame.recentPlays || []} />
      </div>

      {/* Auto-refresh notice */}
      <p className="text-center text-xs text-gray-400">
        Auto-refreshing every 30 seconds
        <button
          onClick={fetchData}
          className="ml-2 text-[#003087] font-medium hover:underline"
        >
          Refresh now
        </button>
      </p>
    </div>
  );
}
