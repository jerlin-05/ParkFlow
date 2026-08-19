import type { Metadata } from "next";
import { Archivo, Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-archivo",
  display: "swap",
});
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ParkFlow — Smart Parking Operating System",
  description:
    "ParkFlow is a real-time parking operations platform: live booking, gate control, security incident routing, owner analytics, and multi-tenant platform admin — all synced instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${grotesk.variable} ${inter.variable} ${plex.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
