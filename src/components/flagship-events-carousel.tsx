import React from "react";
import EventCard, { EventType } from "./event-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { type EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const events: EventType[] = ["pcb", "spark", "networking", "hackathon", "pcb", "spark", "networking", "hackathon"];

interface FlagshipEventsCarouselProps {
  className?: string;
}

const autoplayOptions = Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: false });

export default function FlagshipEventsCarousel({ className = "" }: FlagshipEventsCarouselProps) {
  const options: EmblaOptionsType = {
    loop: true,
    align: "start",
    containScroll: false,
    dragFree: true
  };

  return (
    <div className="relative">
      <Carousel
        opts={options}
        plugins={[autoplayOptions]}
        className={`${className}`}
      >
        <div className="overflow-hidden">
          <CarouselContent className="-ml-4">
            {events.map((type) => (
              <CarouselItem key={type} className="pt-4 pb-8 basis-full md:basis-1/2 lg:basis-1/3">
                <div className="flex justify-center">
                  <EventCard type={type} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </Carousel>
    </div>
  );
}
