import React from 'react';

interface EventCardProps {
  imageUrl: string;
  title: string;
  description: string;
}

const EventCard: React.FC<EventCardProps> = ({ imageUrl, title, description }) => {
  return (
    <div className="event-card bg-white rounded shadow p-4 text-center">
      <img src={imageUrl} alt={title} className="rounded mb-4" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
};

export default EventCard;
