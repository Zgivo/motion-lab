import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motion Lab · Experimental motion for the modern web",
  description: "A collection of interactive motion experiments built with React, GSAP, Framer Motion and WebGL.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
