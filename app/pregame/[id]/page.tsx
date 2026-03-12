import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  fetchSchedule,
  fetchTeamStats,
  fetchRoster,
  fetchPregameData,
  fetchOpponentRoster,
} from "@/lib/espn";
import { formatDateTime } from "@/lib/utils";
import type { NormalizedPlayer, NormalizedTeamStats } from "@/types/espn";

export const revalidate = 300;

function StatCompareRow({
  label,
  duke,
  opp,
  higherIsBetter = true,
}: {
  label: string;
  duke: string;
  opp: string;
  higherIsBetter?: boolean;
}) {
  const dukeNum = parseFloat(duke);
  const oppNum = parseFloat(opp);
  const dukeWins = !isNaN(dukeNum) && !isNaN(oppNum) && (higherIsBetter ? dukeNum > oppNum : dukeNum < oppNum);
  const oppWins = !isNaN(dukeNum) && !isNaN(oppNum) && (higherIsBetter ? oppNum > dukeNum : oppNum < dukeNum);

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
      <div className={`flex-1 text-right text-sm font-bold ${dukeWins ? "text-[#003087]" : "text-gray-500"}`}>
        {duke}
      </div>
      <div className="w-28 text-center text-xs text-gray-400 uppercase tracking-wide shrink-0">{label}</div>
      <div className={`flex-1 text-left text-sm font-bold ${oppWins ? "text-gray-800" : "text-gray-400"}`}>
        {opp}
      </div>
    </div>
  );
}

