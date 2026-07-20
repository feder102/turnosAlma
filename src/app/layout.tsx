import type { Metadata } from "next";
import { Nunito, DM_Sans } from "next/font/google";
import "./globals.css";

// Claymorphism: Nunito (terminaciones redondeadas) para títulos,
// DM Sans (geométrica, legible) para el cuerpo.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Alma San Juan — Turnos online",
  description: "Depilación definitiva láser Soprano ICE. Reservá tu turno online.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Las variables de next/font van en <html>: los tokens de @theme
    // (--font-heading, --font-sans) se resuelven en :root y necesitan
    // que --font-nunito/--font-dm-sans ya existan a ese nivel.
    <html lang="es" className={`${nunito.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-clay-canvas font-sans text-clay-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
