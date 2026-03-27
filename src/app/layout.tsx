import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tantech — Recruitment Dashboard",
  description: "Modern ATS recruitment dashboard by Tantech for managing candidates and applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground transition-colors duration-200`}
      >
        <AuthSessionProvider>
          <ThemeProvider>
            {children}
            <Toaster position="bottom-right" richColors />
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
