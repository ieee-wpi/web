import React, { useState } from "react";
import { boardBlank } from "./gameFunctions";
import LetterBox from "./letterBox";


export default function WordleGame() {
    return (
        <div className="grid grid-cols-5 gap-0">
            
                <LetterBox position={0} guess = {0}/>
                <LetterBox position={1} guess = {0}/>
                <LetterBox position={2} guess = {0}/>
                <LetterBox position={3} guess = {0}/>
                <LetterBox position={4} guess = {0}/>

                <LetterBox position={0} guess = {1}/>
                <LetterBox position={1} guess = {1}/>
                <LetterBox position={2} guess = {1}/>
                <LetterBox position={3} guess = {1}/>
                <LetterBox position={4} guess = {1}/>

                <LetterBox position={0} guess = {2}/>
                <LetterBox position={1} guess = {2}/>
                <LetterBox position={2} guess = {2}/>
                <LetterBox position={3} guess = {2}/>
                <LetterBox position={4} guess = {2}/>

                <LetterBox position={0} guess = {3}/>
                <LetterBox position={1} guess = {3}/>
                <LetterBox position={2} guess = {3}/>
                <LetterBox position={3} guess = {3}/>
                <LetterBox position={4} guess = {3}/>

                <LetterBox position={0} guess = {4}/>
                <LetterBox position={1} guess = {4}/>
                <LetterBox position={2} guess = {4}/>
                <LetterBox position={3} guess = {4}/>
                <LetterBox position={4} guess = {4}/>

                <LetterBox position={0} guess = {5}/>
                <LetterBox position={1} guess = {5}/>
                <LetterBox position={2} guess = {5}/>
                <LetterBox position={3} guess = {5}/>
                <LetterBox position={4} guess = {5}/>

        </div>
    );
}



