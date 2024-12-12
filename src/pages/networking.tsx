import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { StaticImage } from "gatsby-plugin-image";

export default function NetworkingPage() {
  return (
    <>
      <Navbar></Navbar>
      <section className="relative h-[40vh] w-full flex items-end justify-start text-white text-left px-6">
        <StaticImage
          src="../images/heroes/networking_hero.jpg"
          alt="Sparks Background"
          className="absolute inset-0 w-full h-full object-cover z-0 hero"
        />
      </section>
      <Footer />
    </>
  );
}
