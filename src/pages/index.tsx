import React from 'react';
import Layout from '../components/Layout';
import { StaticImage } from 'gatsby-plugin-image';

const IndexPage: React.FC = () => {
  return (
    <Layout>
      <section className="relative h-[65vh] w-full flex items-end justify-start text-white text-left px-6">
        <StaticImage
          src="../images/img/sparks.jpg"
          alt="Sparks Background"
          className="absolute inset-0 w-full h-full object-cover z-0 hero"
        />
        <div className="ltab_transp">
          <h1 className="text-5xl md:text-5xlfont-bold tracking-wide">
            We organize engaging <br />
            <strong>technical, professional, and social</strong> <br/> events at <strong>WPI</strong>.
          </h1>
        </div>
      </section>
      <section className="bg-white py-10 px-6 md:px-20">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="md:w-1/4">
            <a
              href="/about"
              className="text-3xl font-bold border-b-2 border-black inline-block hover:underline"
            >
              About
            </a>
          </div>
          <div className="md:w-3/4 text-left">
            <p className="text-lg mb-4">
              IEEE is the world’s largest technical professional organization dedicated to advancing technology for the
              benefit of humanity. IEEE and its members inspire a global community through its highly cited
              publications, conferences, technology standards, and professional and educational activities.
            </p>
            <p className="text-lg">
              Our student branch is focused on organizing engaging <strong>technical, professional, and social events</strong> for the WPI community, primarily for electronics and computing-related majors. Our members are passionate about technology and focused on cultivating an enriching student life for the WPI electronics and computing community.
            </p>
            <p className="text-lg">
              <br /> We have a student lounge in {' '}
              <a href = "https://maps.app.goo.gl/H9d2DcqgULoDuDiM6" className="text-blue-500 hover:underline" target = 
            "_blank" rel='noreferrer noopener'> 
              Atwater Kent Labs 
              </a> {' '}
              with a microwave, fridge, coffee machine, and printer.
              We typically host weekly events, usually with free food, during the school year.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white-100 py-10 px-6 md:px-20">
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
            <div className="flex flex-wrap justify-between gap-4">
              <a
                href="https://pcb.wpi.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-56 text-center block"
              >
                <div className="rounded shadow-lg hover:shadow-xl transition-shadow">
                  <StaticImage
                    src="../images/events/pcb-cover.png"
                    alt="PCB Design Class"
                    className="rounded"
                  />
                  <h3 className="text-xl font-bold mt-2">PCB Design Class</h3>
                  <p className="text-gray-500">September</p>
                </div>
              </a>
              <div className="w-56 text-center rounded shadow-lg hover:shadow-xl transition-shadow">
                <StaticImage
                  src="../images/events/spark-party-cover.png"
                  alt="Spark Party"
                  className="rounded"
                />
                <h3 className="text-xl font-bold mt-2">Spark Party</h3>
                <p className="text-gray-500">December</p>
              </div>
              <div className="w-56 text-center rounded shadow-lg hover:shadow-xl transition-shadow">
                <StaticImage
                  src="../images/events/networking-cover.png"
                  alt="Networking Night"
                  className="rounded"
                />
                <h3 className="text-xl font-bold mt-2">Networking Night</h3>
                <p className="text-gray-500">January</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 px-6 md:px-20">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="md:w-1/6">
            <a
              href="/people"
              className="text-3xl font-bold border-b-2 border-black inline-block hover:underline"
            >
              People
            </a>
          </div>
          <div className="md:w-3/6">
            <p className="text-lg mb-4">
              We have over 150 general members in our branch, across majors like ECE, CS, and RBE.
            </p>
            <p className="text-lg mb-4">
              Are you a WPI student interested in joining? Click{' '}
              <a 
                href="https://mywpi.wpi.edu/IEEE/club_signup" 
                target = "_blank" 
                rel='noreferrer noopener'
                className="text-blue-500 hover:underline">
              here
              </a> {' '}
               to join.
            </p>
            <p className="text-lg mb-6">Here is a photo of our 2024 officer board: </p>
          </div>
          <div className="md:w-2/6">
            <StaticImage
              src="../images/img/officer_board.png"
              alt="2024 Officer Board"
              className="rounded shadow-lg mx-auto"
            />
          </div>
        </div>
      </section>

    </Layout>
  );
};

export default IndexPage;
