import React from 'react';
import Layout from '../components/Layout';
import { StaticImage } from 'gatsby-plugin-image';

const PeoplePage: React.FC = () => {
  const officers = Array(9).fill({
    name: 'Bob Builder',
    position: "Position | '99",
    image: (
      <StaticImage
        src="../images/img/bob.png"
        alt="Bob Builder"
        className="rounded-full shadow-md"
        width={100}
        height={100}
        placeholder="blurred"
      />
    ),
  });

  return (
    <Layout>
      <section className="relative h-[40vh] flex items-center justify-start text-white text-left px-6 lg:px-32">
        <StaticImage
          src="../images/img/heroes/people_hero.png"
          alt="People Hero"
          className="absolute inset-0 w-full h-full object-cover z-0"
          placeholder="blurred"
        />
        <div className="relative z-10 bg-black bg-opacity-50 p-4 rounded backdrop-blur-md">
          <h1 className="text-9xl font-bold tracking-wide">People</h1>
        </div>
      </section>

      <section className="py-10 px-6 text-center">
        <StaticImage
          src="../images/img/officer_board.png"
          alt="2024-2025 Officer Board"
          className="rounded shadow-lg mb-4"
          placeholder="blurred"
        />
        <p className="text-lg font-medium underline">2024-2025 Officer Board</p>
      </section>
      <section className="py-10 px-6 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-6">Current Officers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {officers.map((officer, idx) => (
            <div key={idx} className="text-center">
              <div className="mb-4">{officer.image}</div>
              <h3 className="text-lg font-bold">{officer.name}</h3>
              <p className="text-gray-500">{officer.position}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-10 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Archive of Officers</h2>
        <p className="text-gray-500">TODO: Cards for old officer boards</p>
      </section>
    </Layout>
  );
};

export default PeoplePage;
