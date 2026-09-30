import React from "react";
import Image from "next/image";
import Banner, { BannerType } from "@/components/banner";
import { OfficerProfile, OfficerProfileProps } from "@/components/officer-profile";
import { Separator } from "@/components/ui/separator";
import PastOfficers from "@/components/past-officers";
import ContentCard from "@/components/content-card";

import board from "@/images/people/board.jpg";
import mary from "@/images/people/mary.jpg";
import brendon from "@/images/people/brendon.jpg";
import will from "@/images/people/will.jpg";
import dhruv from "@/images/people/dhruv.jpg";
import awad from "@/images/people/awad.jpg";
import ben from "@/images/people/ben.jpg";
import shriya from "@/images/people/shriya.jpg";
import leo from "@/images/people/leo.jpg";
import sam from "@/images/people/sam.jpg";

export const metadata = {
  title: "People",
};

// Each officer's photo is imported directly, so a missing or misnamed image is a
// build error rather than a silently blank circle. To add an officer: drop the photo
// in src/images/people/ , import it above, and add a row here.
const officers: OfficerProfileProps[] = [
  { name: "Mary Schwedatschenko", position: "President", image: mary },
  { name: "Brendon Peters", position: "Vice President", image: brendon },
  { name: "Will Keller", position: "Secretary", image: will },
  { name: "Dhruv Madan", position: "Treasurer", image: dhruv },
  { name: "Awad Mohamed", position: "Events Chair", image: awad },
  { name: "Ben Harkin", position: "Events Chair", image: ben },
  { name: "Shriya Sudharshan", position: "Public Relations Chair", image: shriya },
  { name: "Leo Shraybman", position: "Projects Chair", image: leo },
  { name: "Samuel Goldsmith", position: "Web Chair", image: sam },
];

export default function PeoplePage() {
  return (
    <>
      <Banner type={BannerType.People} />
      <main className="container-page">
        <ContentCard title="2026 Officer Board">
          <div className="flex flex-col space-y-8">
            <div className="flex justify-center">
              <div className="relative w-full max-w-4xl overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={board}
                  alt="2024-2025 Officer Board"
                  placeholder="blur"
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="w-full h-auto hover:scale-102 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
            <Separator className="bg-slate-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {officers.map((officer, idx) => (
                <OfficerProfile
                  key={idx}
                  name={officer.name}
                  position={officer.position}
                  image={officer.image}
                />
              ))}
            </div>
          </div>
        </ContentCard>
        <div className="mt-12">
          <PastOfficers />
        </div>
      </main>
    </>
  );
}
