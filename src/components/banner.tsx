import React from "react";
import Image, { type StaticImageData } from "next/image";

import aboutHero from "@/images/heroes/about_hero.jpg";
import eventsHero from "@/images/heroes/events_hero.jpg";
import homeHero from "@/images/heroes/home_hero.jpg";
import peopleHero from "@/images/heroes/people_hero.jpg";
import wordleHero from "@/images/heroes/wordle_hero.jpg";
import networkingImg from "@/images/events/networking.jpg";

export enum BannerType {
  Home = "Home",
  About = "About",
  Events = "Events",
  People = "People",
  Alumni = "Alumni",
  Networking = "Networking",
  Wordle = "Wordle",
  NotFound = "404",
}

interface BannerProps {
  type: BannerType;
}

// next/image takes an imported image object, so this can be a plain lookup.
// (Gatsby's StaticImage required a literal src, which is why this used to be a switch.)
const heroes: Record<BannerType, { src: StaticImageData; alt: string }> = {
  [BannerType.Home]: { src: homeHero, alt: "Tesla coils on WPI's Quad" },
  [BannerType.About]: { src: aboutHero, alt: "About Hero" },
  [BannerType.Events]: { src: eventsHero, alt: "Events Hero" },
  [BannerType.People]: { src: peopleHero, alt: "People Hero" },
  [BannerType.Alumni]: { src: networkingImg, alt: "Sparks Background" },
  [BannerType.Networking]: { src: networkingImg, alt: "Sparks Background" },
  [BannerType.Wordle]: { src: wordleHero, alt: "Sparks Background" },
  [BannerType.NotFound]: { src: aboutHero, alt: "404 Hero" },
};

const HomeBanner: React.FC = () => {
  const { src, alt } = heroes[BannerType.Home];

  return (
    <section className="relative h-[600px] w-full text-white">
      <div className="absolute inset-0 z-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 70%" }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>

      <div className="container-page h-full relative">
        <div className="absolute bottom-8 z-10 rounded-lg">
          <h1 className="text-2xl lg:text-3xl leading-tight rounded-lg">
            We organize engaging <br />
            <strong>technical, professional, and social</strong> <br />
            events at <strong>WPI</strong>.
          </h1>
        </div>
      </div>
    </section>
  );
};

const PageBanner = ({ type }: { type: BannerType }) => {
  const { src, alt } = heroes[type];

  return (
    <section className="relative h-[300px] w-full text-white">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="object-cover z-0"
      />
      <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-black/80 to-transparent"></div>
      <div className="container-page h-full relative flex items-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-wide mt-12">
          {type}
        </h1>
      </div>
    </section>
  );
};

export default function Banner({ type }: BannerProps) {
  if (type === BannerType.Home) {
    return <HomeBanner />;
  }

  return <PageBanner type={type} />;
}
