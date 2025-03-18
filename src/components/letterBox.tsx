
import React, { useContext } from "react";
import { GameContext, GameContextType } from "./gameContent"; // Updated import

interface LetterBoxProps {
    position: number;
    guess: number;
    color?: number;
}

export default function LetterBox({position, guess, color = 0 }: LetterBoxProps) {
  const { board } = useContext(GameContext) as GameContextType;
  const letter = board[guess][position];
  if(color == 2){
    return (
        <div className="bg-red-300 w-auto aspect-square text-xl text-center color-white border-2 border-gray-600 flex items-center justify-center">
        {letter}
        </div>
    );
}else if (color == 1){
    return (
        <div className="bg-green-300 w-auto aspect-square text-xl text-center color-white border-2 border-gray-600 flex items-center justify-center">
        {letter}
        </div>
    );
} else {
    return (
        <div className="bg-gray-300 w-auto aspect-square text-xl text-center color-white border-2 border-gray-600 flex items-center justify-center">
        {letter}
        </div>
    );
}
}