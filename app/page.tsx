import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { findTeamGame, fetchSchedule, fetchTeamStats, fetchRoster } from "@/lib/espn";
import LiveGameBanner from "@/components/live/LiveGameBanner";
import NextGameCard from "@/components/live/NextGameCard";
import TeamSelector from "@/components/TeamSelector";
import { isToday } from "@/lib/utils";

export const revalidate = 30;

export default async function HomePage() {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);

  const [game, games, teamStats, rosterResult] = await Promise.allSettled([
    findTeamGame(tc.id),
    fetchSchedule(tc.id),
    fetchTeamStats(tc.id),
    fetchRoster(tc.id),
  ]);

  const currentGame = game.status === "fulfilled" ? game.value : null;
  const allGames = games.status === "fulfilled" ? games.value : [];
  const stats = teamStats.status === "fulfilled" ? teamStats.value : null;
  const roster = rosterResult.status === "fulfilled" ? rosterResult.value : [];

  const isLive = currentGame?.status === "in";
  const isGameToday = currentGame?.status === "pre" && isToday(currentGame.date);

  const nextGame = !currentGame
    ? allGames.find((g) => g.status === "pre") || null
    : null;

  const recentResults = allGames
    .filter((g) => g.status === "post")
    .slice(-5)
    .reverse();

  const featuredPlayers = roster.filter((p) => p.photo).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden bg-[var(--color-primary)] min-h-[180px] flex items-center px-6 py-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-[var(--color-secondary)] rounded-full opacity-40" />
          <div className="absolute -right-4 bottom-0 w-40 h-40 bg-[var(--color-accent)] rounded-full opacity-10" />
        </div>

        <div className="relative shrink-0 mr-5">
          <Image
            src={tc.logo}
            alt={tc.name}
            width={80}
            height={80}
            className="drop-shadow-lg"
            unoptimized
          />
        </div>

        <div className="relative flex-1">
          <p className="text-[var(--color-accent)] text-xs font-bold uppercase tracking-widest mb-1">
            {tc.name}
          </p>
          <h1 className="text-white text-3xl font-bold font-['Oswald',sans-serif] leading-tight">
            Men&apos;s Basketball
          </h1>
          {stats && (
            <div className="mt-2 inline-flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
              <span className="text-[var(--color-accent)] font-bold font-['Oswald',sans-serif] text-lg">
                {stats.record}
              </span>
              <span className="text-white/60 text-xs uppercase tracking-wide">Season Record</span>
            </div>
          )}
        </div>

        {featuredPlayers.length > 0 && (
          <div className="hidden sm:flex items-end gap-1 relative shrink-0 h-[140px]">
            {featuredPlayers.slice(0, 3).map((player, i) => (
              <div
                key={player.id}
                className="relative overflow-hidden rounded-t-xl"
                style={{ width: 64, height: 110 - i * 8, marginBottom: i * 4, opacity: 1 - i * 0.1 }}
              >
                <Image
                  src={player.photo!}
                  alt={player.name}
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-secondary)]/60 to-transparent" />
                <div className="absolute bottom-1 left-0 right-0 text-center text-white text-[9px] font-bold">
                  #{player.jersey}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team selector */}
      <TeamSelector currentTeam={tc} />

      {isLive && currentGame && <LiveGameBanner game={currentGame} />}
      {!isLive && isGameToday && currentGame && <NextGameCard game={currentGame} isToday />}
      {!isLive && !isGameToday && nextGame && <NextGameCard game={nextGame} />}

      {stats && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Season Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "PPG", value: stats.ppg },
              { label: "Opp PPG", value: stats.oppPpg },
              { label: "RPG", value: stats.rpg },
              { label: "APG", value: stats.apg },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className="text-xl font-bold text-[var(--color-primary)] font-['Oswald',sans-serif]">{s.value}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {featuredPlayers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">The Roster</h2>
            <Link href="/roster" className="text-xs text-[var(--color-primary)] font-medium">Full roster →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {featuredPlayers.map((player) => (
              <Link key={player.id} href="/roster" className="shrink-0">
                <div className="w-24 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-28 bg-[var(--color-primary)]">
                    <Image
                      src={player.photo!}
                      alt={player.name}
                      fill
                      className="object-cover object-top"
                      unoptimized
                    />
                    <div className="absolute top-1.5 left-1.5 bg-[var(--color-accent)] text-white text-[10px] font-bold rounded px-1">
                      #{player.jersey}
                    </div>
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-[11px] font-bold text-[var(--color-secondary)] truncate leading-tight">
                      {player.name.split(" ").slice(-1)[0]}
                    </div>
                    <div className="text-[10px] text-gray-400">{player.position}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent Results</h2>
            <Link href="/schedule" className="text-xs text-[var(--color-primary)] font-medium">Full schedule →</Link>
          </div>
          <div className="space-y-2">
            {recentResults.map((g) => (
              <Link
                key={g.id}
                href={`/game/${g.id}`}
                className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${g.isWin ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {g.isWin ? "W" : "L"}
                </span>
                <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                  {g.isHome ? "vs. " : "@ "}{g.opponent}
                </span>
                <span className="text-sm font-bold text-gray-800">{g.dukeScore}–{g.opponentScore}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Explore</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/schedule", label: "Schedule", icon: "📅", desc: "All games & results" },
            { href: "/roster", label: "Roster", icon: "👥", desc: "Players & profiles" },
            { href: "/stats", label: "Stats", icon: "📊", desc: "Team & player stats" },
            { href: "/tournament", label: "Tournament", icon: "🏆", desc: "March Madness" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-1">
              <span className="text-2xl">{link.icon}</span>
              <span className="font-bold text-[var(--color-secondary)] text-sm">{link.label}</span>
              <span className="text-xs text-gray-400">{link.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
