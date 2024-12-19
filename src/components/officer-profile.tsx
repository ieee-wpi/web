import React from "react";

interface OfficerProfileProps {
  name: string;
  position: string;
  image: React.ReactNode;
}

export function OfficerProfile({ name, position, image }: OfficerProfileProps) {
  return (
    <div className="text-center">
      <div className="mb-4">{image}</div>
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="text-gray-500">{position}</p>
    </div>
  );
}
