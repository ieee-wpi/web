// src/pages/games.tsx
import React, { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";
import Layout from "../components/layout";
import Banner, { BannerType } from "../components/banner";
import Description from "@/components/description";
import ContentCard from "@/components/content-card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import WordleGame from "@/components/wordleGame";
import Keyboard from "@/components/keyboard";
import { GameContext } from "@/components/gameContent"; // Updated import
import { boardBlank, boardZeros } from "@/components/gameFunctions";
import dBase from "../../static/data/dictionary";
// import pool from "../../static/data/wordPool";

export default function GamesPage() {

  const [board, setBoard] = useState(boardBlank);
  const [boardCols, setBoardCols] = useState(boardZeros);
  const [attempt, setAttempt] = useState({row:0, position: 0});
  const [goalWord, setGoalWord] = useState("");
  const [dictionary, setDictionary] = useState([""])
  const [pool, setPool] = useState([""])
useEffect(() => {
  const loadWord = async () => {
    const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vS-nQIVmNoW0oRl8pxNxQpA55yicMESduV7kRnQh9m8IgLtBpe_le0PCiXZPQso9aD2_OlrAz4vNBBj/pub?output=csv");
    const text = await res.text()
    const parsedPool = text.split("\n").map(r => r.trim())
    setPool(parsedPool)

    const dRes = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vS-nQIVmNoW0oRl8pxNxQpA55yicMESduV7kRnQh9m8IgLtBpe_le0PCiXZPQso9aD2_OlrAz4vNBBj/pub?gid=768927172&single=true&output=csv");
    const dText = await dRes.text()
    const dAdd = dText.split("\n").map(r => r.trim())

    setDictionary([...dBase, ...dAdd, ...parsedPool])

    const today = new Date();
    today.setHours(0, 0, 0, 0)
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24))
    const index = daysSinceEpoch % parsedPool.length

    const dailyWord = parsedPool[index].toUpperCase()
    setGoalWord(dailyWord)
  };

  loadWord();
}, []);
console.log(dictionary)
  const isWord = () => { return dictionary.includes(board[attempt.row].join("").toLowerCase()) || pool.includes(board[attempt.row].join("").toLowerCase()) }
  const checkRow = () => {
    let newCols = [...boardCols];

    for (let i = 0; i < 5; i++) {
      if (board[attempt.row][i] == goalWord[i]) {
        newCols[attempt.row][i] = 1;
      } else if (goalWord.includes(board[attempt.row][i])) {
        newCols[attempt.row][i] = 2;
      }
    }
    if(newCols[attempt.row].every(val => val === 1)){
      flashMessage("Great Job!! Be sure to come back tomorrow : )", 'green', 10000)
    }
    setBoardCols(newCols);
  }
  const onSelectLetter = (val: string) => {
    const newBoard = [...board];
    newBoard[attempt.row][attempt.position] = val;
    setBoard(newBoard);
    if (attempt.position != 5) {
      setAttempt({ row: attempt.row, position: attempt.position + 1 })
    }
  }
  const onDelete = () => {

    if (attempt.position == 0) return;
    const newBoard = [...board];
    newBoard[attempt.row][attempt.position - 1] = "";
    setBoard(newBoard);
    if (attempt.position != 0) {
      setAttempt({ row: attempt.row, position: attempt.position - 1 })
    }

  }
  const [message, setMessage] = useState("")
  const [messageClass, setMessageClass] = useState("")
  const flashMessage = (messageP: string, color: string = "red", duration: number = 1000) => {
    setMessage(messageP)
    setMessageClass(color == "red" ? 'bg-red-200 text-xl text-black ' : 'bg-green-200 text-xl text-black ')
    setTimeout(() => {
      setMessage("")
      setMessageClass('')
    }, duration)
  }
  const onEnter = () => {
    if (attempt.position != 5) {
      flashMessage("Word must be 5 letters")
      return
    };
    if (!isWord()) {
      flashMessage("Word invalid")
      return
    }
    checkRow();
    setAttempt({ row: attempt.row + 1, position: 0 });
  }
  return (
    <Layout>
      <Banner type={BannerType.Wordle} />
      <main className="container-page flex flex-col ">
        <section className="">
          <h1 className="text-3xl">IEEE-ordle</h1>
          <h2 className={'min-h-[55px] h-min text-center rounded-xl justify-center w-1/2 p-3 ml-auto mr-auto my-0 mb-5 ' + messageClass}>{message}</h2>
        </section>
        <section className="w-2/5 mx-auto items-center text-center">
          <GameContext.Provider value={{
            board, setBoard, attempt, setAttempt, onDelete, onEnter, onSelectLetter, goalWord, boardCols, setBoardCols
          }}>
            <WordleGame />
            <Keyboard />
          </GameContext.Provider>
        </section>
      </main>
    </Layout>
  );
}