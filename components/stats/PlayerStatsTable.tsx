"use client";

import { useState } from "react";
import type { NormalizedPlayer } from "@/types/espn";

type SortKey = "name" | "ppg" | "rpg" | "apg" | "fgp";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Player" },
  { key: "ppg", label: "PPG" },
  { key: "rpg", label: "RPG" },
  { key: "apg", label: "APG" },
  { key: "fgp", label: "FG%" },
];

function parseNum(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? -1 : n;
}

export default function PlayerStatsTable({ players }: { players: NormalizedPlayer[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("ppg");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const sorted = [...players].sort((a, b) => {
    const aVal = sortKey === "name" ? a.name : parseNum(a[sortKey]);
    const bVal = sortKey === "name" ? b.name : parseNum(b[sortKey]);
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
        Player Stats
      </h2>
      <div className="table-scroll rounded-xl shadow-sm overflow-hidden">
        <table className="w-full min-w-[400px] text-sm bg-white">
          <thead>
            <tr className="bg-[#003087] text-white">
              <th className="sticky left-0 bg-[#003087] px-2 py-2 text-left text-xs font-bold uppercase tracking-wide w-8">
                #
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${
                    col.key === "name" ? "text-left" : "text-center"
                  } hover:bg-white/10 transition-colors ${sortKey === col.key ? "text-[#B5A36A]" : "text-white/80"}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
                  )}
                </th>
              ))}
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-white/80">
                POS
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr
                key={player.id}
                className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/40 transition-colors`}
              >
                <td className="sticky left-0 px-2 py-2.5 text-xs text-gray-400 font-mono bg-inherit">
                  {player.jersey !== "-" ? player.jersey : "—"}
                </td>
                <td className="px-3 py-2.5 font-semibold text-[#001A57] whitespace-nowrap">
                  {player.name}
                  <div className="text-xs text-gray-400 font-normal">{player.year}</div>
                </td>
                <td className="px-3 py-2.5 text-center font-bold text-[#003087]">
                  {player.ppg !== "-" ? player.ppg : "—"}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-700">
                  {player.rpg !== "-" ? player.rpg : "—"}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-700">
                  {player.apg !== "-" ? player.apg : "—"}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-700">
                  {player.fgp !== "-" ? player.fgp : "—"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {player.position}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Tap column headers to sort</p>
    </div>
  );
}
