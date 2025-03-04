import React, { ReactNode, useState, useEffect } from "react";
import { Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";
import { Menu, X } from "lucide-react";

//official IEEE color for 100% is 002855 https://brand-experience.ieee.org/wp-content/uploads/2020/10/IEEE_Brand_Colors_Hex_Formulas_for_Solids_and_Tints.pdf
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 225);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={`fixed w-full z-20 shadow-lg transition-colors duration-300 ${
      isScrolled ? 'bg-black' : 'bg-[rgba(0,0,0,0.5)]'
    } text-white backdrop-blur-md`}>
      <div className="container-page py-4 flex justify-between items-center">
        <Link to="/">
          <div className="flex items-center space-x-4">
            <StaticImage
              src="../images/logos/ieee_white.png"
              alt="IEEE Logo"
              className="max-w-[120px]"
              loading="eager"
            />
            <h1 className="text-2xl font-bold whitespace-nowrap md:block hidden">
              WPI Student Branch
            </h1>
          </div>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden lg:flex space-x-8 text-2xl font-medium">
          <Link to="/about" className="hover:underline">
            About
          </Link>
          <Link to="/events" className="hover:underline">
            Events
          </Link>
          <Link to="/people" className="hover:underline">
            People
          </Link>
          <a
            href="https://mywpi.wpi.edu/ieee/club_signup"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Join
          </a>
          {/* <a TODO: Discuss and decide if we want to keep this
            href = "https://www.givecampus.com/campaigns/40435/donations/new?designation=instituteofelectricalandelectronicsengineers&a=9699234" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            >
            Donate
          </a> */}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-white"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } md:hidden bg-[rgba(0,0,0,0.9)] backdrop-blur-md`}
      >
        <div className="container-page py-4 flex flex-col space-y-4 text-xl font-medium">
          <Link to="/about" className="hover:underline">
            About
          </Link>
          <Link to="/events" className="hover:underline">
            Events
          </Link>
          <Link to="/people" className="hover:underline">
            People
          </Link>
          <a
            href="https://mywpi.wpi.edu/ieee/club_signup"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Join
          </a>
          {/* <a TODO: Discuss and decide if we want to keep this
            href = "https://www.givecampus.com/campaigns/40435/donations/new?designation=instituteofelectricalandelectronicsengineers&a=9699234" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            >
            Donate
          </a> */}
        </div>
      </div>
    </nav>
  );
}
