import React from "react";
import type { Viewport } from "next";

// Full-screen, no site chrome: the player page must be light for the join
// burst, and the host page fills the projector.
export const viewport: Viewport = {
  themeColor: "#002855",
  width: "device-width",
  initialScale: 1,
  // Stop accidental pinch/double-tap zoom on the answer tiles.
  maximumScale: 1,
  userScalable: false,
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <div className="select-none">{children}</div>;
}
