import React from 'react';
import Card from '../component/Card.jsx';
import './Event.css';

const eventsList = [
  {
    id: 1,
    title: "Chem-E-Car Competition",
    description: "A flagship AIChE event that challenges students to design and build a small vehicle powered and controlled entirely by chemical reactions. Combining innovation, engineering design, and problem-solving, the competition showcases the practical application of chemical engineering principles in a fun and competitive environment. Participants apply technical knowledge, creativity, and teamwork to solve real-world engineering problems.",
    image: "https://www.aiche.org/sites/default/files/images/conference/event/23370477461_f16f1dd228_z.jpg",
    rulebookLink: "#",
    chairs: [
      { role: "Chair (External)", name: "Divisha Tiwari" },
      { role: "Chair (Internal)", name: "Tapesh Kumar" },
    ],
    coordinators: [{ role: "Coordinator", name: "Ananya Priyam Mishra" }],
  },
  {
    id: 2,
    title: "K-12 Competition",
    description: (
      <>
        The AIChE K-12 competition invites undergraduate chemical engineering innovators to design and present interactive, high-impact STEM projects tailored for young minds. Aimed at age groups ranging from kindergarten to grade 12, teams will demonstrate complex scientific principles through engaging working models, live demonstrations, or creative posters across four specific student categories:
        <ul style={{ margin: "12px 0", paddingLeft: "24px" }}>
          <li><strong>Curious Minds</strong> (KG–Grade 2)</li>
          <li><strong>Emerging Sparks</strong> (Grade 3–Grade 5)</li>
          <li><strong>Critical Thinkers</strong> (Grade 6–Grade 8)</li>
          <li><strong>Future Engineers</strong> (Grade 9–Grade 12)</li>
        </ul>
        The event challenges future engineers to translate real-world problem-solving into safe, student-friendly, and educational experiences that cultivate a lifelong curiosity for science and technology.
      </>
    ),
    image: "https://learningliftoff.com/wp-content/uploads/2023/01/pexels-artem-podrez-6941450-1536x864.jpg.webp",
    rulebookLink: "#",
    chairs: [{ role: "Chair", name: "Kartik Gogia" }],
    coordinators: [
      { role: "Coordinator", name: "Prashant Vishwakarma" },
      { role: "Coordinator", name: "Deepti Tomar" },
    ],
  },
  {
    id: 3,
    title: "Poster Presentation Competition",
    description: "The Poster Presentation Competition transforms complex ideas into compelling visual narratives. Participants communicate their research, projects, and innovative concepts through concise and impactful poster designs, engaging both judges and peers. The event promotes effective scientific communication, creativity, and interdisciplinary collaboration while highlighting emerging trends and innovations in engineering and technology.",
    image: "https://images.unsplash.com/photo-1771344488060-f6b32a503b34?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rulebookLink: "#",
    chairs: [],
    coordinators: [],
  },
  {
    id: 4,
    title: "Technical Paper Presentation Competition",
    description: "The Technical Paper Presentation provides a platform for students to showcase original research, innovative methodologies, and cutting-edge developments in chemical engineering and allied disciplines. Participants present their work before a panel of experts, fostering scientific dialogue, critical thinking, and knowledge exchange. The competition celebrates research excellence while encouraging students to address real-world challenges through engineering solutions.",
    image: "https://images.unsplash.com/photo-1515603403036-f3d35f75ca52?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dnsplash.com/photo-1558021212-51b6ecfa0db9?q=80&w=800&auto=format&fit=crop",
    rulebookLink: "#",
    chairs: [{ role: "Chair", name: "Omika Singh" }],
    coordinators: [
      { role: "Coordinator", name: "Aditya Raj" },
      { role: "Coordinator", name: "Anshu Kumari" },
    ],
  },
  {
    id: 5,
    title: "Chem-E-Jeopardy Competition",
    description: "ChemE Jeopardy is a fast-paced academic competition that challenges participants to think critically, respond quickly, and apply their knowledge in a fun and engaging format. Inspired by the popular Jeopardy-style game, teams compete by identifying the correct questions to given answers while demonstrating teamwork, strategy, and problem-solving skills. The event provides a platform for students to showcase their abilities and learn from their peers.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5jUsij8b-x-PBqn3yMZbAYUwfyACiF3GPAw&s",
    rulebookLink: "#",
    chairs: [{ role: "Chair", name: "Shreeyanshi Tripathi" }],
    coordinators: [{ role: "Coordinator", name: "Haritha Sree Vakati" }],
  },

];

const Event = () => {
  return (
    <div className="events-page-container">
      <div className="events-page-header">
        <h1 className="events-page-title">Events</h1>
        <p className="events-page-subtitle">Discover the exciting competitions, presentations, and interactive activities lined up for SRC 2026.</p>
      </div>

      <div className="events-cards-wrapper">
        {eventsList.map((event, index) => (
          <Card key={event.id} event={event} index={index} />
        ))}
      </div>
    </div>
  );
};

export default Event;
