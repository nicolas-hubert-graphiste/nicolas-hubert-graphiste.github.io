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
    <html lang="en">
      <body className="p-2 font-sans antialiased lg:p-6">{children}</body>
    </html>
  );
}
