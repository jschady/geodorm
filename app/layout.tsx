import React from 'react';
import '../styles/globals.css';

export const metadata = {
  title: 'Dorm Status Dashboard',
  description: 'Real-time status dashboard for dorm roommates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900">{children}</body>
    </html>
  )
}
