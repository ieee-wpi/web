import React from "react";
import { StaticImage } from "gatsby-plugin-image";
import { graphql, useStaticQuery } from "gatsby";
import { FaDownload } from "react-icons/fa";
import Layout from "../components/layout";
import Banner, { BannerType } from "../components/banner";
import Description from "@/components/description";
import ContentCard from "@/components/content-card";

export default function AboutPage() {
  return (
    <Layout>
      <Banner type={BannerType.About} />
      <main className="container-page flex flex-col gap-14">
        <section>
          <Description />
        </section>
        <ContentCard title="Bylaws">
          <div className="flex flex-col items-center text-center">
            <p className="text-lg leading-relaxed mb-6 max-w-2xl">
              View our student branch's bylaws.
            </p>
            <a
              href="https://github.com/ieee-wpi/policies"
              download
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Download Bylaws"
            >
              <FaDownload className="w-5 h-5 mr-2" />
              Download Bylaws
            </a>
          </div>
        </ContentCard>
      </main>
    </Layout>
  );
}
