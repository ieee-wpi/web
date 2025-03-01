import React from "react";
import { graphql } from "gatsby";
import { IGatsbyImageData, StaticImage } from "gatsby-plugin-image";
import Layout from "@/components/layout";
import Banner, { BannerType } from "@/components/banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfficerProfile, OfficerProfileProps } from "@/components/officer-profile"
import { Separator } from "@/components/ui/separator";
import PastOfficers from "@/components/past-officers";
import ContentCard from "@/components/content-card";

interface PeoplePageProps {
  data: {
    allFile: {
      nodes: Array<{
        name: string;
        childImageSharp: {
          gatsbyImageData: IGatsbyImageData;
        };
      }>;
    };
  };
}

const officerData = [
  { name: "Jack Kamataris", position: "President", imageName: "jack" },
  { name: "Daniel Gorbunov", position: "Vice President", imageName: "daniel" },
  { name: "Stephanie Lee", position: "Secretary", imageName: "stephanie_lee" },
  { name: "Dhruv Madan", position: "Treasurer", imageName: "dhruv" },
  { name: "Ben Santana", position: "Events Officer", imageName: "ben_santana" },
  { name: "Mary Schwedatschenko ", position: "Events Officer", imageName: "Mary_s" },
  { name: "Brendon Peters", position: "Public Relations Chair", imageName: "brendon" },
  { name: "William Sobral", position: "Projects Chair", imageName: "who" },
  { name: "Samuel Goldsmith", position: "Web Chair", imageName: "Sam_Goldsmith" },
];

export default function PeoplePage({ data }: PeoplePageProps) {
  const imageMap = Object.fromEntries(
    data.allFile.nodes.map(node => [node.name, node.childImageSharp.gatsbyImageData])
  );

  const officers: OfficerProfileProps[] = officerData.map(officer => ({
    name: officer.name,
    position: officer.position,
    image: imageMap[officer.imageName],
  }));

  return (
    <Layout>
      <Banner type={BannerType.People} />
      <main className="container-page">
        <ContentCard title="2025-2026 Officer Board">
          <div className="flex flex-col space-y-8">
            <div className="flex justify-center">
              <div className="relative w-full max-w-4xl overflow-hidden rounded-lg shadow-lg">
                <StaticImage
                  src="../images/people/board.jpg"
                  alt="2024-2025 Officer Board"
                  className="w-full hover:scale-102 transition-transform duration-500"
                  loading="eager"
                />
              </div>
            </div>
            <Separator className="bg-slate-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {officers.map((officer, idx) => (
                <OfficerProfile
                  key={idx}
                  name={officer.name}
                  position={officer.position}
                  image={officer.image}
                />
              ))}
            </div>
          </div>
        </ContentCard>
        <div className="mt-12">
          <PastOfficers />
        </div>
      </main>
    </Layout>
  );
}

export const query = graphql`
  query {
    allFile(filter: { relativePath: { glob: "people/*.jpg" } }) {
      nodes {
        name
        childImageSharp {
          gatsbyImageData(
            width: 150
            height: 150
            layout: FIXED
            quality: 100
            formats: [AUTO, WEBP]
            placeholder: BLURRED
            transformOptions: { fit: COVER, cropFocus: CENTER }
          )
        }
      }
    }
  }
`;
