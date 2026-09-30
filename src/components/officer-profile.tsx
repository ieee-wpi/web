import React from "react";
import Image, { type StaticImageData } from "next/image";

export interface OfficerProfileProps {
  name: string;
  position: string;
  image: StaticImageData;
}

export function OfficerProfile({ name, position, image }: OfficerProfileProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <Image
          src={image}
          alt={name}
          width={150}
          height={150}
          placeholder="blur"
          className="rounded-full shadow-lg object-cover"
          style={{ width: 150, height: 150 }}
        />
      </div>
      <h3 className="text-xl font-bold">{name}</h3>
      <h3 className="text-lg font-light text-gray-600">{position}</h3>
    </div>
  );
}
