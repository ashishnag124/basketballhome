export interface TeamConfig {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo: string;
}

export const DEFAULT_TEAM: TeamConfig = {
  id: "150",
  name: "Duke Blue Devils",
  shortName: "Duke",
  primaryColor: "#003087",
  secondaryColor: "#001A57",
  accentColor: "#B5A36A",
  logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png",
};

export const TEAM_COOKIE = "team_config";

export function getTeamConfig(cookieValue?: string): TeamConfig {
  if (!cookieValue) return DEFAULT_TEAM;
  try {
    const parsed = JSON.parse(cookieValue);
    // Validate required fields
    if (parsed.id && parsed.name && parsed.primaryColor) {
      return parsed as TeamConfig;
    }
    return DEFAULT_TEAM;
  } catch {
    return DEFAULT_TEAM;
  }
}

/** Normalize a raw hex color from ESPN (may or may not have #) */
export function normalizeColor(hex: string): string {
  if (!hex) return "#000000";
  return hex.startsWith("#") ? hex : `#${hex}`;
}
