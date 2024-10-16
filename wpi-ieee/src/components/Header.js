import React from 'react';

const Header = () => {
  return (
    <header id="header" className="d-flex align-items-center">
      <div className="container d-flex align-items-center justify-content-between">
        <a href="/" className="logo"><img src="assets/img/IEEE.png" alt="IEEE Club Logo" /></a>
        <div className="d-flex align-items-center">
          <h1>Welcome to the <br /><span>WPI IEEE Student Branch</span></h1>
          <h2> -- Advancing Technology for Humanity.</h2>
          <div className="d-flex">
            <a href="https://forms.gle/DpxC8XqAjSTKo8UL7" className="btn-join scrollto">Join Email List</a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
