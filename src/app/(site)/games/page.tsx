import React from "react";
import Link from "next/link";
import Banner, { BannerType } from "@/components/banner";
import Wordle from "@/components/wordle";

export const metadata = {
  title: "Games",
};

export default function GamesPage() {
  return (
    <>
      <Banner type={BannerType.Wordle} />
      <main className="container-page flex flex-col ">
        <p className="mb-6 rounded-md bg-[#002855] px-4 py-3 text-center text-white">
          At an IEEE event with a live quiz on screen?{" "}
          <Link href="/quiz" className="font-bold underline">
            Join the quiz
          </Link>
        </p>
        <Wordle />
      </main>
    </>
  );
}
