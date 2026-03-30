import type { Metadata } from "next";
import Image from "next/image";
import { Geist } from "next/font/google";
import Link from "next/link";
import WakeUp from "./wakeup";
import "./globals.css";
import { ThemeButton } from "./components/themeButton";
import { ThemeProvider } from "./context/themeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Coach Team Tools",
  description: "Banaan & Rooster planning tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <ThemeProvider>
          <WakeUp />
          <nav className="border-b border-garijp-red bg-garijp-blue ">

            <div className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
              <Link href="/" className={`text-lg font-semibold tracking-tight text-white`}>
                <Image src = "/images/garijp_logo_watersportcentrum_white-e1615810973602.webp" alt="Garijp Logo"  width={128} height={64} className="inline mr-2"/>
              </Link>
              <Link
                href="/banaan"
                className="text-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-400"
              >
                Banaan
              </Link>
              <Link
                href="/rooster"
                className="text-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-400"
              >
                Rooster
              </Link>
              <div className="ml-auto"/>
              <ThemeButton />
            </div>
          </nav>
          <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
