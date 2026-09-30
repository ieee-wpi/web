import React from "react";
import type { ShapeName } from "@/lib/quiz/shapes";

const PATHS: Record<ShapeName, React.ReactNode> = {
  triangle: <polygon points="50,8 94,88 6,88" />,
  diamond: <polygon points="50,4 96,50 50,96 4,50" />,
  circle: <circle cx="50" cy="50" r="44" />,
  square: <rect x="10" y="10" width="80" height="80" />,
};

export default function ShapeIcon({ shape, className }: { shape: ShapeName; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor" aria-hidden="true">
      {PATHS[shape]}
    </svg>
  );
}
