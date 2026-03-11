import Image from "next/image";
import Link from "next/link";
import type { NormalizedGame } from "@/types/espn";
import GameStatusBadge from "./GameStatusBadge";
import { isToday } from "@/lib/utils";

export default function GameRow({ game }: { game: NormalizedGame }) {
  const today = isToday(game.date);
  const isLive = game.status === "in";

  return (
    <Link
      href={isLive ? "/live" : game.status === "post" ? `/game/${game.id}` : `#`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isLive
          ? "bg-blue-50 border border-blue-200 hover:bg-blue-100"
          : today
          ? "bg-[#003087]/5 border border-[#003087]/20 hover:bg-[#003087]/10"
          : "bg-white hover:bg-gray-50"
      } shadow-sm`}
    >
      {/* Date column */}
      <div className="w-14 shrink-0 text-center">
        {isLive ? (
          <span className="text-xs font-bold text-red-500 animate-pulse-live">LIVE</span>
        ) : (
          <>
            <div className="text-xs text-gray-400 uppercase">
              {new Date(game.date).toLocaleDateString("en-US", { weekday: "short" })}
            </div>
            <div className="text-sm font-bold text-gray-700">
              {new Date(game.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </>
        )}
      </div>

      {/* Home/Away indicator */}
      <div className="w-8 shrink-0 text-center">
        <span
          className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            game.isHome
              ? "bg-[#003087] text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {game.isHome ? "H" : "A"}
        </span>
      </div>

      {/* Opponent */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {game.opponentLogo ? (
          <Image
            src={game.opponentLogo}
            alt={game.opponent}
            width={28}
            height={28}
            className="shrink-0 object-contain"
            unoptimized
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 shrink-0">
            🏀
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-800 truncate">{game.opponent}</div>
          {game.notes && (
            <div className="text-xs text-[#B5A36A] font-medium truncate">{game.notes}</div>
          )}
          {game.venue && (
            <div className="text-xs text-gray-400 truncate">{game.venue}</div>
          )}
          {game.broadcastInfo && !game.dukeScore && (
            <div className="text-xs text-gray-400">{game.broadcastInfo}</div>
          )}
        </div>
      </div>

      {/* Score / status */}
      <div className="shrink-0">
        <GameStatusBadge
          status={game.status}
          statusText={game.statusText}
          isWin={game.isWin}
          dukeScore={game.dukeScore}
          opponentScore={game.opponentScore}
        />
      </div>
    </Link>
  );
}
