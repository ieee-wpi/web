import React from 'react';
import Layout from '../components/Navbar';
import Footer from '../components/Footer';
import { StaticImage } from 'gatsby-plugin-image';

const NetworkingPage: React.FC = () => {
    return (
        <>
        <Layout></Layout>
            <section className= "relative h-[40vh] w-full flex items-end justify-start text-white text-left px-6">
            <StaticImage
                src="../images/img/heroes/networking_hero.jpg"
                alt="Sparks Background"
                className="absolute inset-0 w-full h-full object-cover z-0 hero"
                />
            </section>
        <Footer/>
        </>
    );
}

export default NetworkingPage;
