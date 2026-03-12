import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchRoster } from "@/lib/espn";
import RosterGrid from "@/components/roster/RosterGrid";
import PageHeader from "@/components/shared/PageHeader";
import ErrorCard from "@/components/shared/ErrorCard";

export const revalidate = 3600;

export const metadata = {
  title: "Roster | Basketball Tracker",
};

export default async function RosterPage() {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);

  let players;
  try {
    players = await fetchRoster(tc.id);
  } catch {
    return (
      <div>
        <PageHeader title="Roster" accent={tc.name} />
        <ErrorCard message="Could not load the roster right now." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Roster"
        accent={tc.name}
        subtitle={`${players.length} players`}
      />
      <RosterGrid players={players} />
    </div>
  );
}
