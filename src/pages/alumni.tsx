import React from "react";
import { ExternalLink } from "lucide-react";
import Layout from "../components/layout";
import Banner, { BannerType } from "../components/banner";
import Description from "@/components/description";
import ContentCard from "@/components/content-card";
import { Button } from "@/components/ui/button";

export default function AlumniPage() {
  return (
    <Layout>
      <Banner type={BannerType.Alumni} />
      <main className="container-page flex flex-col gap-14">
        <section>
        <p className="text-lg">
            Welcome to the IEEE WPI Chapter's alumni page! We deeply value our alumni connections and encourage you to stay engaged by following us on social media.  
            If you're interested in hosting an event with the chapter, don't hesitate to reach out—we frequently organize Q&A panels and networking nights with alumni companies.  
            Stay tuned for open and alumni-exclusive events like Spark Party and our annual alumni barbecue.  
            For any questions or inquiries, please{" "}
            <a
                href="mailto:gr-ieee-exec@wpi.edu"
                className="underline hover:text-blue-600"
            >
                email us here.
            </a>
        </p>
        </section>
        <ContentCard title="Donate">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-xl leading-relaxed mb-6 max-w-2xl text-balance">
            Support our student branch in hosting exciting and impactful events!
            Consider making a donation to help us continue providing valuable opportunities
            for the WPI IEEE community.
            </h2>
            <Button
              asChild
              className="bg-red-600"
            >
              <a 
                href="https://www.givecampus.com/campaigns/40435/donations/new?designation=instituteofelectricalandelectronicsengineers&a=9699234"
                rel="noopener noreferrer"
              >
              <ExternalLink className="text-xl" />
              Donate
            </a>
            </Button>
          </div>
        </ContentCard>
        <ContentCard title="LinkedIn">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-xl leading-relaxed mb-6 max-w-2xl text-balance">
            Stay connected with our IEEE community! Join our LinkedIn group to see 
            highlights from our exciting events and projects, network with fellow 
            alumni, and stay updated on upcoming alumni gatherings. We’d love to
            keep in touch!
            </h2>
            <Button
              asChild
              style = {{backgroundColor: '#002855'}}
            >
              <a 
                href="https://www.linkedin.com/groups/13180757/"
                rel="noopener noreferrer"
              >
                <ExternalLink className="text-xl" />
                Linkedin
              </a>
            </Button>
          </div>
        </ContentCard>
      </main>
    </Layout>
  );
}
