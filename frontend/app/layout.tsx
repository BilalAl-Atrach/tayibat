import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayibat.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tayibat | AI Nutrition Guidance and Diet Plans",
    template: "%s | Tayibat",
  },
  description:
    "Tayibat helps users explore condition-based food guidance, AI nutrition answers, and personalized diet plan packages.",
  keywords: [
    "Tayibat",
    "nutrition guidance",
    "healthy diet",
    "diet plan",
    "AI nutrition assistant",
    "diabetes diet guidance",
    "healthy eating",
  ],
  applicationName: "Tayibat",
  authors: [{ name: "Tayibat" }],
  creator: "Tayibat",
  publisher: "Tayibat",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Tayibat",
    title: "Tayibat | AI Nutrition Guidance and Diet Plans",
    description:
      "Explore condition-based food guidance, AI nutrition answers, and personalized diet plan packages with Tayibat.",
  },
  twitter: {
    card: "summary",
    title: "Tayibat | AI Nutrition Guidance and Diet Plans",
    description:
      "Condition-based food guidance, AI nutrition answers, and personalized diet plan packages.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
