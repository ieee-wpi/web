import React, { ReactNode } from 'react';
import { Link } from 'gatsby';
import { StaticImage } from 'gatsby-plugin-image';

interface LayoutProps {
  children: ReactNode;
}
//official IEEE color for 100% is 002855 https://brand-experience.ieee.org/wp-content/uploads/2020/10/IEEE_Brand_Colors_Hex_Formulas_for_Solids_and_Tints.pdf
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <header className="bg-[#00629B] text-white fixed w-full z-50 flex justify-between items-center px-6 py-4"> 
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

      <main className="pt-20">{children}</main>

      <footer className="bg-white-100 text-white-800 p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-sm flex flex-col">
            <p className="font-bold">IEEE WPI Student Branch</p>
            <p>100 Institute Rd.<br />Worcester, MA 01609<br/></p>
            
            <a
              href="mailto:ieee-officers@wpi.edu"
              className="text-blue-500 hover:underline"
            >
              ieee-officers@wpi.edu
            </a>
          </div>

          <div className="text-sm  flex flex-col">
            <p className="font-bold">IEEE Sites</p>
            <div className="space-y-1">
              <a
                href="https://site.ieee.org/worcester/"
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Worcester Section Site
              </a>
              <br />
              <a
                href="http://www.ieee.org/membership_services/membership/students/index.html"
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                IEEE Student Membership Sign Up
              </a>
              <br />
              <a
                href="https://www.ieee.org"
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Main IEEE Site
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-bold mb-4">Get in Touch!</p>
            <div className="flex space-x-4">
              <a href="https://discord.gg/NDxvWKhyeU" target="_blank" rel="noopener noreferrer">
                <StaticImage
                  src="../images/img/logos/discord.png"
                  alt="Discord"
                  className="h-6 w-6"
                />
              </a>
              <a href="https://www.instagram.com/ieeewpi/" target="_blank" rel="noopener noreferrer">
                <StaticImage
                  src="../images/img/logos/ig.png"
                  alt="Instagram"
                  className="h-6 w-6"
                />
              </a>
              <a href="https://www.linkedin.com/groups/14328043/" target="_blank" rel="noopener noreferrer">
                <StaticImage
                  src="../images/img/logos/li.png"
                  alt="LinkedIn"
                  className="h-6 w-6"
                />
              </a>
              <a href="https://www.facebook.com/IEEEWPI" target="_blank" rel="noopener noreferrer">
                <StaticImage
                  src="../images/img/logos/facebook.png"
                  alt="Facebook"
                  className="h-6 w-6"
                />
              </a>
              <a href="https://github.com/IEEE-WPI" target="_blank" rel="noopener noreferrer">
                <StaticImage
                  src="../images/img/logos/github.png"
                  alt="GitHub"
                  className="h-6 w-6"
                />
              </a>
              <a href="mailto:ieee-officers@wpi.edu">
                <StaticImage
                  src="../images/img/logos/email.png"
                  alt="Email"
                  className="h-6 w-6"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
