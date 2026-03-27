import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carrstret — Arcade Racing 3D",
  description: "Game balapan mobil 3D arcade. Pilih mobil, gas pol, dan cetak waktu terbaik!",
  keywords: ["racing game", "arcade", "3D", "car game", "web game"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full overflow-hidden bg-black">{children}</body>
    </html>
  );
}
