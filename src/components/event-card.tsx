import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { StaticImage } from "gatsby-plugin-image";

export type EventType = "spark" | "pcb" | "networking" | "hackathon";

interface EventCardProps {
  type: EventType;
}

const eventData = {
  pcb: {
    title: "PCB Design Class",
    date: "A-Term",
    description: "Project-oriented PCB design course.",
    href: "https://pcb.wpi.edu",
    image: (
      <StaticImage
        src="../images/events/pcb.jpg"
        alt="PCB Design Competition"
        className="rounded-t-lg"
        placeholder="blurred"
        aspectRatio={16/9}
      />
    ),
  },
  spark: {
    title: "Spark Party",
    date: "B-Term",
    description: "Student performances and sparks.",
    href: "",
    image: (
      <StaticImage
        src="../images/events/spark-party.jpg"
        alt="Spark Party"
        className="rounded-t-lg"
        placeholder="blurred"
        aspectRatio={16/9}
      />
    ),
  },
  networking: {
    title: "Networking Night",
    date: "C-Term",
    description: "Students connect with employers over dinner.",
    href: "/networking",
    image: (
      <StaticImage
        src="../images/events/networking.jpg"
        alt="Networking Night"
        className="rounded-t-lg"
        placeholder="blurred"
        aspectRatio={16/9}
      />
    ),
  },
  hackathon: {
    title: "Hackathon",
    date: "D-Term",
    description: "Two-day hardware-focused hackathon.",
    href: "",
    image: (
      <StaticImage
        src="../images/events/hackathon.jpg"
        alt="Hackathon"
        className="rounded-t-lg"
        placeholder="blurred"
        aspectRatio={16/9}
      />
    ),
  },
};

export default function EventCard({ type }: EventCardProps) {
  const { title, date, description, href, image } = eventData[type];

  const cardContent = (
    <>
      <CardContent className="p-0">{image}</CardContent>
      <CardHeader className="text-center">
        <p className="font-light text-gray-600">{date}</p>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm mt-2 text-balance">{description}</p>
      </CardContent>
    </>
  );

  return (
    <Card className="w-64 transition-all duration-300 hover:scale-105 hover:shadow-lg">
      {href ? (
        <a href={href} className="block">
          {cardContent}
        </a>
      ) : (
        cardContent
      )}
    </Card>
  );
}
