import type { NormalizedTeamStats } from "@/types/espn";

interface StatCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-xl p-4 text-center ${
        highlight ? "bg-[#003087] text-white" : "bg-white"
      } shadow-sm`}
    >
      <div
        className={`text-2xl font-bold font-['Oswald',sans-serif] ${
          highlight ? "text-[#B5A36A]" : "text-[#003087]"
        }`}
      >
        {value}
      </div>
      <div
        className={`text-xs uppercase tracking-wide mt-0.5 ${
          highlight ? "text-white/70" : "text-gray-400"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

export default function TeamStatsPanel({ stats }: { stats: NormalizedTeamStats }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-[#003087] text-white rounded-xl px-4 py-2 font-['Oswald',sans-serif]">
          <span className="text-2xl font-bold">{stats.wins}</span>
          <span className="text-white/50 mx-1">-</span>
          <span className="text-2xl font-bold">{stats.losses}</span>
        </div>
        <div>
          <div className="text-xs text-[#B5A36A] font-bold uppercase tracking-wider">Season Record</div>
          <div className="text-sm text-gray-500">{stats.record}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <StatCard label="PPG" value={stats.ppg} highlight />
        <StatCard label="Opp PPG" value={stats.oppPpg} />
        <StatCard label="FG%" value={stats.fgp} />
        <StatCard label="3PT%" value={stats.threePtp} />
        <StatCard label="FT%" value={stats.ftPct} />
        <StatCard label="RPG" value={stats.rpg} />
        <StatCard label="APG" value={stats.apg} />
        <StatCard label="SPG" value={stats.spg} />
        <StatCard label="BPG" value={stats.bpg} />
        <StatCard label="TOV/G" value={stats.topg} />
      </div>
    </div>
  );
}
