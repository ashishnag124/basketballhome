import Image from "next/image";
import Link from "next/link";
import type { NormalizedGame } from "@/types/espn";
import { formatDateTime } from "@/lib/utils";

export default function NextGameCard({ game, isToday }: { game: NormalizedGame; isToday?: boolean }) {
  return (
    <Link
      href={`/pregame/${game.id}`}
      className={`block rounded-2xl p-5 shadow-sm transition-opacity hover:opacity-90 ${
        isToday
          ? "bg-gradient-to-r from-[#003087] to-[#0736A4] text-white"
          : "bg-white"
      }`}
    >
      <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${isToday ? "text-[#B5A36A]" : "text-[#B5A36A]"}`}>
        {isToday ? "🏀 Game Today" : "Next Game"}
      </div>

      <div className="flex items-center gap-4">
        {game.opponentLogo ? (
          <Image
            src={game.opponentLogo}
            alt={game.opponent}
            width={56}
            height={56}
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🏀</div>
        )}

        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium ${isToday ? "text-white/60" : "text-gray-400"} mb-0.5`}>
            {game.isHome ? "HOME" : "AWAY"} · {game.venue || "TBD"}
          </div>
          <div className={`text-lg font-bold truncate ${isToday ? "text-white" : "text-[#001A57]"} font-['Oswald',sans-serif]`}>
            {game.isHome ? "vs. " : "@ "}{game.opponent}
          </div>
          <div className={`text-sm mt-0.5 ${isToday ? "text-white/80" : "text-gray-600"}`}>
            {formatDateTime(game.date)}
          </div>
          {game.broadcastInfo && (
            <div className={`text-xs mt-0.5 ${isToday ? "text-white/50" : "text-gray-400"}`}>
              {game.broadcastInfo}
            </div>
          )}
          {game.notes && (
            <div className={`text-xs mt-0.5 font-medium ${isToday ? "text-[#B5A36A]" : "text-[#B5A36A]"}`}>
              {game.notes}
            </div>
          )}
        </div>
      </div>
      <div className={`mt-3 pt-3 border-t flex items-center justify-end text-xs font-semibold ${
        isToday ? "border-white/10 text-white/60" : "border-gray-100 text-[#003087]"
      }`}>
        Game Preview →
      </div>
    </Link>
  );
}
