interface GameStatusBadgeProps {
  status: "pre" | "in" | "post";
  statusText: string;
  isWin: boolean | null;
  dukeScore: string | null;
  opponentScore: string | null;
}

export default function GameStatusBadge({
  status,
  statusText,
  isWin,
  dukeScore,
  opponentScore,
}: GameStatusBadgeProps) {
  if (status === "in") {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse-live">
          <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />
          LIVE
        </span>
        <span className="text-xs text-gray-500">{statusText}</span>
        {dukeScore && opponentScore && (
          <span className="text-base font-bold text-[#003087]">
            {dukeScore} – {opponentScore}
          </span>
        )}
      </div>
    );
  }

  if (status === "post" && dukeScore !== null && opponentScore !== null) {
    const won = isWin === true;
    const lost = isWin === false;
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            won
              ? "bg-green-100 text-green-700"
              : lost
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {won ? "W" : lost ? "L" : "F"}
        </span>
        <span className="text-base font-bold text-gray-800">
          {dukeScore} – {opponentScore}
        </span>
        <span className="text-xs text-gray-400">{statusText}</span>
      </div>
    );
  }

  // Upcoming game
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-sm font-medium text-[#003087]">{statusText}</span>
    </div>
  );
}
