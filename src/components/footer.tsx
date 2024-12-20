import React from "react";
import { Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";
import { FaInstagram, FaFacebook, FaGithub, FaLinkedin } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";

//official IEEE color for 100% is 002855 https://brand-experience.ieee.org/wp-content/uploads/2020/10/IEEE_Brand_Colors_Hex_Formulas_for_Solids_and_Tints.pdf
export default function Footer() {
  return (
    <footer className="bg-gray-100">
      <div className="container-page max-w-4xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center text-center md:text-left">
          {/* Logo and Contact Info */}
          <div className="flex flex-col space-y-2 items-center">
            <StaticImage
              src="../images/logos/ieee_black.png"
              alt="IEEE Logo"
              className="w-32 mb-2"
              loading="eager"
            />
            <p>IEEE WPI Student Branch</p>
            <p>100 Institute Rd.</p>
            <p>Worcester, MA 01609</p>
            <a
              href="mailto:gr-ieee-exec@wpi.edu"
              className="hover:text-blue-600 hover:underline"
            >
              gr-ieee-exec@wpi.edu
            </a>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col space-y-2 items-center">
            <h2 className="font-bold">Pages</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <Link to="/" className="hover:text-blue-600 hover:underline">
                Home
              </Link>
              <Link to="/events" className="hover:text-blue-600 hover:underline">
                Events
              </Link>
              <Link to="/about" className="hover:text-blue-600 hover:underline">
                About
              </Link>
              <Link to="/people" className="hover:text-blue-600 hover:underline">
                People
              </Link>
              <a
                href="https://mywpi.wpi.edu/ieee/club_signup"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline"
              >
                Join
              </a>
              <a
                href="https://www.ieee.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline"
              >
                IEEE
              </a>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex flex-col space-y-2 items-center">
            <h2 className="font-bold">Connect</h2>
            <div className="flex flex-col space-y-2">
              <a
                href="mailto:gr-ieee-exec@wpi.edu"
                className="flex items-center space-x-2 hover:text-blue-600 hover:underline"
              >
                <MdOutlineEmail className="text-xl" />
                <span>Email Us</span>
              </a>
              <a
                href="https://www.instagram.com/ieeewpi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:text-blue-600 hover:underline"
              >
                <FaInstagram className="text-xl" />
                <span>Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/ieeewpi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:text-blue-600 hover:underline"
              >
                <FaFacebook className="text-xl" />
                <span>Facebook</span>
              </a>
              {/* <a
                href="https://www.linkedin.com/groups/14328043/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:text-blue-600 hover:underline"
              >
                <FaLinkedin className="text-xl" />
                <span>LinkedIn</span>
              </a> */}
              <a
                href="https://github.com/ieee-wpi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:text-blue-600 hover:underline"
              >
                <FaGithub className="text-xl" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
