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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop top nav */}
      <nav
        className={`hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 py-3 bg-[var(--color-primary)] text-white transition-shadow ${
          scrolled ? "shadow-lg" : ""
        }`}
      >
        <Link href="/" className="flex items-center gap-2 font-['Oswald',sans-serif] text-xl font-bold tracking-wide">
          <span className="text-[var(--color-accent)]">{teamConfig.shortName.toUpperCase()}</span>
          <span>BASKETBALL</span>
        </Link>
        <div className="flex items-center gap-1">
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
