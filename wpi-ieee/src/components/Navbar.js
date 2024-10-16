import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav id="navbar" className="navbar">
      <ul>
        <li className="nav-item"><Link to="/" className="nav-link scrollto active">Home</Link></li>
        <li className="nav-item"><Link to="/#goals" className="nav-link scrollto">About</Link></li>
        <li className="nav-item"><Link to="/exec" className="nav-link scrollto">Officer Board</Link></li>
        <li className="nav-item"><Link to="/networking" className="nav-link scrollto">Networking Opportunities</Link></li>
        <li className="dropdown">
          <Link to="#">
            <span>Events</span> <i className="bi bi-chevron-down"></i>
          </Link>
          <ul>
            <li><Link to="/events/fall-social">Fall Social</Link></li>
            <li><Link to="/events/spark-party">Spark Party</Link></li>
            <li><Link to="/events/soldering-workshop">Soldering Workshop</Link></li>
            <li><Link to="/events/fox-hunt">Fox Hunt</Link></li>
          </ul>
        </li>
        <li><a className="nav-link scrollto" href="#footer">Contact</a></li>
      </ul>
      <i className="bi bi-list mobile-nav-toggle"></i>
    </nav>
  );
};

export default Navbar;