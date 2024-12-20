import React, { useEffect, useState } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import Layout from "@/components/layout";
import Banner, { BannerType } from "@/components/banner";
import FlagshipEvents from "@/components/flagship-events";
import ContentCard from "@/components/content-card";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date()),
  getDay,
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

export default function EventsPage() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/data/events.json");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Fetched data is not an array");
        }

        const formattedEvents = data.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));

        setCalendarEvents(formattedEvents);
        setError(null);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      }
    };

    fetchEvents();
  }, []);

  return (
    <Layout>
      <Banner type={BannerType.Events} />
      <main className="container-page">
        <p className="text-xl mb-12">
          We typically host weekly events, usually with free food, during the school year. We also run several annual{" "}
            <strong>flagship events</strong>.
        </p>
        <ContentCard title="Upcoming Events">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="h-[600px]">
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                defaultView="month"
                views={["month", "week", "day"]}
              />
            </div>
          )}
        </ContentCard>
        <div className="mt-12">
          <ContentCard title="Flagship Events">
            <FlagshipEvents />
          </ContentCard>
        </div>
      </main>
    </Layout>
  );
}
