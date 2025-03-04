import React from "react";
import { FaDownload } from "react-icons/fa";
import Layout from "../components/layout";
import Banner, { BannerType } from "../components/banner";
import Description from "@/components/description";
import ContentCard from "@/components/content-card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <Banner type={BannerType.About} />
      <main className="container-page flex flex-col gap-14">
        <section>
          <Description />
        </section>
        <ContentCard title="Donate"> {/* TODO: Discuss and decide if we want to keep this */}
          <div className="flex flex-col items-center text-center">
            <h2 className="text-xl leading-relaxed mb-6 max-w-2xl">
            Support our student branch in hosting exciting and impactful events!
            Consider making a donation to help us continue providing valuable opportunities
            for the WPI IEEE community.
            </h2>
            <Button
              asChild
              className="gap-2 p-8 bg-red-600 text-lg"
            >
              <a 
                href="https://www.givecampus.com/campaigns/40435/donations/new?designation=instituteofelectricalandelectronicsengineers&a=9699234"
              >
                Donate Here!
              </a>
            </Button>
          </div>
          </ContentCard>
        <ContentCard title="Bylaws">
          <div className="flex flex-col items-center text-center">
            <p className="text-lg leading-relaxed mb-6 max-w-2xl">
              View our branch bylaws.
            </p>
            <Button
              asChild
              className="gap-2"
            >
              <a
                href="https://github.com/ieee-wpi/policies"
                download
              >
                <ExternalLink />
                View Bylaws
              </a>
            </Button>
          </div>
        </ContentCard>
      </main>
    </Layout>
  );
}
