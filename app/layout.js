import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Steam Profile Checker | Trust Score & Legitimacy Signals",
  description:
    "Paste a Steam profile to get a neutral Trust Score based on public Steam signals (account age, profile transparency, Steam level, ban indicators, and optional game hours). Not a cheat detector.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "Steam Profile Checker",
    description:
      "Neutral Trust Score for Steam profiles based on public signals. Not a cheat detector.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
