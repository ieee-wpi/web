import React from "react";
import Banner, { BannerType } from "@/components/banner";
import Description from "@/components/description";
import FlagshipEventsCarousel from "@/components/flagship-events-carousel";

export default function HomePage() {
  return (
    <>
      <Banner type={BannerType.Home} />
      <main className="container-page flex flex-col gap-14">
          <section>
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="md:w-1/4">
                <a
                  href="/about"
                  className="text-3xl font-bold hover:underline hover:text-blue-600"
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
                  className="text-3xl font-bold hover:underline hover:text-blue-600"
                >
                  Events
                </a>
              </div>
              <div className="w-full md:w-3/4 text-left flex flex-col gap-4">
                <p className="text-lg leading-relaxed">
                  Check our{" "}
                  <a
                    href="/events"
                    className="underline hover:text-blue-600"
                  >
                    events calendar
                  </a>{" "}
                  for upcoming events.
                </p>
                <p className="text-lg leading-relaxed">
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
                  className="text-3xl font-bold hover:underline hover:text-blue-600"
                >
                  People
                </a>
              </div>
              <div className="md:w-3/4">
                <div className="flex flex-col gap-4">
                  <p className="text-lg leading-relaxed">
                    We have over <span className="font-bold">500</span> general members in our branch, primarily
                    students majoring in <strong>ECE, CS, and RBE</strong>!
                  </p>
                  <p className="text-lg leading-relaxed">
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
            </div>
          </section>
      </main>
    </>
  );
}
