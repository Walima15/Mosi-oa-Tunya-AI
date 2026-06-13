import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const heading = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.meaning}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [
    "Africa fintech",
    "cross-border remittance",
    "AI financial agent",
    "send money to Africa",
    "Zambia",
    "Stellar",
    "mobile money",
  ],
  authors: [{ name: BRAND.name }],
  openGraph: {
    title: BRAND.name,
    description: BRAND.tagline,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04101f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
