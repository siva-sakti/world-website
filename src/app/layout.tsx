import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// One typeface, set once (see Design stance). Geist is a neutral default; the
// visual identity arrives later as the owner's own hand-drawn work.
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "world",
  description: "A private place to keep and grow ideas.",
};

// viewport-fit=cover lets env(safe-area-inset-*) report real values on notched
// phones, so floating chrome isn't hidden under the notch / home indicator.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
