import Image from "next/image";
import type { NormalizedPlayer } from "@/types/espn";

export default function PlayerCard({ player }: { player: NormalizedPlayer }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Photo */}
      <div className="relative bg-gradient-to-b from-[#003087] to-[#001A57] h-36 flex items-end justify-center overflow-hidden">
        {player.photo ? (
          <Image
            src={player.photo}
            alt={player.name}
            fill
            className="object-cover object-top"
            unoptimized
          />
        ) : (
          <div className="text-6xl pb-2">👤</div>
        )}
        {/* Jersey number overlay */}
        <div className="absolute top-2 left-2 bg-[#003087]/80 text-[#B5A36A] text-xs font-bold px-2 py-0.5 rounded backdrop-blur-sm">
          #{player.jersey}
        </div>
        {/* Position badge */}
        <div className="absolute top-2 right-2 bg-black/40 text-white text-xs font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
          {player.position}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-[#001A57] text-sm leading-tight truncate">{player.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {player.year} · {player.height} · {player.weight}
        </p>

        {/* Stats row */}
        <div className="flex gap-3 mt-2 pt-2 border-t border-gray-100">
          {[
            { label: "PPG", value: player.ppg },
            { label: "RPG", value: player.rpg },
            { label: "APG", value: player.apg },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center">
              <div className="text-sm font-bold text-[#003087]">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
