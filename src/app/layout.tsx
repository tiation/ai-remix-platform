import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/Providers';
import { LoadingFallback } from '@/components/LoadingFallback';
import { Analytics } from '@/components/Analytics';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Remix Platform",
  description: "Create, remix, and edit web projects with Claude AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-inter antialiased bg-gray-50 dark:bg-gray-900`}
      >
        <ErrorBoundary>
          <Providers>
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
            <Analytics />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
