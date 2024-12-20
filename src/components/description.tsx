import React from "react";

export default function Description() {
    return (
        <>
            <p className="text-lg">
                IEEE is the world’s largest technical professional
                organization dedicated to advancing technology for the benefit
                of humanity. IEEE and its members inspire a global community
                through its highly cited publications, conferences, technology
                standards, and professional and educational activities.
            </p>
            <p className="text-lg">
                <br /> Our student branch is focused on organizing engaging{" "}
                <strong>technical, professional, and social events</strong>{" "}
                for the WPI community, primarily for electronics and
                computing-related majors. Our members are passionate about
                technology and focused on cultivating an enriching student
                life for the WPI electronics and computing community.
            </p>
            <p className="text-lg">
                <br /> We have a student lounge in{" "}
                <a
                href="https://maps.app.goo.gl/H9d2DcqgULoDuDiM6"
                className="underline hover:text-blue-600"
                target="_blank"
                rel="noreferrer noopener"
                >
                Atwater Kent Labs
                </a>{" "}
                with a microwave, fridge, coffee machine, and printer. We also have a variety of electronics and project materials in the lounge. We
                typically host weekly events, usually with free food, during
                the school year.
            </p>
            <p className="text-lg">
                <br /> Are you an alumni? Send us an {" "}
                <a
                href="mailto:gr-ieee-exec@wpi.edu"
                className="underline hover:text-blue-600"
                >
                email
                </a>{" "}
                to connect with us.
            </p>
    </>
    )
}