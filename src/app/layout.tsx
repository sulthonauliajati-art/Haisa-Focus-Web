import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ConsentBanner } from "@/components/consent";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Haisa Focus - Focus Timer & Music Player",
  description: "A focus timer with stopwatch and pomodoro modes, plus a music player with 8D audio effect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Monetag Verification */}
        <meta name="monetag" content="3487745d9ccf3052a4aaa664b6c09e87" />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1714979233353782"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 min-h-screen`}
      >
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
