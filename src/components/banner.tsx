import React from "react";
import { StaticImage } from "gatsby-plugin-image";

export enum BannerType {
  Home = "Home",
  About = "About",
  Events = "Events",
  People = "People",
}

interface BannerProps {
  type: BannerType;
}

const HomeBanner = () => (
  <section className="relative h-[65vh] w-full flex items-end justify-start text-white px-6 top-0">
    <StaticImage
      src="../images/heroes/home_hero.JPG"
      alt="Tesla coils on WPI's Quad"
      className="absolute inset-0 w-full h-full object-cover z-0"
      loading="eager"
    />
    <div className="absolute bottom-6 left-6 z-10 bg-black bg-opacity-15 p-6 rounded">
      <h1 className="text-2xl md:text-3xl font-bold">
        We organize engaging <br />
        <strong>technical, professional, and social</strong> <br /> events at{" "}
        <strong>WPI</strong>.
      </h1>
    </div>
  </section>
);

const PageBanner = ({ image, title }: { image: string; title: string }) => {
  const StaticBanner = () => {
    switch (image) {
      case "about":
        return (
          <StaticImage
            src="../images/heroes/about_hero.png"
            alt={`${title} Hero`}
            className="absolute inset-0 w-full h-full object-cover z-0 hero"
            loading="eager"
          />
        );
      case "events":
        return (
          <StaticImage
            src="../images/heroes/events_hero.png"
            alt={`${title} Hero`}
            className="absolute inset-0 w-full h-full object-cover z-0 hero"
            loading="eager"
          />
        );
      case "people":
        return (
          <StaticImage
            src="../images/heroes/people_hero.png"
            alt={`${title} Hero`}
            className="absolute inset-0 w-full h-full object-cover z-0 hero"
            loading="eager"
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="relative h-[40vh] flex justify-start items-center text-white text-left px-6 lg:px-32">
      <StaticBanner />
      <div className="container-page">
        <div className="relative z-10 bg-black bg-opacity-50 p-4 rounded backdrop-blur-sm w-min">
          <h1 className="text-8xl font-bold tracking-wide">{title}</h1>
        </div>
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
