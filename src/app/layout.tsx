import type { Metadata } from "next";
import { Fira_Code, Instrument_Serif, Inter } from "next/font/google";

import Nav from "@/components/Nav";
import Player from "@/components/Player";
import PullCord from "@/components/PullCord";
import SiteBehaviour from "@/components/SiteBehaviour";
import SiteFooter from "@/components/SiteFooter";
import { site } from "@/lib/site";

import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
  display: "swap",
});

const SITE_URL = "https://richardokonicha.github.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: site.title,
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: site.title,
    description: site.description,
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} no-js`}
      suppressHydrationWarning
    >
      <body className="bg-paper font-sans text-ink antialiased max-md:pb-[14rem]">
        {/* Flips the document to `.js` before anything paints, so the reveal styles
            only apply when scripting is actually available, and restores the
            stored theme before the first frame so a dark-mode visitor never
            sees a white flash. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement;d.classList.remove('no-js');d.classList.add('js');try{var t=localStorage.getItem('ro-theme');if(t==='dark')d.setAttribute('data-theme','dark');}catch(e){}})();",
          }}
        />

        <a
          href="#main"
          className="fixed top-0 left-[-9999px] z-[100] bg-ink px-4 py-3 text-paper focus:top-4 focus:left-4"
        >
          Skip to content
        </a>

        <Nav />

        <main id="main">{children}</main>

        <SiteFooter />
        <PullCord />
        <Player />
        <audio id="audio" preload="metadata" />
        <SiteBehaviour />
      </body>
    </html>
  );
}