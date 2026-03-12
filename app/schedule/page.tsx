import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import { fetchSchedule } from "@/lib/espn";
import ScheduleList from "@/components/schedule/ScheduleList";
import PageHeader from "@/components/shared/PageHeader";
import ErrorCard from "@/components/shared/ErrorCard";

export const revalidate = 600;

export const metadata = {
  title: "Schedule | Basketball Tracker",
};

export default async function SchedulePage() {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);

  let games;
  try {
    games = await fetchSchedule(tc.id);
  } catch {
    return (
      <div>
        <PageHeader title="Schedule" accent="2024–25 Season" />
        <ErrorCard message="Could not load the schedule right now." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Schedule & Results"
        accent={tc.name}
        subtitle="Full season schedule with scores and upcoming games"
      />
      <ScheduleList games={games} />
    </div>
  );
}
