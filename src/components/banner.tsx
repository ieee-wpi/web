import React from "react";
import { StaticImage } from "gatsby-plugin-image";

export enum BannerType {
  Home = "Home",
  About = "About",
  Events = "Events",
  People = "People",
  Networking = "Networking",
  NotFound = "404"
}

interface BannerProps {
  type: BannerType;
}

const HomeBanner: React.FC = () => {
  return (
    <section className="relative h-[600px] w-full text-white">
      <div className="absolute inset-0 z-0">
        <StaticImage
          src="../images/heroes/home_hero.jpg"
          alt="Tesla coils on WPI's Quad"
          className="w-full h-full"
          loading="eager"
          objectFit="cover"
          objectPosition="center 70%"
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



const PageBanner = ({ image, title }: { image: string; title: string }) => {
  const StaticBanner = () => {
    switch (image) {
      case "about":
        return (
          <StaticImage
            src="../images/heroes/about_hero.jpg"
            alt={`${title} Hero`}
            className="absolute inset-0 w-full h-full object-cover z-0 hero"
            loading="eager"
          />
        );
      case "events":
        return (
          <StaticImage
            src="../images/heroes/events_hero.jpg"
            alt={`${title} Hero`}
            className="absolute inset-0 w-full h-full object-cover z-0 hero"
            loading="eager"
          />
        );
      case "people":
        return (
          <StaticImage
            src="../images/heroes/people_hero.jpg"
            alt={`${title} Hero`}
            className="absolute inset-0 w-full h-full object-cover z-0 hero"
            loading="eager"
          />
        );
      case "networking":
        return (
          <StaticImage
          src="../images/events/networking.jpg"
          alt="Sparks Background"
          className="absolute inset-0 w-full h-full object-cover z-0 hero"
          loading = "eager"
        />
        )
      default:
        return (
          <StaticImage
            src="../images/heroes/about_hero.jpg"
            alt={`${title} Hero`}
            className="absolute inset-0 w-full h-full object-cover z-0 hero"
            loading="eager"
          />
        );
    }
  };

  return (
    <section className="relative h-[300px] w-full text-white">
      <StaticBanner />
      <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-black/80 to-transparent"></div>
      <div className="container-page h-full relative flex items-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-wide mt-12">{title}</h1>
      </div>
    </section>
  );
};

export default function Banner({ type }: BannerProps) {
  if (type === BannerType.Home) {
    return <HomeBanner />;
  }

  return <PageBanner image={type.toLowerCase()} title={type} />;
}
