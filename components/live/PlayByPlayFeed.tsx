import type { EspnPlay } from "@/types/espn";

const DUKE_ID = "150";

function PlayItem({ play }: { play: EspnPlay }) {
  const isDuke = play.team?.id === DUKE_ID;

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm ${
        isDuke ? "bg-blue-50 border-l-2 border-[#003087]" : "bg-gray-50"
      }`}
    >
      <div className="shrink-0 text-right min-w-[42px]">
        <div className="text-xs text-gray-400 font-mono">{play.clock?.displayValue || ""}</div>
        <div className="text-xs text-gray-400">P{play.period?.number}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${isDuke ? "text-[#001A57] font-medium" : "text-gray-600"} leading-snug`}>
          {play.text}
        </p>
        {play.homeScore !== undefined && (
          <p className="text-xs text-gray-400 mt-0.5">
            Score: {play.homeScore} – {play.awayScore}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PlayByPlayFeed({ plays }: { plays: EspnPlay[] }) {
  if (!plays.length) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Play-by-play will appear here once the game begins.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
        Recent Plays
      </h3>
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {plays.map((play) => (
          <PlayItem key={play.id} play={play} />
        ))}
      </div>
    </div>
  );
}
