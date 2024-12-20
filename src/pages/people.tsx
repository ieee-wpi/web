import React from "react";
import { graphql } from "gatsby";
import { IGatsbyImageData } from "gatsby-plugin-image";
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
  { name: "Daniel Gorbunov", position: "President", imageName: "daniel" },
  { name: "Hubert Liu", position: "Vice President", imageName: "hubert" },
  { name: "Ryan Ranjitkar", position: "Secretary", imageName: "ryan" },
  { name: "George Shi", position: "Treasurer", imageName: "george" },
  { name: "Jack Kamataris", position: "Events Officer", imageName: "jack" },
  { name: "Todd Petry", position: "Events Officer", imageName: "todd" },
  { name: "Brendon Peters", position: "Public Relations Chair", imageName: "brendon" },
  { name: "Will Buchta", position: "Projects Chair", imageName: "will" },
  { name: "Artem Frenk", position: "Web Chair", imageName: "artem" },
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
        <ContentCard title="2024-2025 Officer Board">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {officers.map((officer, idx) => (
              <OfficerProfile
                key={idx}
                name={officer.name}
                position={officer.position}
                image={officer.image}
              />
            ))}
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
