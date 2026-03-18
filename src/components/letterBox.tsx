
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
  var cornerStyle = ''
  if(position + guess == 0){
    cornerStyle = ' rounded-tl-md'
  } else if (position == 4 && guess == 0){
    cornerStyle = ' rounded-tr-md'
  } else if (position == 0 && guess == 5){
        cornerStyle = ' rounded-bl-md'
  } else if (position == 4 && guess == 5){
        cornerStyle = ' rounded-br-md'
  }
  if(color == 2){
    return (
        <div className={"bg-yellow-400 w-auto aspect-square text-xl text-center color-white border border-gray-400 flex items-center justify-center" + cornerStyle}>
        {letter}
        </div>
    );
}else if (color == 1){
    return (
        <div className={"bg-green-400 w-auto aspect-square text-xl text-center color-white border border-gray-400 flex items-center justify-center"  + cornerStyle}>
        {letter}
        </div>
    );
} else {
    return (
        <div className={"bg-gray-200 w-auto aspect-square text-xl text-center color-white border border-gray-400 flex items-center justify-center"  + cornerStyle}>
        {letter}
        </div>
    );
}
}