import React from "react";
import Layout from "../components/layout";
import Banner, { BannerType } from "../components/banner";
import { StaticImage } from "gatsby-plugin-image";

export default function NetworkingPage() {
  return (
    <Layout>
      <Banner type={BannerType.Networking} />
      <div className="bg-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
              IEEE WPI Networking Night 2025
            </h1>
            <p className="text-gray-700 mb-6">
              Fill out
              <a href="https://docs.google.com/forms/d/e/1FAIpQLScME1ZGQLioR6v_uNeynkOi0cM-dNDoCzRn_S3ZxkjerRyuwg/viewform"
                  className = "text-blue-600 hover:underline"
                  target="_blank"
                  rel = "noopener noreferrer" > this form 
              </a> {" "}
               to register your company for the IEEE WPI
              Student Branch 2025 Networking Night! Here are some details:
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <p className="font-semibold text-gray-800">📅 Date:</p>
                <p className="text-gray-700">Tuesday, January 28, 2025</p>
              </div>
              <div className="flex items-center space-x-4">
                <p className="font-semibold text-gray-800">⏰ Time:</p>
                <p className="text-gray-700">6:00 PM — 8:00 PM</p>
              </div>
              <div className="flex items-center space-x-4">
                <p className="font-semibold text-gray-800">📍 Location:</p>
                <p className="text-gray-700">
                  WPI Campus Center (100 Institute Rd, Worcester, MA)
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <p className="font-semibold text-gray-800">🎓 Attendees:</p>
                <p className="text-gray-700">
                  Computer Science (CS), Electrical and Computer Engineering
                  (ECE), and Robotics Engineering (RBE) majors from WPI.
                </p>
              </div>
            </div>

            <div className="my-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Event Overview
              </h2>
              <p className="text-gray-700 mb-4">
                The event provides companies a unique opportunity to engage with
                highly motivated, talented, technical WPI students over a
                catered dinner. WPI students are known for their strong
                technical foundation and hands-on project experience, making
                this an excellent recruitment opportunity for your company. In
                the past, we have filled all seats at this event! This year, we
                expect approximately 120 students to attend.
              </p>
            </div>

            <div className="my-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Tentative Schedule
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <span className="font-semibold">5:00 PM:</span> Companies
                  arrive and set up booths.
                </li>
                <li>
                  <span className="font-semibold">6:00 PM - 6:30 PM:</span>{" "}
                  Dinner and Networking. Students and employers connect over a
                  catered dinner. Students will be seated by major, allowing
                  companies to sit with students from related disciplines.
                </li>
                <li>
                  <span className="font-semibold">6:30 PM - 7:00 PM:</span>{" "}
                  Presentations. Each company will have 3 minutes to present a
                  brief slideshow about their company and share available
                  opportunities.
                </li>
                <li>
                  <span className="font-semibold">7:00 PM - 8:00 PM:</span>{" "}
                  Career Fair. Companies will attend to their booths, and
                  students will have a chance to speak one-on-one.
                </li>
              </ul>
            </div>

            <div className="my-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Registration
              </h2>
              <p className="text-gray-700">
                The event is completely <span className="font-bold">free</span>{" "}
                for companies and students. Companies should register for the
                event using the provided form 
                < a href="https://docs.google.com/forms/d/e/1FAIpQLScME1ZGQLioR6v_uNeynkOi0cM-dNDoCzRn_S3ZxkjerRyuwg/viewform"
                  className = "text-blue-600 hover:underline"
                  target="_blank"
                  rel = "noopener noreferrer" > here
                </a>
                . Confirmation and logistics
                details will follow upon registration.
              </p>

              <p className="text-gray-700 mt-4">
                If you have any questions, please contact us at:{" "}
                <a
                  href="mailto:gr-ieee-exec@wpi.edu"
                  className="text-blue-600 hover:underline"
                >
                  gr-ieee-exec@wpi.edu
                </a>

              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
