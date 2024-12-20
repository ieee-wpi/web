import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { StaticImage } from "gatsby-plugin-image";
import Banner, { BannerType } from "../components/banner";
import Layout from "../components/layout";
import Description from "@/components/description";
import FlagshipEventsCarousel from "@/components/flagship-events-carousel";

export default function HomePage() {
  return (
    <Layout>
      <Banner type={BannerType.Home} />
      <main className="container-page flex flex-col gap-14">
          <section>
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="md:w-1/4">
                <a
                  href="/about"
                  className="text-3xl font-bold border-b-2 border-black inline-block hover:underline"
                >
                  About
                </a>
              </div>
              <div className="md:w-3/4">
                <Description />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="md:w-1/4">
                <a
                  href="/events"
                  className="text-3xl font-bold border-b-2 border-black inline-block hover:underline"
                >
                  Events
                </a>
              </div>
              <div className="w-full md:w-3/4 text-left">
              <p className="text-lg md:text-lg mb-4 md:mb-6">
              </p>
              Check our{' '}
                <a
                  href="/events"
                  className="underline hover:text-blue-600"
                >
                events calendar
                </a>{' '}
                for upcoming events.
                
              <br />
              <p>
                Here are some of our annual <strong>flagship events</strong>:
              </p>
              
              <div>
                <FlagshipEventsCarousel />
              </div>
            </div>
          </div>
        </section>

          <section>
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="md:w-1/4">
                <a
                  href="/people"
                  className="text-3xl font-bold border-b-2 border-black inline-block hover:underline"
                >
                  People
                </a>
              </div>
              <div className="md:w-3/4">
                {/* <div className="float-right ml-6 mb-4 w-1/3 flex flex-col items-center">
                  <p className="text-lg font-bold mb-2">2024 Officer Board</p>
                  <StaticImage
                    src="../images/people/officer_board.png"
                    alt="2024 Officer Board"
                    className="rounded shadow-lg"
                  />
                </div> */}
                <p className="text-lg">
                  We have over 150 general members in our branch, primarily
                  students majoring in <strong>ECE, CS, and RBE</strong>.
                </p>
                <br/><p className="text-lg">
                  Are you a WPI student interested in joining? Click{" "}
                  <a
                    href="https://mywpi.wpi.edu/IEEE/club_signup"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline hover:text-blue-600"
                  >
                    here
                  </a>{" "}
                  to join.
                </p>
              </div>
            </div>
          </section>
      </main>
    </Layout>
  );
}
