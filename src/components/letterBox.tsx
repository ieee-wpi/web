
import React, { useContext } from "react";
import { GameContext, GameContextType } from "./gameContent"; // Updated import

interface LetterBoxProps {
    position: number;
    guess: number;
}

export default function LetterBox({position, guess}: LetterBoxProps) {
  const { board, boardCols } = useContext(GameContext) as GameContextType;
  const letter = board[guess][position];
  let color =  boardCols[guess][position];
  if(color == 2){
    return (
        <div className="bg-yellow-400 w-auto aspect-square text-xl text-center color-white border-2 border-gray-600 flex items-center justify-center">
        {letter}
        </div>
    );
}else if (color == 1){
    return (
        <div className="bg-green-400 w-auto aspect-square text-xl text-center color-white border-2 border-gray-600 flex items-center justify-center">
        {letter}
        </div>
    );
} else {
    return (
        <div className="bg-gray-400 w-auto aspect-square text-xl text-center color-white border-2 border-gray-600 flex items-center justify-center">
        {letter}
        </div>
    );
}
}