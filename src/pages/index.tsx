import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { StaticImage } from "gatsby-plugin-image";
import Banner, { BannerType } from "../components/banner";
import Layout from "../components/layout";
import EventCard from "../components/event-card";

export default function HomePage() {
  return (
    <Layout>
      <Banner type={BannerType.Home} />
      <main className="container mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex flex-col gap-20">
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
                <p className="text-lg">
                  IEEE is the world’s largest technical professional
                  organization dedicated to advancing technology for the benefit
                  of humanity. IEEE and its members inspire a global community
                  through its highly cited publications, conferences, technology
                  standards, and professional and educational activities.
                </p>
                <p className="text-lg">
                  <br /> Our student branch is focused on organizing engaging{" "}
                  <strong>technical, professional, and social events</strong>{" "}
                  for the WPI community, primarily for electronics and
                  computing-related majors. Our members are passionate about
                  technology and focused on cultivating an enriching student
                  life for the WPI electronics and computing community.
                </p>
                <p className="text-lg">
                  <br /> We have a student lounge in{" "}
                  <a
                    href="https://maps.app.goo.gl/H9d2DcqgULoDuDiM6"
                    className="text-blue-500 hover:underline"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Atwater Kent Labs
                  </a>{" "}
                  with a microwave, fridge, coffee machine, and printer. We
                  typically host weekly events, usually with free food, during
                  the school year.
                </p>
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

              <div className="md:w-3/4 text-left">
                <p className="text-lg mb-6">
                  Here are some of our annual <strong>flagship events</strong>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <EventCard
                    title="PCB Design Class"
                    date="September"
                    href="https://pcb.wpi.edu"
                    imageComponent={
                      <StaticImage
                        src="../images/events/pcb-cover.png"
                        alt="PCB Design Class"
                        className="rounded-t"
                      />
                    }
                  />

                  <EventCard
                    title="Spark Party"
                    date="December"
                    imageComponent={
                      <StaticImage
                        src="../images/events/spark-party-cover.png"
                        alt="Spark Party"
                        className="rounded-t"
                      />
                    }
                  />

                  <EventCard
                    title="Networking Night"
                    date="January"
                    href="/networking"
                    imageComponent={
                      <StaticImage
                        src="../images/events/networking-cover.png"
                        alt="Networking Night"
                        className="rounded-t"
                      />
                    }
                  />
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
                <div className="float-right ml-6 mb-4 w-1/3 flex flex-col items-center">
                  <p className="text-lg font-bold mb-2">2024 Officer Board</p>
                  <StaticImage
                    src="../images/people/officer_board.png"
                    alt="2024 Officer Board"
                    className="rounded shadow-lg"
                  />
                </div>
                <p className="text-lg mb-4">
                  We have over 150 general members in our branch, across majors
                  like ECE, CS, and RBE.
                </p>
                <p className="text-lg mb-4">
                  Are you a WPI student interested in joining? Click{" "}
                  <a
                    href="https://mywpi.wpi.edu/IEEE/club_signup"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-blue-500 hover:underline"
                  >
                    here
                  </a>{" "}
                  to join.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
