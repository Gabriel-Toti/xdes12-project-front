import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CASAR",
  description: "by HGBC Consultorias e Sistemas Ltda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}