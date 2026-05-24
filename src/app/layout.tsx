import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Price Tracker",
    default: "Price Tracker",
  },
  description:
    "Track Amazon product prices and get instant alerts when prices drop. Save money with automated price tracking.",
  applicationName: "Price Tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Price Tracker",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Price Tracker",
    description:
      "Track Amazon product prices and get instant alerts when prices drop.",
    siteName: "Price Tracker",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Price Tracker",
    description:
      "Track Amazon product prices and get instant alerts when prices drop.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}