import React from "react";
import type { Metadata, Viewport } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import "@/styles/global.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ieee.wpi.edu"),
  title: {
    default: "IEEE WPI Student Branch",
    template: "%s | IEEE WPI Student Branch",
  },
  description:
    "The IEEE WPI Student Branch organizes engaging technical, professional, and social events at Worcester Polytechnic Institute.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = {
  themeColor: "#002855",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
