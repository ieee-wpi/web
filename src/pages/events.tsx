import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { StaticImage } from 'gatsby-plugin-image';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
const locales = { 'en-US': enUS };

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
    title: 'PCB Design Class',
    description: 'September',
    image: (
      <StaticImage
        src="../images/events/pcb-cover.png"
        alt="PCB Design Class"
        className="rounded shadow-lg"
        width={300}
        height={200}
        placeholder="blurred"
      />
    ),
    link: 'https://pcb.wpi.edu'
  },
  {
    title: 'Spark Party',
    description: 'December',
    image: (
      <StaticImage
        src="../images/events/spark-party-cover.png"
        alt="Spark Party"
        className="rounded shadow-lg"
        width={300}
        height={200}
        placeholder="blurred"
      />
    ),
  },
  {
    title: 'Networking Night',
    description: 'January',
    image: (
      <StaticImage
        src="../images/events/networking-cover.png"
        alt="Networking Night"
        className="rounded shadow-lg"
        width={300}
        height={200}
        placeholder="blurred"
      />
    ),
    link: "/networking"
  },
];

const EventsPage: React.FC = () => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/data/events.json');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Fetched data is not an array');
        }

        const formattedEvents = data.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));

        setCalendarEvents(formattedEvents);
        setError(null); 
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      }
    };

    fetchEvents();
  }, []);

  return (
    <Layout>
      <section className="relative h-[40vh] flex items-center justify-start text-white text-left px-6 lg:px-32">
        <StaticImage
          src="../images/img/heroes/events_hero.png"
          alt="Events Hero"
          layout = "fullWidth"
          objectFit="cover"
          objectPosition="center"
          className="absolute inset-0 w-full h-full object-cover z-0 hero"
          placeholder="blurred"
        />
        <div className="relative z-10 bg-black bg-opacity-50 p-4 rounded backdrop-blur-md">
          <h1 className="text-9xl font-bold tracking-wide">Events</h1>
        </div>
      </section>
      <section className="py-10 px-6 text-center">
        <p className="text-xl mb-6">
          We typically hold weekly events, usually with free food, during the school year. We also have several annual{' '}
          <em>flagship events</em> that we run.
        </p>
        <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="h-96">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        )}
      </section>
      <section className="py-10 px-6 bg-gray-100 text-center">
  <h2 className="text-2xl font-bold mb-6">Flagship Events</h2>
  <div className="flex flex-wrap justify-center gap-8">
    {flagshipEvents.map((event, idx) => (
      <div key={idx} className="w-80">
        {event.link ? (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white rounded shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="mb-4">{event.image}</div>
            <div className="px-4 pb-4">
              <h3 className="text-xl font-bold">{event.title}</h3>
              <p className="text-gray-500">{event.description}</p>
            </div>
          </a>
        ) : (
          <div className="bg-white rounded shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4">{event.image}</div>
            <div className="px-4 pb-4">
              <h3 className="text-xl font-bold">{event.title}</h3>
              <p className="text-gray-500">{event.description}</p>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
</section>

    </Layout>
  );
};

export default EventsPage;
