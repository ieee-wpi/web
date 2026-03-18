import React, { useCallback, useContext, useEffect } from "react";
import Key from "./ui/key";
import { GameContext } from "./gameContent";

export default function Keyboard() {
    const l1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
    const l2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
    const l3 = ["Z", "X", "C", "V", "B", "N", "M"];
    const gameContext = useContext(GameContext);
    if (!gameContext) return; 
    const {onDelete, onEnter, onSelectLetter } = gameContext;
    const keyboardInput = useCallback((event: KeyboardEvent) => {
        if (event.key === "Enter") {
            onEnter();
        } else if (event.key === "Backspace") {
            onDelete();
        } else if (/^[a-zA-Z]$/.test(event.key)) {
            onSelectLetter(event.key.toUpperCase());
        }
    }, [onDelete, onEnter, onSelectLetter]);

    useEffect(() => {
        document.addEventListener("keydown", keyboardInput);
        return () => document.removeEventListener("keydown", keyboardInput);
    }, [keyboardInput]);

    return (
        <div className="text-center mt-5">
            <div className="flex justify-center mb-2">
                {l1.map((key, index) => (
                    <Key key={index} val={key} />
                ))}
            </div>
            <div className="flex justify-center mb-2">
                {l2.map((key, index) => (
                    <Key key={index} val={key} />
                ))}
            </div>
            <div className="flex justify-center">
                <Key key="enter" val="ENTER" />
                {l3.map((key, index) => (
                    <Key key={index} val={key} />
                ))}
                <Key key="delete" val="DELETE" />
            </div>
        </div>
    );
}
