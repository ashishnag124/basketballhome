import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchTeamStats, fetchRoster } from "@/lib/espn";
import TeamStatsPanel from "@/components/stats/TeamStatsPanel";
import PlayerStatsTable from "@/components/stats/PlayerStatsTable";
import PageHeader from "@/components/shared/PageHeader";
import ErrorCard from "@/components/shared/ErrorCard";

export const revalidate = 900; // 15 min

export async function generateMetadata() {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
  return { title: `Stats | ${tc.name} Basketball` };
}

export default async function StatsPage() {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);

  const [teamStatsResult, playersResult] = await Promise.allSettled([
    fetchTeamStats(tc.id),
    fetchRoster(tc.id),
  ]);

  const teamStats = teamStatsResult.status === "fulfilled" ? teamStatsResult.value : null;
  const players = playersResult.status === "fulfilled" ? playersResult.value : [];

  if (!teamStats && !players.length) {
    return (
      <div>
        <PageHeader title="Stats" accent={tc.name} />
        <ErrorCard message="Could not load stats right now." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Stats"
        accent={tc.name}
        subtitle="Season averages and individual player statistics"
      />
      {teamStats && <TeamStatsPanel stats={teamStats} />}
      {players.length > 0 && <PlayerStatsTable players={players} />}
    </div>
  );
}
