"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { TeamConfig } from "@/lib/team-config";
import { TEAM_COOKIE } from "@/lib/team-config";

export async function setTeam(config: TeamConfig): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TEAM_COOKIE, JSON.stringify(config), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
