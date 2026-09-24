import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@ridgeline/ui/globals.css";

import { AppShell } from "../components/app-shell";
import { Providers } from "./providers";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ridgeline Promotions",
  description: "See what the till will charge, and why. Change deals without a ticket.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
