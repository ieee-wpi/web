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
