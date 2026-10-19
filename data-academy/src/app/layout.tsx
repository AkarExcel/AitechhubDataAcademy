import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Data Academy — Learn Data Science, AI & Machine Learning",
    template: "%s | Data Academy",
  },
  description:
    "Master Data Science, Data Analytics, Artificial Intelligence, and Machine Learning through structured courses, hands-on coding exercises, and real-world projects.",
  keywords: [
    "data science",
    "machine learning",
    "AI education",
    "data analytics",
    "Python",
    "SQL",
    "online learning",
  ],
  openGraph: {
    type: "website",
    title: "Data Academy",
    description: "Learn Data Science, AI & Machine Learning online",
    siteName: "Data Academy",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), var(--font-sans)" }}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
