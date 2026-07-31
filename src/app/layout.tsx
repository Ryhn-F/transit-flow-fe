import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/query-client";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TransitFlow AI",
  description:
    "Real-time station congestion monitoring and field survey platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        <ReactQueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
