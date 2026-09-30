import React from "react";
import Banner, { BannerType } from "@/components/banner";
import Image from "next/image";
import ContentCard from "@/components/content-card";

import amd from "@/images/networking/amd.png";
import analog from "@/images/networking/analog.png";
import bose from "@/images/networking/bose.png";
import ipg from "@/images/networking/ipg.png";
import mitll from "@/images/networking/mitll.png";
import nvidia from "@/images/networking/nvidia.png";
import ti from "@/images/networking/ti.png";

export const metadata = {
  title: "Networking Night",
};

export default function NetworkingPage() {
  return (
    <>
      <Banner type={BannerType.Networking} />
      <main className="container-page flex flex-col gap-14">
        <ContentCard title="IEEE WPI Networking Night 2026">
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-4">
              <p className="font-semibold">📅 Date:</p>
              <p>Tuesday, January 27, 2026</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">⏰ Time:</p>
              <p>6:00 PM — 8:00 PM</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">📍 Location:</p>
              <p>WPI Campus Center Odeum (100 Institute Rd, Worcester, MA)</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">🎓 Attendees:</p>
              <p>Computer Science, Electrical and Computer Engineering, and Robotics Engineering WPI students</p>
            </div>
          </div>
          <div className="text-lg leading-relaxed space-y-4 max-w-3xl">
              <p>
                The event provides companies a unique opportunity for highly motivated, talented, technical WPI students to connect with companies over a catered dinner. WPI students are known for their strong technical foundation and hands-on project experience. In the past, we have filled all seats at this event!
              </p>

              <p>
                The event is completely <span className="font-bold">free</span> for companies and students.  If you have any questions, please contact us at{" "}
                <a
                  href="mailto:gr-ieee-exec@wpi.edu"
                  className="text-blue-600 hover:underline"
                >
                  gr-ieee-exec@wpi.edu
                </a>.
              </p>
            </div>
        </ContentCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
          <ContentCard title="Registration">
          <p className="text-lg mb-6">
            <h2 className="mb-2 text-lg font-bold">WPI Students:</h2>
            <p className="text-lg mb-6">
              <a 
                href="https://mywpi.wpi.edu/ieee/rsvp_boot?id=400952"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
              Student Registration Form
              </a>
              <br />
              <p className="mt-2 italic leading-relaxed">Please note that seats for this event are limited. Registrations will be confirmed on a first-come, first-served basis. If the event reaches capacity before the form is closed, your registration may not be valid, and you will be notified accordingly. We recommend registering early to secure your spot.</p>
            </p>
            <h2 className="mb-2 text-lg font-bold">Companies:</h2>    
            <a
                  href="mailto:gr-ieee-exec@wpi.edu"
                  className="text-blue-600 hover:underline"
                >
                  gr-ieee-exec@wpi.edu
                </a>
                <br/>
                Company Registration, please email us at the address above.
            
          </p>
          </ContentCard>

          <ContentCard title="Schedule">
            <ul className="space-y-6 text-lg list-none">
              {/* <li>
                <span className="font-semibold">5:00 PM:</span> Companies arrive and set up booths.
              </li> */}
              <li>
                <strong className="font-semibold">6:00 PM - 6:30 PM: Dinner and Networking</strong>{" "}
                <p className="leading-relaxed mt-1">Students and employers connect over a catered dinner. Students will be seated by major, allowing companies and students to best connect.</p>
              </li>
              <li>
                <strong className="font-semibold">6:30 PM - 7:00 PM: Presentations</strong>{" "}
                <p className="leading-relaxed mt-1">Each company will have 3-5 minutes to present a brief slideshow about their company and share information about available opportunities for students.</p>
              </li>
              <li>
                <strong className="font-semibold">7:00 PM - 8:00 PM: Career Fair</strong>{" "}
                <p className="leading-relaxed mt-1">We will open into a career fair format. Companies will attend to their booths, and students will have a chance to speak one on one with companies they're interested in.</p>
              </li>
            </ul>
          </ContentCard>
        </div>

        <ContentCard title="Last Year's Participating Companies">
          <div className="space-y-8 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-center justify-items-center">
              <div className="w-40 md:w-40 h-24 flex items-center justify-center">
                <Image src={amd} alt="AMD" className="w-[200px] h-auto" />
              </div>
              <div className="w-43 md:w-43 h-24 flex items-center justify-center">
                <Image src={analog} alt="Analog Devices" className="w-[180px] h-auto" />
              </div>
              <div className="w-50 md:w-50 h-24 flex items-center justify-center">
                <Image src={bose} alt="Bose" className="w-[200px] h-auto" />
              </div>
              <div className="w-50 md:w-50 h-24 flex items-center justify-center">
                <Image src={ipg} alt="IPG Photonics" className="w-[200px] h-auto" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-20">
              <div className="w-[350px] md:w-100 h-44 flex items-center justify-center">
                <Image src={mitll} alt="MIT Lincoln Laboratory" className="w-[300px] h-auto" />
              </div>
              <div className="w-[250px] md:w-50 h-24 flex items-center justify-center">
                <Image src={nvidia} alt="NVIDIA" className="w-[130px] h-auto" />
              </div>
              <div className="w-[300px] md:w-65 h-24 flex items-center justify-center">
                <Image src={ti} alt="Texas Instruments" className="w-[300px] h-auto" />
              </div>
            </div>
          </div>
        </ContentCard>
      </main>
    </>
  );
}