function PlayerColumn({ player }: { player: NormalizedPlayer }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
        {player.photo ? (
          <Image src={player.photo} alt={player.name} fill className="object-cover object-top" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            {player.jersey}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-800 truncate leading-tight">
          {player.name.split(" ").slice(-1)[0]}
        </div>
        <div className="text-[10px] text-gray-400">{player.position} · #{player.jersey}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-bold text-[#003087]">{player.ppg}</div>
        <div className="text-[10px] text-gray-400">PPG</div>
      </div>
    </div>
  );
}

export default async function PregamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [games, dukeStats, dukeRoster] = await Promise.all([
    fetchSchedule(),
    fetchTeamStats(),
    fetchRoster(),
  ]);

  const game = games.find((g) => g.id === id);
  if (!game) redirect("/");
  if (game.status === "post") redirect(`/game/${id}`);

  const [pregame, oppRoster] = await Promise.all([
    fetchPregameData(id, game.opponentId),
    game.opponentId ? fetchOpponentRoster(game.opponentId) : Promise.resolve([]),
  ]);

  const { odds, winProbability, opponentStats } = pregame;

  const dukeKey = dukeRoster
    .filter((p) => p.ppg !== "-")
    .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg))
    .slice(0, 5);

  const oppKey = oppRoster
    .filter((p) => p.ppg !== "-")
    .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg))
    .slice(0, 5);

  const compareStats: Array<{ label: string; duke: string; opp: string; higherIsBetter?: boolean }> = [
    { label: "Record", duke: dukeStats?.record || "—", opp: opponentStats?.record || "—" },
    { label: "PPG", duke: dukeStats?.ppg || "—", opp: opponentStats?.ppg || "—" },
    { label: "Opp PPG", duke: dukeStats?.oppPpg || "—", opp: opponentStats?.oppPpg || "—", higherIsBetter: false },
    { label: "FG%", duke: dukeStats?.fgp || "—", opp: opponentStats?.fgp || "—" },
    { label: "3PT%", duke: dukeStats?.threePtp || "—", opp: opponentStats?.threePtp || "—" },
    { label: "RPG", duke: dukeStats?.rpg || "—", opp: opponentStats?.rpg || "—" },
    { label: "APG", duke: dukeStats?.apg || "—", opp: opponentStats?.apg || "—" },
    { label: "SPG", duke: dukeStats?.spg || "—", opp: opponentStats?.spg || "—" },
    { label: "TOV/G", duke: dukeStats?.topg || "—", opp: opponentStats?.topg || "—", higherIsBetter: false },
  ];

  const dukeChancePct = winProbability?.dukeChance ?? null;
  const oppChancePct = winProbability?.oppChance ?? null;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#003087] font-medium">
        ← Back to Home
      </Link>

      {/* Game header */}
      <div className="bg-gradient-to-br from-[#003087] to-[#001A57] rounded-2xl p-5 text-white">
        <div className="text-[#B5A36A] text-xs font-bold uppercase tracking-widest mb-4 text-center">
          {game.notes || "Game Preview"}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-3 mb-4">
          {/* Duke */}
          <div className="flex-1 text-center">
            <Image
              src="https://a.espncdn.com/i/teamlogos/ncaa/500/150.png"
              alt="Duke"
              width={52}
              height={52}
              className="mx-auto mb-2"
              unoptimized
            />
            <div className="text-sm font-bold font-['Oswald',sans-serif]">Duke</div>
            {dukeStats && (
              <div className="text-xs text-white/60">{dukeStats.record}</div>
            )}
          </div>

          <div className="text-center shrink-0">
            <div className="text-white/40 text-2xl font-light">VS</div>
            <div className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              game.isHome ? "bg-[#B5A36A]/20 text-[#B5A36A]" : "bg-white/10 text-white/60"
            }`}>
              {game.isHome ? "HOME" : "AWAY"}
            </div>
          </div>

          {/* Opponent */}
          <div className="flex-1 text-center">
            {game.opponentLogo ? (
              <Image
                src={game.opponentLogo}
                alt={game.opponent}
                width={52}
                height={52}
                className="mx-auto mb-2 object-contain"
                unoptimized
              />
            ) : (
              <div className="w-13 h-13 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center text-2xl">🏀</div>
            )}
            <div className="text-sm font-bold font-['Oswald',sans-serif] truncate">{game.opponent}</div>
            {opponentStats && (
              <div className="text-xs text-white/60">{opponentStats.record}</div>
            )}
          </div>
        </div>

        {/* Date / Venue */}
        <div className="border-t border-white/10 pt-3 space-y-1.5 text-center">
          <div className="text-white/80 text-sm">{formatDateTime(game.date)}</div>
          {game.venue && (
            <div className="text-white/50 text-xs">{game.venue}</div>
          )}
          {game.broadcastInfo && (
            <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 mt-1">
              <span className="text-[10px] text-white/50 uppercase tracking-wide">Watch on</span>
              <span className="text-xs font-bold text-white">{game.broadcastInfo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Win Probability */}
      {dukeChancePct !== null && oppChancePct !== null && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Win Probability</h2>
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-[#003087]">Duke {dukeChancePct}%</span>
            <span className="text-gray-500">{game.opponent} {oppChancePct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="bg-[#003087] h-full rounded-l-full transition-all"
              style={{ width: `${dukeChancePct}%` }}
            />
            <div
              className="bg-gray-300 h-full rounded-r-full flex-1"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">Source: ESPN Prediction Model</p>
        </div>
      )}

      {/* Betting Odds */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Betting Odds</h2>
        {odds ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-[#003087] font-['Oswald',sans-serif]">{odds.spread}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Spread</div>
              </div>
              <div className="text-center border-x border-gray-100">
                <div className="text-lg font-bold text-[#003087] font-['Oswald',sans-serif]">{odds.overUnder}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Over/Under</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-[#003087] font-['Oswald',sans-serif] leading-tight">
                  <div>Duke {odds[game.isHome ? "homeMoneyline" : "awayMoneyline"]}</div>
                  <div className="text-gray-400">{game.opponent.split(" ").slice(-1)[0]} {odds[game.isHome ? "awayMoneyline" : "homeMoneyline"]}</div>
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Moneyline</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 text-center">Source: {odds.provider} · Lines subject to change</p>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">Odds not yet available for this game.</p>
        )}
      </div>

      {/* Team Stats Comparison */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Team Comparison</h2>
        {/* Column headers */}
        <div className="flex items-center gap-2 py-2 mb-1">
          <div className="flex-1 text-right">
            <span className="text-xs font-bold text-[#003087] uppercase">Duke</span>
          </div>
          <div className="w-28 shrink-0" />
          <div className="flex-1 text-left">
            <span className="text-xs font-bold text-gray-500 uppercase truncate">{game.opponent.split(" ").slice(-1)[0]}</span>
          </div>
        </div>
        {compareStats.map((row) => (
          <StatCompareRow
            key={row.label}
            label={row.label}
            duke={row.duke}
            opp={row.opp}
            higherIsBetter={row.higherIsBetter}
          />
        ))}
      </div>

      {/* Key Players */}
      {(dukeKey.length > 0 || oppKey.length > 0) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Key Players</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Duke column */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Image
                  src="https://a.espncdn.com/i/teamlogos/ncaa/500/150.png"
                  alt="Duke"
                  width={16}
                  height={16}
                  unoptimized
                />
                <span className="text-xs font-bold text-[#003087] uppercase">Duke</span>
              </div>
              {dukeKey.map((p) => <PlayerColumn key={p.id} player={p} />)}
            </div>
            {/* Opponent column */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                {game.opponentLogo ? (
                  <Image
                    src={game.opponentLogo}
                    alt={game.opponent}
                    width={16}
                    height={16}
                    className="object-contain"
                    unoptimized
                  />
                ) : null}
                <span className="text-xs font-bold text-gray-600 uppercase truncate">
                  {game.opponent.split(" ").slice(-1)[0]}
                </span>
              </div>
              {oppKey.length > 0
                ? oppKey.map((p) => <PlayerColumn key={p.id} player={p} />)
                : <p className="text-xs text-gray-400">Roster data unavailable.</p>
              }
            </div>
          </div>
        </div>
      )}

      {/* Schedule link */}
      <div className="text-center">
        <Link href="/schedule" className="text-sm text-[#003087] font-medium hover:underline">
          View full schedule →
        </Link>
      </div>
    </div>
  );
}
