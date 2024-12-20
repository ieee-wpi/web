import React from "react";
import { GatsbyImage, IGatsbyImageData } from "gatsby-plugin-image";

export interface OfficerProfileProps {
  name: string;
  position: string;
  image: IGatsbyImageData;
}

export function OfficerProfile({ name, position, image }: OfficerProfileProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <GatsbyImage
          image={image}
          alt={name}
          className="rounded-full shadow-lg w-full h-full"
          imgClassName="rounded-full"
          objectFit="cover"
        />
      </div>
      <h3 className="text-xl font-bold">{name}</h3>
      <h3 className="text-lg font-light">{position}</h3>
    </div>
  );
}
