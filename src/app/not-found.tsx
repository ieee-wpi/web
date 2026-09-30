import React from "react";
import Link from "next/link";
import Banner, { BannerType } from "@/components/banner";

export const metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <>
      <Banner type={BannerType.NotFound} />
      <main className="container-page flex-1 min-h-[calc(100vh-550px)]">
        <p className="text-xl h-full flex flex-col justify-center">
          <strong className="mb-2">Sorry, the page you were looking for was not found.</strong>
          <br />
          <Link href="/" className="text-blue-600 hover:underline">Return home</Link>
        </p>
      </main>
    </>
  );
}
