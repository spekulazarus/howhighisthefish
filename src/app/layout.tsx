import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SWRegister from "./sw-register";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Willi Water Level",
  description: "Offline-capable water level monitor using Web Bluetooth.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SWRegister />
        <nav className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-black/70 backdrop-blur">
          <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
            <div className="text-black dark:text-zinc-50 font-semibold">Willi</div>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-black dark:text-zinc-50 hover:underline">Live</Link>
              <Link href="/history" className="text-black dark:text-zinc-50 hover:underline">Historie</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
