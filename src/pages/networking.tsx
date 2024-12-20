import React from "react";
import Layout from "../components/layout";
import Banner, { BannerType } from "../components/banner";
import ContentCard from "@/components/content-card";

export default function NetworkingPage() {
  return (
    <Layout>
      <Banner type={BannerType.Networking} />
      <main className="container-page flex flex-col gap-14">
        <ContentCard title="IEEE WPI Networking Night 2025">
          <p className="text-lg mb-6">
            Fill out
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLScME1ZGQLioR6v_uNeynkOi0cM-dNDoCzRn_S3ZxkjerRyuwg/viewform"
              className="text-blue-600 hover:underline mx-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              this form
            </a>
            to register your company for the IEEE WPI Student Branch 2025 Networking Night!
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-4">
              <p className="font-semibold">📅 Date:</p>
              <p>Tuesday, January 28, 2025</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">⏰ Time:</p>
              <p>6:00 PM — 8:00 PM</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">📍 Location:</p>
              <p>WPI Campus Center (100 Institute Rd, Worcester, MA)</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">🎓 Attendees:</p>
              <p>Computer Science (CS), Electrical and Computer Engineering (ECE), and Robotics Engineering (RBE) majors from WPI.</p>
            </div>
          </div>
          <p className="text-lg">
                If you have any questions, please contact us at:{" "}
                <a
                  href="mailto:gr-ieee-exec@wpi.edu"
                  className="text-blue-600 hover:underline"
                >
                  gr-ieee-exec@wpi.edu
                </a>
          </p>
        </ContentCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
          <ContentCard title="Event Overview">
            <div className="text-lg space-y-4">
              <p>
                The event provides companies a unique opportunity to engage with highly motivated, talented, technical WPI students over a catered dinner. WPI students are known for their strong technical foundation and hands-on project experience, making this an excellent recruitment opportunity for your company. In the past, we have filled all seats at this event! This year, we expect approximately 120 students to attend.
              </p>
              
              <p>
                The event is completely <span className="font-bold">free</span> for companies and students. Companies should register for the event using the provided form
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLScME1ZGQLioR6v_uNeynkOi0cM-dNDoCzRn_S3ZxkjerRyuwg/viewform"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>. 
                Confirmation and logistics details will follow upon registration.
              </p>
            </div>
          </ContentCard>

          <ContentCard title="Tentative Schedule">
            <ul className="space-y-4 text-lg list-none">
              <li>
                <span className="font-semibold">5:00 PM:</span> Companies arrive and set up booths.
              </li>
              <li>
                <span className="font-semibold">6:00 PM - 6:30 PM:</span>{" "}
                Dinner and Networking. Students and employers connect over a catered dinner. Students will be seated by major, allowing companies to sit with students from related disciplines.
              </li>
              <li>
                <span className="font-semibold">6:30 PM - 7:00 PM:</span>{" "}
                Presentations. Each company will have 3 minutes to present a brief slideshow about their company and share available opportunities.
              </li>
              <li>
                <span className="font-semibold">7:00 PM - 8:00 PM:</span>{" "}
                Career Fair. Companies will attend to their booths, and students will have a chance to speak one-on-one.
              </li>
            </ul>
          </ContentCard>
        </div>
      </main>
    </Layout>
  );
}
