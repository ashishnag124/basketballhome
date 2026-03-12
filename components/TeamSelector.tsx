"use client";

import { useState, useEffect } from "react";
import { setTeam } from "@/app/actions/set-team";
import type { TeamConfig } from "@/lib/team-config";

interface Conference {
  id: string;
  name: string;
  shortName: string;
}

interface TeamOption {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export default function TeamSelector({ currentTeam }: { currentTeam: TeamConfig }) {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [selectedConf, setSelectedConf] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadingConf, setLoadingConf] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => setConferences(d.conferences || []))
      .finally(() => setLoadingConf(false));
  }, []);

  async function handleConferenceChange(confId: string) {
    setSelectedConf(confId);
    setTeams([]);
    if (!confId) return;
    setLoadingTeams(true);
    const res = await fetch(`/api/teams?conference=${confId}`);
    const data = await res.json();
    setTeams(data.teams || []);
    setLoadingTeams(false);
  }

  async function handleTeamSelect(team: TeamOption) {
    setSaving(true);
    const config: TeamConfig = {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
      accentColor: team.secondaryColor,
      logo: team.logo,
    };
    await setTeam(config);
    window.location.reload();
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Change Team</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white"
          value={selectedConf}
          onChange={(e) => handleConferenceChange(e.target.value)}
          disabled={loadingConf}
        >
          <option value="">{loadingConf ? "Loading conferences…" : "Select conference…"}</option>
          {conferences.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white"
          value=""
          onChange={(e) => {
            const team = teams.find((t) => t.id === e.target.value);
            if (team) handleTeamSelect(team);
          }}
          disabled={!selectedConf || loadingTeams || saving}
        >
          <option value="">{loadingTeams ? "Loading teams…" : saving ? "Saving…" : "Select team…"}</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Currently tracking: <span className="font-medium text-gray-600">{currentTeam.name}</span>
      </p>
    </div>
  );
}
