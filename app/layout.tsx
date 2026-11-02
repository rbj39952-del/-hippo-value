import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Hippo Value",
  description: "Pronostics hippiques - Value Betting",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b0e14" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
