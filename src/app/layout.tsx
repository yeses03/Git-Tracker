import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Commit Arena", template: "%s · Commit Arena" },
  description: "A live leaderboard for friendly GitHub commit contests.",
  openGraph: {
    title: "Commit Arena",
    description: "A live leaderboard for friendly GitHub commit contests.",
    type: "website",
    siteName: "Commit Arena",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
