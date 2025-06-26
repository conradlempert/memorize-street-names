import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memorize street names",
  description: "A game that helps you memorize street names",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v10.4.0/ol.css"></link>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
