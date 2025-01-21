import React from "react";
import { Link, HeadFC, PageProps } from "gatsby";
import Layout from "@/components/layout";
import Banner, { BannerType } from "@/components/banner";

const NotFoundPage: React.FC<PageProps> = () => {
  return (
    <Layout>
      <Banner type={BannerType.NotFound} />
      <main className="container-page flex-1 min-h-[calc(100vh-550px)]">
        <p className="text-xl h-full flex flex-col justify-center">
          <strong className="mb-2">Sorry, the page you were looking for was not found.</strong>
          <br />
          <Link to="/" className="text-blue-600 hover:underline">Return home</Link>
        </p>
      </main>
    </Layout>
  );
};

export default NotFoundPage;

export const Head: HeadFC = () => <title>Not found</title>;
