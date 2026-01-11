"use client"

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { useState } from "react";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="shell">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="main">
            {children}
            {/* Hamburger button for mobile */}
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(true)}
              style={{
                position: 'fixed',
                top: 10,
                left: 10,
                zIndex: 1000,
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'none',
                fontSize: 16,
              }}
            >
              ☰
            </button>
          </main>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .hamburger {
              display: block !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
