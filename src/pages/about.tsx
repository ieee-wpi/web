import React from 'react';
import Layout from '../components/Layout';
import { StaticImage } from 'gatsby-plugin-image';
import { graphql, useStaticQuery } from 'gatsby';
//graphql query to yank the pdf out of the path defined in the gatsby config
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
      <section className="relative h-[60vh] flex justify-center items-center text-white text-center">
        <StaticImage
          src="../images/img/heroes/about_hero.png"
          alt="About Hero"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="relative z-10 bg-black bg-opacity-50 p-4 rounded backdrop-blur-md">
          <h1 className="text-4xl font-bold">About</h1>
        </div>
      </section>

      <section className="bg-white py-10 px-6 text-center">
        <p className="text-lg mb-4">
          IEEE is the world’s largest technical professional organization dedicated to advancing technology for the
          benefit of humanity. IEEE and its members inspire a global community through its highly cited publications,
          conferences, technology standards, and professional and educational activities.
        </p>
        <p className="text-lg mb-4">
          Our student branch is focused on organizing engaging <strong>technical, professional, and social events</strong> for the WPI community, primarily for electronics and computing-related majors. Our members are passionate about technology, and focused on cultivating an enriching student life for the WPI electronics and computing community. We typically host weekly events, usually with free food, during the school year.
        </p>
        <p className="text-lg mb-4">
          We have a student lounge in the Atwater Kent building, with a microwave, fridge, coffee machine, and printer.
          We have a variety of project materials also in the lounge.
        </p>
        <p className="text-lg">
          Have a question or want to reach out? Send us an email at{' '}
          <a href="mailto:gr-ieee-exec@wpi.edu" className="text-blue-500 underline">
            gr-ieee-exec@wpi.edu
          </a>
          !
        </p>
      </section>

      <section className="py-10 px-6 bg-gray-100 text-center">
        <h2 className="text-2xl font-bold mb-4">Bylaws</h2>

        <div className="mt-6">
          
          <iframe
            src={pdfUrl}
            width="100%"
            height="600"
            className="border rounded"
            title="IEEE Bylaws"
          />
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
