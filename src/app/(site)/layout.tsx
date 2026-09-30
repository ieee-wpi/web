import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

// Site chrome for every regular page. The /quiz screens live outside this
// group so they can take over the full viewport.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
