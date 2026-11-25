import type { Metadata } from "next";
import { Fira_Code, Instrument_Serif, Inter } from "next/font/google";

import Nav from "@/components/Nav";
import PullCord from "@/components/PullCord";
import SpotifyEmbed from "@/components/SpotifyEmbed";
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

/* 1200×630, rendered from paper and ink so a link unfurls in the site's own
   colours rather than a grey placeholder. */
const socialImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Richard Okonicha — engineer and writer",
};

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
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [socialImage.url],
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
      <head>
        {/* Restores the stored theme before anything paints, so a dark-mode
            visitor never sees a white flash, and flips the document to `.js`
            so the reveal styles only apply when scripting is available. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement;d.classList.remove('no-js');d.classList.add('js');try{var t=localStorage.getItem('ro-theme');if(t==='dark')d.setAttribute('data-theme','dark');}catch(e){}})();",
          }}
        />
      </head>
      <body className="bg-paper font-sans text-ink antialiased max-md:pb-[14rem]">
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
        <SpotifyEmbed />
        <SiteBehaviour />
      </body>
    </html>
  );
}