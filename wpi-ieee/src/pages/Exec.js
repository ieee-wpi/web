// src/pages/Exec.js
import React, { useState } from 'react';

const Exec = () => {
  // State for handling collapsible past exec boards
  const [openYears, setOpenYears] = useState({});

  // Function to toggle a specific year
  const toggleYear = (year) => {
    setOpenYears((prevState) => ({
      ...prevState,
      [year]: !prevState[year]
    }));
  };

  return (
    <main id="main">
      {/* Current Executive Board Section */}
      <section id="exec" className="columns">
        <div className="container" data-aos="fade-up">
          <div className="section-title">
            <h1>2024-2025 Executive Board</h1>
          </div>

          <div className="row">
            {/* Current Officers */}
            <div className="col-sm-2 col-sm-3 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="25">
              <div className="icon-box">
                <p><b>President</b></p>
                <p>Daniel Gorbunov</p><br />
                <img src="images/officers/Gorbunov.jpg" style={{ width: "100%" }} alt="Daniel Gorbunov" />
              </div>
            </div>
            <div className="col-sm-2 col-sm-3 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="50">
              <div className="icon-box">
                <p><b>Vice President</b></p>
                <p>Hubert Liu</p><br />
                <img src="images/officers/Liu.jpg" style={{ width: "100%" }} alt="Hubert Liu" />
              </div>
            </div>
            <div className="col-sm-2 col-sm-3 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="75">
              <div className="icon-box">
                <p><b>Treasurer</b></p>
                <p>George Shi</p><br />
                <img src="images/officers/Shi.jpg" style={{ width: "100%" }} alt="George Shi" />
              </div>
            </div>
            <div className="col-sm-2 col-sm-3 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="icon-box">
                <p><b>Secretary</b></p>
                <p>Ryan Ranjitkar</p><br />
                <img src="images/officers/Ranjitkar.jpg" style={{ width: "100%" }} alt="Ryan Ranjitkar" />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-2 col-sm-3 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="50">
              <div className="icon-box">
                <p><b>Projects Chair</b></p>
                <p>Will Buchta</p><br />
                <img src="images/officers/Buchta.jpg" style={{ width: "100%" }} alt="Will Buchta" />
              </div>
            </div>
            <div className="col-sm-2 col-sm-3 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="75">
              <div className="icon-box">
                <p><b>Webmaster</b></p>
                <p>Artem Frenk</p><br />
                <img src="images/officers/Frenk.jpg" style={{ width: "100%" }} alt="Artem Frenk" />
              </div>
            </div>
            <div className="col-sm-2 col-sm-3 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="icon-box">
                <p><b>PR Chair</b></p>
                <p>Sofia Xie</p><br />
                <img src="images/officers/Xie.jpg" style={{ width: "100%" }} alt="Sofia Xie" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Past Executive Board Section */}
      <section id="prev-exec" className="prev-exec columns">
        <div className="container">
          <div className="section-title">
            <h1>Past Officers</h1>
          </div>

          {/* Collapsible Past Years */}
          {['2023', '2022', '2021', '2020'].map((year) => (
            <div key={year} className="col-sm-3 col-sm-4 d-flex align-items-stretch">
              <div className="col icon-box">
                <h4>
                  {year} Exec Board{' '}
                  <span
                    className="bx bx-down-arrow"
                    role="button"
                    onClick={() => toggleYear(year)}
                    style={{ cursor: 'pointer' }}
                  ></span>
                </h4>
                {openYears[year] && (
                  <div id={year} className="collapse show">
                    <table className="table table-striped table-sm" style={{ textAlign: 'left' }}>
                      <tbody>
                        <tr>
                          <th scope="row"></th>
                          <td>President</td>
                          <td>Will Buchta</td>
                        </tr>
                        <tr>
                          <th scope="row"></th>
                          <td>Vice President</td>
                          <td>Cather Zhang</td>
                        </tr>
                        {/* Add other rows as needed */}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Exec;
