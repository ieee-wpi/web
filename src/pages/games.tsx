// src/pages/games.tsx
import React, { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";
import Layout from "../components/layout";
import Banner, { BannerType } from "../components/banner";
import Description from "@/components/description";
import ContentCard from "@/components/content-card";
import { Button } from "@/components/ui/button";
import { ExternalLink} from "lucide-react";
import WordleGame from "@/components/wordleGame";
import Keyboard from "@/components/keyboard";
import { GameContext } from "@/components/gameContent"; // Updated import
import { boardBlank, boardZeros } from "@/components/gameFunctions";
import dictionary from "../../static/data/dictionary";
import pool from "../../static/data/wordPool";

export default function GamesPage() {

  const [board, setBoard] = useState(boardBlank);
  const [boardCols, setBoardCols] = useState(boardZeros);
  const [attempt, setAttempt] = useState({row:0, position: 0});
  const [goalWord, setGoalWord] = useState("");

  if(goalWord == ""){
    let i = Math.floor(Math.random() *pool.length);
    setGoalWord(pool[i]);
  }
  console.log(goalWord);
  // const goalWord = "HELLO";
  const isWord = () => {return dictionary.includes(board[attempt.row].join("").toLowerCase()) || pool.includes(board[attempt.row].join("").toLowerCase())}
  const checkRow =() => {
    let newCols = [...boardCols]; 

    for(let i = 0; i < 5; i++){
      if(board[attempt.row][i] == goalWord[i]){
        newCols[attempt.row][i] = 1;
      } else if (goalWord.includes(board[attempt.row][i])){
        newCols[attempt.row][i] = 2;
      }
    }
    setBoardCols(newCols);
  }
  const onSelectLetter = (val: string) => {
    const newBoard = [...board];
    newBoard[attempt.row][attempt.position] = val;
    setBoard(newBoard);
    if(attempt.position != 5){
      setAttempt({row: attempt.row, position: attempt.position + 1})
    }
  }
  const onDelete = () => {

    if(attempt.position == 0) return;
      const newBoard = [...board];
      newBoard[attempt.row][attempt.position - 1] = "";
      setBoard(newBoard);
      if(attempt.position != 0){
        setAttempt({row: attempt.row, position: attempt.position - 1})
      }

  }

  const onEnter = () => {
    if(attempt.position != 5) return;
    if(!isWord()) return;
    checkRow();
    setAttempt({row: attempt.row + 1, position: 0});
  }
  return (
    <Layout>
      <Banner type={BannerType.About} />
      <main className="container-page flex flex-col gap-14">
        <section>
          <h1>IEEE-ordle</h1>
        </section>
        <section className = "w-2/5 mx-auto items-center text-center">
        <GameContext.Provider value = {{
          board, setBoard, attempt, setAttempt, onDelete, onEnter, onSelectLetter, goalWord, boardCols, setBoardCols
          }}>
          <WordleGame/>
          <Keyboard/>
        </GameContext.Provider>
        </section>
      </main>
    </Layout>
  );
}