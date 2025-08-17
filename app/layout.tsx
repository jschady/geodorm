import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./(dashboard)/(components)/providers";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Dorm Status Dashboard",
  description: "Real-time status tracking dashboard for dorm roommates",
  applicationName: "Dorm Status",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dorm Status",
    startupImage: [
      {
        url: "/icon-512x512.png?v=2",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: [
    { rel: "icon", url: "/icon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
    { rel: "icon", url: "/icon-512x512.png?v=2", sizes: "512x512", type: "image/png" },
    { rel: "apple-touch-icon", url: "/icon-192x192.png?v=2", sizes: "192x192" },
    { rel: "shortcut icon", url: "/favicon.ico" },
  ],
  openGraph: {
    type: "website",
    siteName: "Dorm Status Dashboard",
    title: "Dorm Status Dashboard",
    description: "Real-time status tracking dashboard for dorm roommates",
    images: [
      {
        url: "/icon-512x512.png?v=2",
        width: 512,
        height: 512,
        alt: "Dorm Status Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Dorm Status Dashboard",
    description: "Real-time status tracking dashboard for dorm roommates",
    images: ["/icon-512x512.png?v=2"],
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional PWA Meta Tags not handled by metadata API */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#4f46e5" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
