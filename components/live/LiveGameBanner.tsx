import Link from "next/link";
import Image from "next/image";
import type { NormalizedGame } from "@/types/espn";

export default function LiveGameBanner({ game }: { game: NormalizedGame }) {
  return (
    <Link href="/live" className="block">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003087] to-[#0736A4] text-white p-5 shadow-lg hover:shadow-xl transition-shadow">
        {/* Live badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse-live inline-block" />
            LIVE NOW
          </span>
          {game.period && (
            <span className="text-white/70 text-xs">
              {game.period <= 2 ? `${game.period}${game.period === 1 ? "st" : "nd"} Half` : `OT${game.period - 2}`}
              {game.clock && ` · ${game.clock}`}
            </span>
          )}
          {game.broadcastInfo && (
            <span className="ml-auto text-white/60 text-xs">{game.broadcastInfo}</span>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <div className="text-xs text-[#B5A36A] font-semibold uppercase tracking-wide mb-1">Duke</div>
            <div className="text-5xl font-bold font-['Oswald',sans-serif] leading-none">
              {game.dukeScore || "0"}
            </div>
          </div>

          <div className="text-white/40 text-2xl font-light">–</div>

          <div className="text-center flex-1">
            <div className="text-xs text-white/60 font-semibold uppercase tracking-wide mb-1 truncate">
              {game.opponent}
            </div>
            <div className="text-5xl font-bold font-['Oswald',sans-serif] leading-none text-white/80">
              {game.opponentScore || "0"}
            </div>
          </div>

          {game.opponentLogo && (
            <Image
              src={game.opponentLogo}
              alt={game.opponent}
              width={48}
              height={48}
              className="object-contain opacity-70"
              unoptimized
            />
          )}
        </div>

        <div className="mt-4 text-center">
          <span className="text-white/60 text-xs">Tap to view live game details →</span>
        </div>

        {/* Decorative element */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
      </div>
    </Link>
  );
}
