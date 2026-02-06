import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getSiteUrl, seoConfig } from "./seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seoConfig.titleDefault,
    template: seoConfig.titleTemplate,
  },
  description: seoConfig.description,
  applicationName: seoConfig.siteName,
  keywords: seoConfig.keywords,
  authors: [{ name: "Steven Negron" }],
  creator: "Steven Negron",
  publisher: seoConfig.siteName,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    title: seoConfig.siteName,
    description: seoConfig.description,
    siteName: seoConfig.siteName,
    images: [
      {
        url: seoConfig.ogImagePath,
        width: 1200,
        height: 630,
        alt: seoConfig.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.siteName,
    description: seoConfig.description,
    images: [seoConfig.twitterImagePath],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
