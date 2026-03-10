import { fetchRoster } from "@/lib/espn";
import RosterGrid from "@/components/roster/RosterGrid";
import PageHeader from "@/components/shared/PageHeader";
import ErrorCard from "@/components/shared/ErrorCard";

export const revalidate = 3600; // 1 hour

export const metadata = {
  title: "Roster | Duke Basketball",
};

export default async function RosterPage() {
  let players;
  try {
    players = await fetchRoster();
  } catch {
    return (
      <div>
        <PageHeader title="Roster" accent="Duke Blue Devils" />
        <ErrorCard message="Could not load the roster right now." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Roster"
        accent="Duke Blue Devils"
        subtitle={`${players.length} players`}
      />
      <RosterGrid players={players} />
    </div>
  );
}
