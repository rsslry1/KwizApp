import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ICAS QAMS - Quiz & Activity Management System",
  description: "Inabanga College of Arts and Sciences Quiz & Activity Management System. Modern web-based platform for creating, managing, and taking quizzes with comprehensive analytics.",
  keywords: ["ICAS", "Inabanga College", "Quiz Management", "Activity Management", "Education", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "Russel Rey F. Lupian - Research and Development - Head" }],
  icons: {
    icon: "/img/ICAS Logo Blue TRBG White Logo BG v2.png",
  },
  openGraph: {
    title: "ICAS QAMS - Quiz & Activity Management",
    description: "Inabanga College of Arts and Sciences Quiz & Activity Management System",
    url: "https://icas.edu.ph",
    siteName: "ICAS QAMS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ICAS QAMS - Quiz & Activity Management",
    description: "Inabanga College of Arts and Sciences Quiz & Activity Management System",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
