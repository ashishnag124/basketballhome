import { fetchSchedule } from "@/lib/espn";
import PageHeader from "@/components/shared/PageHeader";
import GameRow from "@/components/schedule/GameRow";
import type { NormalizedGame } from "@/types/espn";

export const revalidate = 300; // 5 min

export const metadata = {
  title: "Tournament | Duke Basketball",
};

export default async function TournamentPage() {
  let tournamentGames: NormalizedGame[] = [];
  let hasTournament = false;

  try {
    const games = await fetchSchedule();
    tournamentGames = games.filter(
      (g) =>
        g.notes?.toLowerCase().includes("ncaa") ||
        g.notes?.toLowerCase().includes("tournament") ||
        g.notes?.toLowerCase().includes("march") ||
        g.notes?.toLowerCase().includes("acc tournament")
    );
    hasTournament = tournamentGames.length > 0;
  } catch {
    // ignore
  }

  return (
    <div>
      <PageHeader
        title="Tournament"
        accent="March Madness"
        subtitle="NCAA Tournament games for the Duke Blue Devils"
      />

      {hasTournament ? (
        <div className="space-y-6">
          {/* Group by tournament round via notes */}
          {(() => {
            const groups: Record<string, typeof tournamentGames> = {};
            for (const g of tournamentGames) {
              const key = g.notes || "Tournament";
              if (!groups[key]) groups[key] = [];
              groups[key].push(g);
            }
            return Object.entries(groups).map(([round, gamesInRound]) => (
              <div key={round}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#B5A36A] mb-3 px-1">
                  {round}
                </h2>
                <div className="flex flex-col gap-2">
                  {gamesInRound.map((game) => (
                    <GameRow key={game.id} game={game} />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-2xl font-bold text-[#001A57] font-['Oswald',sans-serif] mb-3">
            Tournament Coming Soon
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
            The NCAA Tournament bracket will appear here once March Madness begins. Selection Sunday
            determines Duke&apos;s path to the championship.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-[#003087] rounded-xl p-4 text-center text-white">
              <div className="text-2xl font-bold font-['Oswald',sans-serif] text-[#B5A36A]">68</div>
              <div className="text-xs text-white/60 mt-0.5">Teams</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold font-['Oswald',sans-serif] text-[#003087]">6</div>
              <div className="text-xs text-gray-400 mt-0.5">Duke Titles</div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-xl p-5 shadow-sm max-w-sm mx-auto text-left">
            <h3 className="font-bold text-[#001A57] text-sm mb-2">Duke Tournament History</h3>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>National Championships</span>
                <span className="font-bold text-[#003087]">5 (1991, 1992, 2001, 2010, 2015)</span>
              </div>
              <div className="flex justify-between">
                <span>Final Four Appearances</span>
                <span className="font-bold text-[#003087]">17</span>
              </div>
              <div className="flex justify-between">
                <span>Tournament Appearances</span>
                <span className="font-bold text-[#003087]">45+</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
