import type { NormalizedGame } from "@/types/espn";
import GameRow from "./GameRow";

function groupByMonth(games: NormalizedGame[]): Record<string, NormalizedGame[]> {
  const groups: Record<string, NormalizedGame[]> = {};
  for (const game of games) {
    const month = new Date(game.date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "America/Los_Angeles",
    });
    if (!groups[month]) groups[month] = [];
    groups[month].push(game);
  }
  return groups;
}

export default function ScheduleList({ games }: { games: NormalizedGame[] }) {
  if (!games.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        No games scheduled yet.
      </div>
    );
  }

  const groups = groupByMonth(games);
  const wins = games.filter((g) => g.isWin === true).length;
  const losses = games.filter((g) => g.isWin === false).length;

  return (
    <div>
      {/* Season record summary */}
      {(wins > 0 || losses > 0) && (
        <div className="flex gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-bold text-green-600 font-['Oswald',sans-serif]">{wins}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Wins</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-bold text-red-500 font-['Oswald',sans-serif]">{losses}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Losses</div>
          </div>
          <div className="bg-[#003087] rounded-xl shadow-sm px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-bold text-white font-['Oswald',sans-serif]">{wins}-{losses}</div>
            <div className="text-xs text-white/70 uppercase tracking-wide">Record</div>
          </div>
        </div>
      )}

      {/* Games grouped by month */}
      {Object.entries(groups).map(([month, monthGames]) => (
        <div key={month} className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
            {month}
          </h2>
          <div className="flex flex-col gap-2">
            {monthGames.map((game) => (
              <GameRow key={game.id} game={game} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
