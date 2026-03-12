import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchGameBoxScore } from "@/lib/espn";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
  const game = await fetchGameBoxScore(id, tc.id);
  if (!game) notFound();

  const gameDate = new Date(game.date);
  const dateStr = gameDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles",
  });

  const ourWon = parseInt(game.dukeScore) > parseInt(game.opponentScore);
  const isCompleted = game.status === "post";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/schedule" className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] font-medium">
        ← Back to Schedule
      </Link>

      {/* Game header */}
      <div className="bg-[var(--color-primary)] rounded-2xl p-5 text-white">
        <p className="text-[var(--color-accent)] text-xs font-bold uppercase tracking-widest mb-3 text-center">
          {game.statusText} {game.venue && `· ${game.venue}`}
        </p>
        <div className="flex items-center justify-between gap-4">
          {/* Our team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Image
              src={tc.logo}
              alt={tc.shortName}
              width={56}
              height={56}
              unoptimized
            />
            <span className="font-bold text-sm text-center">{tc.name}</span>
            <span className="text-4xl font-bold font-['Oswald',sans-serif] text-[var(--color-accent)]">
              {game.dukeScore}
            </span>
          </div>

          {/* VS */}
          <div className="text-center shrink-0">
            <div className="text-gray-400 text-sm font-bold">VS</div>
            {isCompleted && (
              <div className={`mt-1 text-xs font-bold px-2 py-0.5 rounded ${ourWon ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                {ourWon ? "W" : "L"}
              </div>
            )}
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Image
              src={game.opponentLogo}
              alt={game.opponent}
              width={56}
              height={56}
              unoptimized
            />
            <span className="font-bold text-sm text-center">{game.opponent}</span>
            <span className="text-4xl font-bold font-['Oswald',sans-serif] text-white/80">
              {game.opponentScore}
            </span>
          </div>
        </div>
        <p className="text-white/50 text-xs text-center mt-3">{dateStr}</p>
      </div>

      {/* Box score tables */}
      {game.teams.map((team) => (
        <div key={team.teamId}>
          <div className="flex items-center gap-2 mb-3">
            <Image src={team.teamLogo} alt={team.teamName} width={24} height={24} unoptimized />
            <h2 className="text-sm font-bold text-[var(--color-secondary)]">{team.teamName}</h2>
            {team.isDuke && <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded font-bold">{tc.shortName.toUpperCase()}</span>}
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
                  {/* Starters first */}
                  {team.players.filter(p => p.starter && !p.didNotPlay).map((player) => (
                    <tr key={player.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 sticky left-0 bg-white">
                        <Link href={`/player/${player.id}`} className="flex items-center gap-2 hover:text-[var(--color-primary)]">
                          {player.photo ? (
                            <Image src={player.photo} alt={player.name} width={24} height={24} className="rounded-full object-cover" unoptimized />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">👤</div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-800 whitespace-nowrap">{player.name}</div>
                            <div className="text-gray-400">{player.position} {player.starter ? "·S" : ""}</div>
                          </div>
                        </Link>
                      </td>
                      {player.stats.map((stat, i) => (
                        <td key={i} className={`text-center px-2 py-2 tabular-nums ${team.columns[i] === 'PTS' ? 'font-bold text-[var(--color-primary)]' : 'text-gray-700'}`}>
                          {stat}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Bench */}
                  {team.players.filter(p => !p.starter && !p.didNotPlay).length > 0 && (
                    <tr>
                      <td colSpan={team.columns.length + 1} className="px-3 py-1 bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Bench</td>
                    </tr>
                  )}
                  {team.players.filter(p => !p.starter && !p.didNotPlay).map((player) => (
                    <tr key={player.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 sticky left-0 bg-white">
                        <Link href={`/player/${player.id}`} className="flex items-center gap-2 hover:text-[var(--color-primary)]">
                          {player.photo ? (
                            <Image src={player.photo} alt={player.name} width={24} height={24} className="rounded-full object-cover" unoptimized />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">👤</div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-800 whitespace-nowrap">{player.name}</div>
                            <div className="text-gray-400">{player.position}</div>
                          </div>
                        </Link>
                      </td>
                      {player.stats.map((stat, i) => (
                        <td key={i} className={`text-center px-2 py-2 tabular-nums ${team.columns[i] === 'PTS' ? 'font-bold text-[var(--color-primary)]' : 'text-gray-700'}`}>
                          {stat}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Totals */}
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
      ))}
    </div>
  );
}
