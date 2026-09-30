import React from "react";
import Banner, { BannerType } from "@/components/banner";
import FlagshipEvents from "@/components/flagship-events";
import ContentCard from "@/components/content-card";
import EventsCalendar from "@/components/events-calendar";

export const metadata = {
  title: "Events",
};

export default function EventsPage() {
  return (
    <>
      <Banner type={BannerType.Events} />
      <main className="container-page">
        <p className="text-xl leading-relaxed mb-12 max-w-3xl">
          We typically host weekly events, usually with free food, during the school year. We also run several annual{" "}
            flagship events.
        </p>
        <p className="text-xl leading-relaxed mb-12 font-bold max-w-3xl">Open Exec meetings are held every Wednesday at 5:00 pm in the IEEE lounge</p>
        <ContentCard title="Upcoming Events">
          <EventsCalendar />
        </ContentCard>
        <div className="mt-12">
          <ContentCard title="Flagship Events">
            <FlagshipEvents />
          </ContentCard>
        </div>
      </main>
    </>
  );
}
