"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
  type View,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  time?: string;
}

// Hoisted to module scope so these objects keep a stable identity across
// renders. Passing fresh literals inline on every render caused
// react-big-calendar's internal view/date state to reset on toolbar clicks.
const calendarFormats = {
  eventTimeRangeFormat: () => "", // Hide default time format
};

function CalendarEventItem(props: { event: CalendarEvent }) {
  const event = props.event;
  return (
    <div className="p-1">
      <div className="font-semibold">{event.title}</div>
      <div className="text-sm">
        {event.time && event.location
          ? `${event.time} · ${event.location}`
          : event.time || event.location || ""}
      </div>
    </div>
  );
}

const calendarComponents = {
  event: CalendarEventItem,
};

const calendarViews: View[] = [Views.MONTH, Views.WEEK, Views.DAY];

export default function EventsCalendar() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());

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

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="h-[600px]">
      <BigCalendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        views={calendarViews}
        formats={calendarFormats}
        components={calendarComponents}
      />
    </div>
  );
}
