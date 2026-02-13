import type { Metadata } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-sora",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NLACE | Inteligencia Inmobiliaria",
  description: "Plataforma avanzada de análisis y datos del mercado inmobiliario en Chile.",
};

import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${lexend.variable} ${sourceSans.variable} antialiased`}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
