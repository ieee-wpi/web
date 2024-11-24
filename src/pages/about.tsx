import React from 'react';
import Layout from '../components/Layout';
import { StaticImage } from 'gatsby-plugin-image';
import { graphql, useStaticQuery } from 'gatsby';
import { FaDownload } from 'react-icons/fa';

const AboutPage: React.FC = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "pdfs/bylaws.pdf" }) {
        publicURL
      }
    }
  `);

  const pdfUrl = data.file.publicURL;

  return (
    <Layout>
      <section className="relative h-[40vh] flex justify-start items-center text-white text-left px-6 lg:px-32">
        <StaticImage
          src="../images/img/heroes/about_hero.png"
          alt="About Hero"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="relative z-10 bg-black bg-opacity-50 p-4 rounded backdrop-blur-sm">
          <h1 className="text-9xl font-bold tracking-wide">About</h1>
        </div>
      </section>
      <section className="bg-white py-10 px-6 lg:px-80 text-left">
        <p className="text-xl mb-6 leading-relaxed">
          IEEE is the world’s largest technical professional organization dedicated to advancing technology for the
          benefit of humanity. IEEE and its members inspire a global community through its highly cited publications,
          conferences, technology standards, and professional and educational activities.
        </p>
        <p className="text-xl mb-6 leading-relaxed">
          Our student branch is focused on organizing engaging <strong>technical, professional, and social events</strong> for the WPI community, primarily for electronics and computing-related majors. Our members are passionate about technology, and focused on cultivating an enriching student life for the WPI electronics and computing community. We typically host weekly events, usually with free food, during the school year.
        </p>
        <p className="text-xl mb-6 leading-relaxed">
          We have a student lounge in the Atwater Kent building, with a microwave, fridge, coffee machine, and printer.
          We have a variety of project materials also in the lounge.
        </p>
        <p className="text-xl leading-relaxed">
          Have a question or want to reach out? Send us an email at{' '}
          <a href="mailto:gr-ieee-exec@wpi.edu" className="text-blue-500 underline">
            gr-ieee-exec@wpi.edu
          </a>
          !
        </p>
      </section>
      <section className="py-10 px-6 lg:px-80 bg-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-left">
            <h2 className="text-2xl font-bold underline mb-4">Bylaws PDF</h2>
            <p className="text-lg leading-relaxed mb-4">
              Access the IEEE Student Branch bylaws to understand our operations and structure.
            </p>
            <a
              href={pdfUrl}
              download
              className="text-blue-500 flex items-center hover:text-blue-700"
              title="Download Bylaws PDF"
            >
              <FaDownload className="w-6 h-6 mr-2" />
              Download Bylaws
            </a>
          </div>

          <div className="w-full">
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              width="100%"
              height="500"
              className="border rounded"
              title="IEEE Bylaws"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
