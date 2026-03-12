import Image from "next/image";
import Link from "next/link";
import { fetchRoster, fetchPlayerGameLog, fetchAthleteBasicInfo } from "@/lib/espn";
import { notFound } from "next/navigation";

export const revalidate = 900;

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [roster, gameLog] = await Promise.allSettled([
    fetchRoster(),
    fetchPlayerGameLog(id),
  ]);

  const players = roster.status === "fulfilled" ? roster.value : [];
  let player = players.find((p) => p.id === id) ?? null;

  // For non-Duke players (e.g. linked from the pregame page), fall back to ESPN athlete endpoint
  if (!player) {
    player = await fetchAthleteBasicInfo(id);
  }
  if (!player) notFound();

  const log = gameLog.status === "fulfilled" ? gameLog.value : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/roster" className="inline-flex items-center gap-1 text-sm text-[#003087] font-medium">
        ← Back to Roster
      </Link>

      {/* Player header */}
      <div className="bg-[#003087] rounded-2xl overflow-hidden">
        <div className="flex items-end gap-5 px-5 pt-5 pb-0">
          <div className="relative w-28 h-36 shrink-0">
            {player.photo ? (
              <Image src={player.photo} alt={player.name} fill className="object-cover object-top rounded-t-xl" unoptimized />
            ) : (
              <div className="w-full h-full bg-[#001A57] rounded-t-xl flex items-center justify-center text-5xl">👤</div>
            )}
          </div>
          <div className="pb-4 flex-1">
            <div className="text-[#B5A36A] text-xs font-bold uppercase tracking-widest mb-1">
              #{player.jersey} · {player.positionFull}
            </div>
            <h1 className="text-white text-2xl font-bold font-['Oswald',sans-serif] leading-tight">
              {player.name}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {player.year} · {player.height} · {player.weight}
            </p>
          </div>
        </div>

        {/* Season averages bar */}
        <div className="grid grid-cols-4 divide-x divide-white/10 border-t border-white/10 mt-0">
          {[
            { label: "PPG", value: player.ppg },
            { label: "RPG", value: player.rpg },
            { label: "APG", value: player.apg },
            { label: "FG%", value: player.fgp },
          ].map((s) => (
            <div key={s.label} className="text-center py-3">
              <div className="text-[#B5A36A] font-bold font-['Oswald',sans-serif] text-xl">{s.value}</div>
              <div className="text-white/50 text-xs uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Game log */}
      {log && log.games.length > 0 ? (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Game Log ({log.games.length} games)
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2 font-semibold text-gray-500 sticky left-0 bg-gray-50 min-w-[130px]">GAME</th>
                    <th className="text-center px-2 py-2 font-semibold text-gray-500">RESULT</th>
                    {log.columns.map((col) => (
                      <th key={col} className="text-center px-2 py-2 font-semibold text-gray-500 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {log.games.map((game) => {
                    const d = new Date(game.date);
                    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const ptsIdx = log.columns.indexOf("PTS");
                    return (
                      <tr key={game.gameId} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 sticky left-0 bg-white">
                          <Link href={`/game/${game.gameId}`} className="flex items-center gap-2 hover:text-[#003087]">
                            {game.opponentLogo ? (
                              <Image src={game.opponentLogo} alt={game.opponent} width={20} height={20} className="object-contain shrink-0" unoptimized />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />
                            )}
                            <div>
                              <div className="font-semibold text-gray-800 whitespace-nowrap">
                                {game.isHome ? "vs" : "@"} {game.opponent.split(" ").slice(-1)[0]}
                              </div>
                              <div className="text-gray-400">{dateStr}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="text-center px-2 py-2">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${game.result === "W" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {game.result}
                          </span>
                          <div className="text-gray-400 text-[10px] mt-0.5">{game.score}</div>
                        </td>
                        {game.stats.map((stat, i) => (
                          <td key={i} className={`text-center px-2 py-2 tabular-nums ${i === ptsIdx ? "font-bold text-[#003087]" : "text-gray-700"}`}>
                            {stat}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                {/* Season totals row */}
                <tfoot>
                  <tr className="bg-[#003087]/5 border-t border-[#003087]/20 font-bold">
                    <td className="px-3 py-2 text-[#001A57] font-bold sticky left-0 bg-[#003087]/5" colSpan={2}>SEASON TOTALS</td>
                    {log.totals.map((tot, i) => (
                      <td key={i} className="text-center px-2 py-2 text-[#001A57] tabular-nums">{tot}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 text-sm">No game log available.</div>
      )}
    </div>
  );
}
