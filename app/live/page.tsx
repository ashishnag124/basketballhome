import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";
import LiveContent from "./LiveContent";

export default async function LivePage() {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);
  return <LiveContent teamConfig={tc} />;
}
