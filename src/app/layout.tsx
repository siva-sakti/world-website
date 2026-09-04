import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ConfirmHost } from "@/components/confirm";
import { AppShell } from "@/components/rail";
import { ZoneProvider } from "@/components/zone";
import { readerZone } from "@/lib/reader-zone";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Where the reader is — guessed once here, corrected by the device on mount (I-G5).
  const zone = await readerZone();
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full">
        <ZoneProvider guess={zone}>
          <AppShell>{children}</AppShell>
          <ConfirmHost />
        </ZoneProvider>
      </body>
    </html>
  );
}
