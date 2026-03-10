import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/nav/NavBar";
import { findDukeGame } from "@/lib/espn";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: "Duke Basketball",
  description:
    "Track the Duke Blue Devils Men's Basketball team — schedule, roster, stats, and live games.",
  openGraph: {
    title: "Duke Basketball Tracker",
    description:
      "Live scores, schedule, roster, and stats for Duke Men's Basketball",
    type: "website",
  },
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isLive = false;
  try {
    const game = await findDukeGame();
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
        <meta name="theme-color" content="#003087" />
      </head>
      <body className="bg-[#f5f6fa] min-h-screen antialiased">
        <NavBar isLive={isLive} />
        {/* Top nav spacer + bottom tab bar spacer on mobile */}
        <div className="pt-14 pb-20 md:pb-6">
          <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
