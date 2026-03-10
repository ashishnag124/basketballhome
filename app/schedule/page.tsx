import { fetchSchedule } from "@/lib/espn";
import ScheduleList from "@/components/schedule/ScheduleList";
import PageHeader from "@/components/shared/PageHeader";
import ErrorCard from "@/components/shared/ErrorCard";

export const revalidate = 600; // 10 min

export const metadata = {
  title: "Schedule | Duke Basketball",
};

export default async function SchedulePage() {
  let games;
  try {
    games = await fetchSchedule();
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
        accent="Duke Blue Devils"
        subtitle="Full season schedule with scores and upcoming games"
      />
      <ScheduleList games={games} />
    </div>
  );
}
