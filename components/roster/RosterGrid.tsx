import type { NormalizedPlayer } from "@/types/espn";
import PlayerCard from "./PlayerCard";

const POSITION_ORDER = ["G", "F", "C"];
const POSITION_LABELS: Record<string, string> = {
  G: "Guards",
  F: "Forwards",
  C: "Centers",
  "": "Players",
};

function groupByPosition(players: NormalizedPlayer[]) {
  const groups: Record<string, NormalizedPlayer[]> = {};
  for (const p of players) {
    const pos = POSITION_ORDER.includes(p.position) ? p.position : "Other";
    if (!groups[pos]) groups[pos] = [];
    groups[pos].push(p);
  }
  return groups;
}

export default function RosterGrid({ players }: { players: NormalizedPlayer[] }) {
  if (!players.length) {
    return <div className="text-center py-12 text-gray-400">Roster not available.</div>;
  }

  const groups = groupByPosition(players);
  const orderedGroups = [
    ...POSITION_ORDER.filter((p) => groups[p]),
    ...Object.keys(groups).filter((p) => !POSITION_ORDER.includes(p)),
  ];

  return (
    <div className="space-y-6">
      {orderedGroups.map((pos) => (
        <div key={pos}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            {POSITION_LABELS[pos] || pos}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {groups[pos].map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
