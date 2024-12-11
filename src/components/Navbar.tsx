import React, { ReactNode } from 'react';
import { Link } from 'gatsby';
import { StaticImage } from 'gatsby-plugin-image';


//official IEEE color for 100% is 002855 https://brand-experience.ieee.org/wp-content/uploads/2020/10/IEEE_Brand_Colors_Hex_Formulas_for_Solids_and_Tints.pdf
const Layout: React.FC = () => {
  return (
    <>
      <header className="bg-[rgba(0,0,0,0.5)] text-white fixed w-full z-50 flex justify-between items-center px-6 py-4 backdrop-blur-md shadow-lg"> 
        <div className="flex items-center space-x-4">
            <StaticImage
              src="../images/img/logos/ieee_white.png"
              alt="IEEE Logo"
              className="h-15 max-w-[150px] w-auto"
            />
            <span className="text-4xl font-bold whitespace-nowrap"> WPI Student Branch</span>
        </div>
        <nav className="flex space-x-6 text-2xl font-medium">
          <Link to="/" className="hover:underline font-bold">
          Home
          </Link>
          <Link to="/about" className="hover:underline font-bold">
            About
          </Link>
          <Link to="/events" className="hover:underline font-bold">
            Events
          </Link>
          <Link to="/people" className="hover:underline font-bold">
            People
          </Link>
          <a
            href="https://mywpi.wpi.edu/IEEE/club_signup"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-bold"
          >
            Join
          </a>
        </nav>
      </header>
    </>
  );
};

export default Layout;