import React from 'react';
import Layout from '../components/Layout';
import { StaticImage } from 'gatsby-plugin-image';

const NetworkingPage: React.FC = () => {
    return (
        <Layout>
            <section className= "relative h-[65vh] w-full flex items-end justify-start text-white text-left px-6">
            <StaticImage
                src="../images/img/sparks.jpg"
                alt="Sparks Background"
                className="absolute inset-0 w-full h-full object-cover z-0 hero"
                />
            </section>

        </Layout>
    );
}

export default NetworkingPage;
