import type { GatsbyConfig } from "gatsby";

const config: GatsbyConfig = {
  siteMetadata: {
    title: `IEEE Site`,
    siteUrl: `https://www.ieee.wpi.edu`,
  },
  graphqlTypegen: true,
  plugins: [
    "gatsby-plugin-postcss",
    "gatsby-plugin-image",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: "./src/images/",
      },
      __key: "images",
    },
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "WPI IEEE Student Branch Site",
        short_name: "WPI IEEE",
        start_url: "/",
        background_color: "#ffffff",
        theme_color: "#002855", 
        display: "minimal-ui",
        icon: "src/images/img/logos/ieee.png", 
      },
    },
  ],
};

export default config;
