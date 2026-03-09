import type { Metadata } from "next";
import { Heebo, Rubik } from "next/font/google";
import { club } from "@/config/club";
import { Providers } from "@/components/Providers";
import AIMentor from "@/components/AIMentor";
import "./globals.css";

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: club.name,
  description: club.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${heebo.variable} ${rubik.variable}`}
    >
      <body className="antialiased">
        <Providers>
          {children}
          <AIMentor />
        </Providers>
      </body>
    </html>
  );
}
