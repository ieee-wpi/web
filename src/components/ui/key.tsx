import { Delete } from "lucide-react";
import React, { useContext } from "react";
import { GameContext, GameContextType } from "../gameContent";

interface KeyProps {
    val: string;
}

export default function Key({ val}: KeyProps) {
  const gameContext = useContext(GameContext);
  
  const selectLetter = () => {
    if (!gameContext) return; 
    
    const {onDelete, onEnter, onSelectLetter } = gameContext;
    
    if (val === "DELETE") {
      onDelete();
    }else if (val === "ENTER") {
      onEnter();
    } else{
      onSelectLetter(val);
    }
    
    

    
    
  
  };

  if (val === "DELETE") {
    return (
      <div className="w-16 m-1 ps-4 bg-gray-200 rounded-md flex items-center text-xl cursor-pointer" onClick={selectLetter}>
        <Delete />
      </div>
    );
  }
  
  if (val === "ENTER") {
    return (
      <div className="w-16 m-1 p-2 bg-gray-200 rounded-md text-sm cursor-pointer" onClick={selectLetter}>
        <strong>{val}</strong>
      </div>
    );
  }
  
  return (
    <div className="m-1 p-2 bg-gray-200 rounded-md text-xl cursor-pointer" onClick={selectLetter}>
      {val}
    </div>
  );
}