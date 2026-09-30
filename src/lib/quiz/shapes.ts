// Answer slot -> color + shape, in Kahoot's familiar order. True/False
// questions use the first two slots.
export const SHAPES = [
  { shape: "triangle", label: "Red triangle", bg: "bg-quiz-red", text: "text-quiz-red", fill: "#E21B3C" },
  { shape: "diamond", label: "Blue diamond", bg: "bg-quiz-blue", text: "text-quiz-blue", fill: "#1368CE" },
  { shape: "circle", label: "Yellow circle", bg: "bg-quiz-yellow", text: "text-quiz-yellow", fill: "#D89E00" },
  { shape: "square", label: "Green square", bg: "bg-quiz-green", text: "text-quiz-green", fill: "#26890C" },
] as const;

export type ShapeName = (typeof SHAPES)[number]["shape"];
