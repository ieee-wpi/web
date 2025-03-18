import React, { createContext } from "react";

export interface GameContextType {
  board: string[][];
  setBoard: React.Dispatch<React.SetStateAction<string[][]>>;
  attempt: {row: number, position: number}
  setAttempt:  React.Dispatch<React.SetStateAction<{row: number, position: number}>>;
  onDelete: () => void;
  onEnter: () => void;
  onSelectLetter: (letter: string) => void;
  goalWord: string;
  boardCols: number[][];
  setBoardCols: React.Dispatch<React.SetStateAction<number[][]>>;
}

// Create the context with a default value of null
export const GameContext = createContext<GameContextType | null>(null);