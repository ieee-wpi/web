import React from "react";
import Navbar from "../components/navbar";
import { StaticImage } from "gatsby-plugin-image";
import Footer from "../components/footer";
import Layout from "@/components/layout";
import Banner, { BannerType } from "@/components/banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfficerProfile } from "@/components/officer-profile";

interface Officer {
  name: string;
  position: string;
  image: React.ReactNode;
}

export default function PeoplePage() {
  const officers: Officer[] = [
    {
      name: "Daniel Gorbunov",
      position: "President",
      image: (
        <StaticImage
          src="../images/people/gorbunov.jpg"
          alt="Daniel Gorbunov"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: "Hubert Liu",
      position: "Vice President",
      image: (
        <StaticImage
          src="../images/people/liu.jpg"
          alt="Hubert Liu"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: "Ryan Ranjitkar",
      position: "Secretary",
      image: (
        <StaticImage
          src="../images/people/ranjitkar.jpg"
          alt="Ryan Ranjitkar"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: "George Shi",
      position: "Treasurer",
      image: (
        <StaticImage
          src="../images/people/shi.jpg"
          alt="George Shi"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: "Jack Kamataris",
      position: "Events Officer",
      image: (
        <StaticImage
          src="../images/people/kamataris.jpg"
          alt="Jack Kamataris"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: "Todd Petry",
      position: "Events Officer",
      image: (
        <StaticImage
          src="../images/people/petry.jpg"
          alt="Todd Petry"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: "Brendon Peters",
      position: "Public Relations Chair",
      image: (
        <StaticImage
          src="../images/people/peters.jpg"
          alt="Brendon Peters"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: "Will Buchta",
      position: "Projects Chair",
      image: (
        <StaticImage
          src="../images/people/buchta.jpg"
          alt="J"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: "Artem Frenk",
      position: "Web Chair",
      image: (
        <StaticImage
          src="../images/people/frenk.jpg"
          alt="Artem Frenk"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
  ];

  return (
    <Layout>
      <Banner type={BannerType.People} />
      <main className="container-page">
        <Card className="my-10">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Current Officers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {officers.map((officer, idx) => (
                <OfficerProfile
                  key={idx}
                  name={officer.name}
                  position={officer.position}
                  image={officer.image}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        {/* <section className="py-10 px-6 text-center">
          <StaticImage
            src="../images/people/officer_board.png"
            alt="2024-2025 Officer Board"
            className="rounded shadow-lg mb-4"
            placeholder="blurred"
          />
          <p className="text-lg font-medium underline">
            2024-2025 Officer Board
          </p>
        </section> */}
        {/* <section className="py-10 px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Archive of Officers</h2>
          <p className="text-gray-500">TODO: Cards for old officer boards</p>
        </section> */}
      </main>
    </Layout>
  );
}
