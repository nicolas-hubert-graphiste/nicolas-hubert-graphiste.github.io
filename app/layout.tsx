import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NH & AB graphistes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
