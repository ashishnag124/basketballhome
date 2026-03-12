import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchSchedule } from "@/lib/espn";
import PageHeader from "@/components/shared/PageHeader";
import GameRow from "@/components/schedule/GameRow";
import type { NormalizedGame } from "@/types/espn";

export const revalidate = 300; // 5 min

export async function generateMetadata() {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
  return { title: `Tournament | ${tc.name} Basketball` };
}

export default async function TournamentPage() {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);

  let tournamentGames: NormalizedGame[] = [];
  let hasTournament = false;

  try {
    const games = await fetchSchedule(tc.id);
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
        subtitle={`NCAA Tournament games for the ${tc.name}`}
      />

      {hasTournament ? (
        <div className="space-y-6">
          {(() => {
            const groups: Record<string, typeof tournamentGames> = {};
            for (const g of tournamentGames) {
              const key = g.notes || "Tournament";
              if (!groups[key]) groups[key] = [];
              groups[key].push(g);
            }
            return Object.entries(groups).map(([round, gamesInRound]) => (
              <div key={round}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-3 px-1">
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
          <h2 className="text-2xl font-bold text-[var(--color-secondary)] font-['Oswald',sans-serif] mb-3">
            Tournament Coming Soon
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
            The NCAA Tournament bracket will appear here once March Madness begins.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-[var(--color-primary)] rounded-xl p-4 text-center text-white">
              <div className="text-2xl font-bold font-['Oswald',sans-serif] text-[var(--color-accent)]">68</div>
              <div className="text-xs text-white/60 mt-0.5">Teams</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold font-['Oswald',sans-serif] text-[var(--color-primary)]">6</div>
              <div className="text-xs text-gray-400 mt-0.5">{tc.shortName} Titles</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
