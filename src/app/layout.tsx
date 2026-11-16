import type { Metadata } from "next";
import { Fira_Code, Instrument_Serif, Inter } from "next/font/google";

import Nav from "@/components/Nav";
import Player from "@/components/Player";
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
    images: [
      {
        url: "/img/portrait.jpg",
        width: 760,
        height: 760,
        alt: "Richard Okonicha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/img/portrait.jpg"],
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
      <body className="bg-paper font-sans text-ink antialiased max-md:pb-20">
        {/* Flips the document to `.js` before anything paints, so the reveal
            styles only apply when scripting is actually available. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');",
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
        <Player />
        <audio id="audio" preload="none" />
        <SiteBehaviour />
      </body>
    </html>
  );
}