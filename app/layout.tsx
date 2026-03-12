import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/nav/NavBar";
import { findTeamGame } from "@/lib/espn";
import { cookies } from "next/headers";
import { getTeamConfig, TEAM_COOKIE } from "@/lib/team-config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: "Basketball Tracker",
  description: "Track any college basketball team — schedule, roster, stats, and live games.",
  openGraph: {
    title: "College Basketball Tracker",
    description: "Live scores, schedule, roster, and stats for college basketball",
    type: "website",
  },
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const tc = getTeamConfig(cookieStore.get(TEAM_COOKIE)?.value);

  let isLive = false;
  try {
    const game = await findTeamGame(tc.id);
    isLive = game?.status === "in";
  } catch {
    // non-fatal
  }

  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content={tc.primaryColor} />
        <style>{`
          :root {
            --color-primary: ${tc.primaryColor};
            --color-secondary: ${tc.secondaryColor};
            --color-accent: ${tc.accentColor};
          }
        `}</style>
      </head>
      <body className="bg-[#f5f6fa] min-h-screen antialiased">
        <NavBar isLive={isLive} teamConfig={tc} />
        {/* Top nav spacer + bottom tab bar spacer on mobile */}
        <div className="pt-14 pb-20 md:pb-6">
          <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
