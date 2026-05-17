import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getSession } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "MarketPlace - Buy & Sell Anything",
    template: "%s | MarketPlace",
  },
  description:
    "The fastest way to buy and sell anything locally. Browse thousands of classified ads in your area.",
  keywords: ["classified ads", "buy", "sell", "marketplace", "local ads"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "MarketPlace",
    title: "MarketPlace - Buy & Sell Anything",
    description: "The fastest way to buy and sell anything locally.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
