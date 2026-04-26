import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Lato is the brand body font (matches theograce.com — see the
// `--font-family-main-*` CSS tokens on production). Big Caslon is the
// display font but proprietary; we keep the Georgia-class fallback chain
// in blocks/theme.ts and component CSS until a self-hosted Big Caslon
// licence lands.
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Theo Grace — Campaign Generator",
  description: "Email campaign creation pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lato.variable}>
      <body className={lato.className}>
        <main className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
