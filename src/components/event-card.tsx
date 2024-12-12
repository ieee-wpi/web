import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { StaticImage } from "gatsby-plugin-image";

interface EventCardProps {
  title: string;
  date: string;
  imageComponent: React.ReactNode;
  href?: string;
}

export default function EventCard({
  title,
  date,
  imageComponent,
  href,
}: EventCardProps) {
  const cardContent = (
    <>
      <CardContent className="p-0">{imageComponent}</CardContent>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-gray-500">{date}</p>
      </CardHeader>
    </>
  );

  return (
    <Card className="w-56 transition-all duration-300 hover:scale-105 hover:shadow-lg">
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
