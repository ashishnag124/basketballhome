import { fetchTeamStats, fetchRoster } from "@/lib/espn";
import TeamStatsPanel from "@/components/stats/TeamStatsPanel";
import PlayerStatsTable from "@/components/stats/PlayerStatsTable";
import PageHeader from "@/components/shared/PageHeader";
import ErrorCard from "@/components/shared/ErrorCard";

export const revalidate = 900; // 15 min

export const metadata = {
  title: "Stats | Duke Basketball",
};

export default async function StatsPage() {
  const [teamStatsResult, playersResult] = await Promise.allSettled([
    fetchTeamStats(),
    fetchRoster(),
  ]);

  const teamStats = teamStatsResult.status === "fulfilled" ? teamStatsResult.value : null;
  const players = playersResult.status === "fulfilled" ? playersResult.value : [];

  if (!teamStats && !players.length) {
    return (
      <div>
        <PageHeader title="Stats" accent="Duke Blue Devils" />
        <ErrorCard message="Could not load stats right now." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Stats"
        accent="Duke Blue Devils"
        subtitle="Season averages and individual player statistics"
      />
      {teamStats && <TeamStatsPanel stats={teamStats} />}
      {players.length > 0 && <PlayerStatsTable players={players} />}
    </div>
  );
}
