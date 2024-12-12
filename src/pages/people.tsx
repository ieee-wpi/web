import React from 'react';
import Layout from '../components/Navbar';
import { StaticImage } from 'gatsby-plugin-image';
import Footer from '../components/Footer';


interface Officer {
  name: string;
  position: string;
  image: React.ReactNode;
}


const PeoplePage: React.FC = () => {
  const officers: Officer[] = [
    {
      name: 'Daniel Gorbunov',
      position: 'President',
      image: (
        <StaticImage
          src="../images/people/gorbunov.jpg"
          alt="Daniel Gorbunov"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: 'Hubert Liu',
      position: 'Vice President',
      image: (
        <StaticImage
          src="../images/people/liu.jpg"
          alt="Hubert Liu"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: 'Ryan Ranjitkar',
      position: 'Secretary',
      image: (
        <StaticImage
          src="../images/people/ranjitkar.jpg"
          alt="Ryan Ranjitkar"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: 'George Shi',
      position: 'Treasurer',
      image: (
        <StaticImage
          src="../images/people/shi.jpg"
          alt="George Shi"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      ),
    },
    {
      name: 'Jack Kamataris',
      position: 'Events Officer',
      image: (
        <StaticImage
          src = "../images/people/kamataris.jpg"
          alt="Jack Kamataris"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      )
    },
    {
      name: 'Todd Petry',
      position: 'Events Officer',
      image: (
        <StaticImage
          src = "../images/people/petry.jpg"
          alt="Todd Petry"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      )
    },
    {
      name: 'Brendon Peters',
      position: 'Public Relations Chair',
      image: (
        <StaticImage
          src = "../images/people/peters.jpg"
          alt="Brendon Peters"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      )
    },
    {
      name: 'Will Buchta',
      position: 'Projects Chair',
      image: (
        <StaticImage
          src = "../images/people/buchta.jpg"
          alt="J"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      )
    },
    {
      name: 'Artem Frenk',
      position: 'Web Chair',
      image: (
        <StaticImage
          src = "../images/people/frenk.jpg"
          alt="Artem Frenk"
          className="rounded-full shadow-md"
          width={100}
          height={100}
          placeholder="blurred"
        />
      )
    }
  ];

  return (
    <>
    <Layout></Layout>
      <section className="relative h-[40vh] flex items-center justify-start text-white text-left px-6 lg:px-32">
      <StaticImage
        src="../images/img/heroes/people_hero.png"
        alt="People Hero"
        className="absolute inset-0 w-full h-full object-cover z-0 hero" 
      />
      <div className="relative z-10 bg-black bg-opacity-50 p-6 rounded backdrop-blur-md">
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
      <Footer></Footer>
    </>
  );
};

export default PeoplePage;
