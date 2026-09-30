import React from "react";
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
        <Wordle />
      </main>
    </>
  );
}
