import React from "react";
import Image, { type StaticImageData } from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import pcbImg from "@/images/events/pcb.jpg";
import sparkImg from "@/images/events/spark-party.jpg";
import networkingImg from "@/images/events/networking.jpg";
import hackathonImg from "@/images/events/hackathon.jpg";

export type EventType = "spark" | "pcb" | "networking" | "hackathon";

interface EventCardProps {
  type: EventType;
}

const eventData: Record<
  EventType,
  { title: string; date: string; description: string; href: string; image: StaticImageData; alt: string }
> = {
  pcb: {
    title: "PCB Design Class",
    date: "A-Term",
    description: "Project-oriented PCB design course.",
    href: "https://pcb.wpi.edu",
    image: pcbImg,
    alt: "PCB Design Class",
  },
  spark: {
    title: "Spark Party",
    date: "B-Term",
    description: "Student performances and sparks.",
    href: "",
    image: sparkImg,
    alt: "Spark Party",
  },
  networking: {
    title: "Networking Night",
    date: "C-Term",
    description: "Students connect with employers over dinner.",
    href: "/networking",
    image: networkingImg,
    alt: "Networking Night",
  },
  hackathon: {
    title: "Hackathon",
    date: "D-Term",
    description: "Two-day hardware-focused hackathon.",
    href: "",
    image: hackathonImg,
    alt: "Hackathon",
  },
};

export default function EventCard({ type }: EventCardProps) {
  const { title, date, description, href, image, alt } = eventData[type];

  const cardContent = (
    <>
      <CardContent className="p-0">
        <Image
          src={image}
          alt={alt}
          placeholder="blur"
          sizes="256px"
          className="rounded-t-lg w-full h-auto aspect-video object-cover"
        />
      </CardContent>
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
