import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { StaticImage } from "gatsby-plugin-image";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import Footer from "../components/footer";
import Layout from "../components/layout";
import Banner, { BannerType } from "../components/banner";
import EventCard from "../components/event-card";

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

interface Event {
  title: string;
  description: string;
  image: JSX.Element;
  link?: string;
}

const flagshipEvents: Event[] = [
  {
    title: "PCB Design Class",
    description: "September",
    image: (
      <StaticImage
        src="../images/events/pcb-cover.png"
        alt="PCB Design Class"
        className="rounded-t"
        placeholder="blurred"
      />
    ),
    link: "https://pcb.wpi.edu",
  },
  {
    title: "Spark Party",
    description: "December",
    image: (
      <StaticImage
        src="../images/events/spark-party-cover.png"
        alt="Spark Party"
        className="rounded-t"
        placeholder="blurred"
      />
    ),
  },
  {
    title: "Networking Night",
    description: "January",
    image: (
      <StaticImage
        src="../images/events/networking-cover.png"
        alt="Networking Night"
        className="rounded-t"
        placeholder="blurred"
      />
    ),
    link: "/networking",
  },
];

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
        <div className="flex flex-col gap-24">
          <section>
            <p className="text-xl mb-12">
              We typically hold weekly events, usually with free food, during
              the school year. We also have several annual{" "}
              <em>flagship events</em> that we run.
            </p>
            <h2 className="text-2xl font-bold mb-4">Event Calendar</h2>
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <div className="h-96">
                <BigCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            )}
          </section>
          <section className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Flagship Events</h2>
            <div className="flex flex-wrap justify-center gap-8">
              {flagshipEvents.map((event, idx) => (
                <EventCard
                  key={idx}
                  title={event.title}
                  date={event.description}
                  href={event.link}
                  imageComponent={event.image}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
