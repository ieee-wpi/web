import React from "react";
import EventCard, { EventType } from "./event-card";

const events: EventType[] = ["pcb", "spark", "networking", "hackathon"];

interface FlagshipEventsProps {
  className?: string;
}

export default function FlagshipEvents({ className = "" }: FlagshipEventsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 place-items-center ${className}`}>
      {events.map((type) => (
        <EventCard key={type} type={type} />
      ))}
    </div>
  );
}