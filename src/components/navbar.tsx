import React, { ReactNode } from "react";
import { Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";

//official IEEE color for 100% is 002855 https://brand-experience.ieee.org/wp-content/uploads/2020/10/IEEE_Brand_Colors_Hex_Formulas_for_Solids_and_Tints.pdf
export default function Navbar() {
  return (
    <nav className="bg-[rgba(0,0,0,0.5)] text-white fixed w-full z-20 backdrop-blur-md shadow-lg">
      <div className="container-page py-4 flex justify-between items-center">
        <Link to="/">
          <div className="flex items-center space-x-4">
            <StaticImage
              src="../images/logos/ieee_white.png"
              alt="IEEE Logo"
              className="max-w-[120px]"
              loading="eager"
            />
            <h1 className="text-2xl font-bold whitespace-nowrap">
              {" "}
              WPI Student Branch
            </h1>
          </div>
        </Link>
        <div className="flex space-x-8 text-2xl font-medium">
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
            href="https://mywpi.wpi.edu/ieee/club_signup"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-bold"
          >
            Join
          </a>
        </div>
      </div>
    </nav>
  );
}
