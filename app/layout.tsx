import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dorm Status Dashboard",
  description: "Real-time status tracking dashboard for dorm roommates",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dorm Status",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Dorm Status Dashboard",
    title: "Dorm Status Dashboard",
    description: "Real-time status tracking dashboard for dorm roommates",
  },
  twitter: {
    card: "summary",
    title: "Dorm Status Dashboard",
    description: "Real-time status tracking dashboard for dorm roommates",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
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
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Dorm Status" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dorm Status" />
        <meta name="description" content="Real-time status tracking dashboard for dorm roommates" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#4f46e5" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#4f46e5" />

        {/* Icons */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png?v=2" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png?v=2" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon-192x192.png?v=2" color="#4f46e5" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link 
          rel="apple-touch-startup-image" 
          href="/icon-512x512.png?v=2" 
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" 
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {children}
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }

              // Handle install prompt
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                console.log('beforeinstallprompt fired');
                e.preventDefault();
                deferredPrompt = e;
                
                // Show install button (you can add this to your UI later)
                const installButton = document.getElementById('install-button');
                if (installButton) {
                  installButton.style.display = 'block';
                  installButton.addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                      if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                      } else {
                        console.log('User dismissed the A2HS prompt');
                      }
                      deferredPrompt = null;
                      installButton.style.display = 'none';
                    });
                  });
                }
              });

              // Handle successful installation
              window.addEventListener('appinstalled', (evt) => {
                console.log('App installed');
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
