import Link from "next/link";
import { findDukeGame, fetchSchedule, fetchTeamStats } from "@/lib/espn";
import LiveGameBanner from "@/components/live/LiveGameBanner";
import NextGameCard from "@/components/live/NextGameCard";
import { isToday } from "@/lib/utils";

export const revalidate = 30;

export default async function HomePage() {
  const [game, games, teamStats] = await Promise.allSettled([
    findDukeGame(),
    fetchSchedule(),
    fetchTeamStats(),
  ]);

  const currentGame = game.status === "fulfilled" ? game.value : null;
  const allGames = games.status === "fulfilled" ? games.value : [];
  const stats = teamStats.status === "fulfilled" ? teamStats.value : null;

  const isLive = currentGame?.status === "in";
  const isGameToday = currentGame?.status === "pre" && isToday(currentGame.date);

  // Find next upcoming game if no current game
  const nextGame = !currentGame
    ? allGames.find((g) => g.status === "pre") || null
    : null;

  // Recent results
  const recentResults = allGames
    .filter((g) => g.status === "post")
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#B5A36A]">
            Duke Blue Devils
          </p>
          <h1 className="text-3xl font-bold text-[#001A57] font-['Oswald',sans-serif] mt-0.5">
            Men&apos;s Basketball
          </h1>
        </div>
        {stats && (
          <div className="text-right">
            <div className="text-2xl font-bold text-[#003087] font-['Oswald',sans-serif]">
              {stats.record}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Season Record</div>
          </div>
        )}
      </div>

      {/* Live game banner */}
      {isLive && currentGame && <LiveGameBanner game={currentGame} />}

      {/* Today's game (pre-game) */}
      {!isLive && isGameToday && currentGame && (
        <NextGameCard game={currentGame} isToday />
      )}

      {/* Next upcoming game */}
      {!isLive && !isGameToday && nextGame && (
        <NextGameCard game={nextGame} />
      )}

      {/* Stats snapshot */}
      {stats && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Season Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "PPG", value: stats.ppg },
              { label: "Opp PPG", value: stats.oppPpg },
              { label: "RPG", value: stats.rpg },
              { label: "APG", value: stats.apg },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className="text-xl font-bold text-[#003087] font-['Oswald',sans-serif]">
                  {s.value}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent results */}
      {recentResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Recent Results
            </h2>
            <Link href="/schedule" className="text-xs text-[#003087] font-medium">
              Full schedule →
            </Link>
          </div>
          <div className="space-y-2">
            {recentResults.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    g.isWin ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {g.isWin ? "W" : "L"}
                </span>
                <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                  {g.isHome ? "vs. " : "@ "}
                  {g.opponent}
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {g.dukeScore}–{g.opponentScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          Explore
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/schedule", label: "Schedule", icon: "📅", desc: "All games & results" },
            { href: "/roster", label: "Roster", icon: "👥", desc: "Players & profiles" },
            { href: "/stats", label: "Stats", icon: "📊", desc: "Team & player stats" },
            { href: "/tournament", label: "Tournament", icon: "🏆", desc: "March Madness" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-1"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="font-bold text-[#001A57] text-sm">{link.label}</span>
              <span className="text-xs text-gray-400">{link.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
