"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { TeamConfig } from "@/lib/team-config";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface TeamOption {
  id: string;
  name: string;
  shortName: string;
  logo: string;
}

interface ConferenceOption {
  id: string;
  name: string;
  shortName: string;
  teams: TeamOption[];
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/schedule", label: "Schedule", icon: "📅" },
  { href: "/roster", label: "Roster", icon: "👥" },
  { href: "/stats", label: "Stats", icon: "📊" },
  { href: "/live", label: "Live", icon: "📺" },
  { href: "/tournament", label: "Tournament", icon: "🏆" },
];

export default function NavBar({ isLive = false, teamConfig }: { isLive?: boolean; teamConfig: TeamConfig }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [conferences, setConferences] = useState<ConferenceOption[]>([]);
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [selectedConf, setSelectedConf] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadingConf, setLoadingConf] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Single fetch — conferences + teams all come back together from the groups endpoint
  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => {
        const confs: ConferenceOption[] = d.conferences || [];
        setConferences(confs);
        // Flatten and sort all teams for the default "all teams" view
        const flat = confs.flatMap((c) => c.teams).sort((a, b) => a.name.localeCompare(b.name));
        setAllTeams(flat);
        setTeams(flat);
      })
      .finally(() => setLoadingConf(false));
  }, []);

  function handleConferenceChange(confId: string) {
    setSelectedConf(confId);
    if (!confId) {
      setTeams(allTeams);
    } else {
      const conf = conferences.find((c) => c.id === confId);
      setTeams(conf ? [...conf.teams].sort((a, b) => a.name.localeCompare(b.name)) : []);
    }
  }

  async function handleTeamSelect(teamId: string) {
    if (!teamId) return;
    // Pre-set cookie via API call first so the homepage doesn't trigger another
    // redirect to /api/set-team (which can end up on localhost in proxied deploys).
    try { await fetch(`/api/set-team?id=${teamId}`); } catch { /* ignore */ }
    window.location.href = `/?team=${teamId}`;
  }

  const selectClass =
    "bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 border border-white/20 focus:outline-none focus:border-white/40 disabled:opacity-50";

  return (
    <>
      {/* Desktop top nav */}
      <nav
        className={`hidden md:flex fixed top-0 left-0 right-0 z-50 items-center px-6 py-3 bg-[var(--color-primary)] text-white transition-shadow ${
          scrolled ? "shadow-lg" : ""
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-['Oswald',sans-serif] text-xl font-bold tracking-wide shrink-0">
          <span className="text-[var(--color-accent)]">{teamConfig.shortName.toUpperCase()}</span>
          <span>BASKETBALL</span>
        </Link>

        {/* Team selector — between logo and nav links */}
        <div className="flex items-center gap-1.5 mx-5">
          <select
            value={selectedConf}
            onChange={(e) => handleConferenceChange(e.target.value)}
            disabled={loadingConf}
            className={`${selectClass} max-w-[120px]`}
          >
            <option value="" className="bg-[var(--color-primary)] text-white">
              {loadingConf ? "Loading…" : "Conference"}
            </option>
            {conferences.map((c) => (
              <option key={c.id} value={c.id} className="bg-[var(--color-primary)] text-white">
                {c.shortName}
              </option>
            ))}
          </select>
          <select
            value=""
            onChange={(e) => handleTeamSelect(e.target.value)}
            disabled={loadingConf}
            className={`${selectClass} max-w-[130px]`}
          >
            <option value="" className="bg-[var(--color-primary)] text-white">
              {loadingConf ? "Loading…" : "Team"}
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-[var(--color-primary)] text-white">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1 ml-auto">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
                {item.href === "/live" && isLive && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse-live" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[var(--color-primary)] text-white shadow-md">
        <Link href="/" className="font-['Oswald',sans-serif] text-lg font-bold">
          <span className="text-[var(--color-accent)]">{teamConfig.shortName.toUpperCase()}</span>{" "}
          <span>BASKETBALL</span>
        </Link>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Menu"
        >
          <div className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-5 bg-white transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-[var(--color-secondary)] text-white shadow-xl">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-5 py-4 text-sm font-medium border-b border-white/10 ${
                  active ? "bg-white/10 text-[var(--color-accent)]" : "text-white/80 hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.href === "/live" && isLive && (
                  <span className="ml-auto flex items-center gap-1 text-red-400 text-xs animate-pulse-live font-semibold">
                    <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                    LIVE
                  </span>
                )}
              </Link>
            );
          })}

          {/* Team selector in mobile menu */}
          <div className="px-5 py-4 border-t border-white/10 space-y-2">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Change Team</p>
            <select
              value={selectedConf}
              onChange={(e) => handleConferenceChange(e.target.value)}
              disabled={loadingConf}
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 focus:outline-none disabled:opacity-50"
            >
              <option value="" className="bg-[var(--color-secondary)] text-white">
                {loadingConf ? "Loading…" : "Select conference…"}
              </option>
              {conferences.map((c) => (
                <option key={c.id} value={c.id} className="bg-[var(--color-secondary)] text-white">
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value=""
              onChange={(e) => {
                handleTeamSelect(e.target.value);
                setMenuOpen(false);
              }}
              disabled={loadingConf}
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 focus:outline-none disabled:opacity-50"
            >
              <option value="" className="bg-[var(--color-secondary)] text-white">
                {loadingConf ? "Loading…" : "Select team…"}
              </option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} className="bg-[var(--color-secondary)] text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-primary)] text-white border-t border-white/10 pb-safe">
        <div className="flex">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  active ? "text-[var(--color-accent)]" : "text-white/60"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="mt-0.5 leading-none">{item.label}</span>
                {item.href === "/live" && isLive && (
                  <span className="absolute top-1.5 right-1/4 h-2 w-2 rounded-full bg-red-500 animate-pulse-live" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
