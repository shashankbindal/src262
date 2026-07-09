import React from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from './useReveal.js';
import './Teams.css';

const Teams = () => {
  const [ref, isVisible] = useReveal(0.15);

  const previewAvatars = [
    { name: "Shubhendra Singh", image: "https://res.cloudinary.com/cnocxcvz/image/upload/v1783560169/site/team/tensoezneukr6an6gxjc.jpg" },
    { name: "Rudrakesh", image: "https://res.cloudinary.com/cnocxcvz/image/upload/v1783560144/site/team/y0xqopmq6e6sv0ahqcki.jpg" },
    { name: "Chirantan Toley", image: "https://res.cloudinary.com/cnocxcvz/image/upload/v1783560115/site/team/rsew7qelfjbdy1c5ofcz.jpg" },
    { name: "Divisha Tiwari", image: "https://res.cloudinary.com/cnocxcvz/image/upload/v1783560119/site/team/xeqxlaulnzdmtfr0rutt.jpg" },
    { name: "Yashu Raj", image: "https://res.cloudinary.com/cnocxcvz/image/upload/v1783560177/site/team/rhrxdhdylkz6sttpagda.jpg" }
  ];

  return (
    <section className="teams-teaser-section" ref={ref}>
      <div className={`teams-teaser-container ${isVisible ? 'visible' : ''}`}>
        
        {/* Left Card: Overlapping avatars and stats */}
        <div className="teams-teaser-card">
          <div className="avatar-stack">
            {previewAvatars.map((avatar, idx) => (
              <div key={idx} className="avatar-circle">
                <img src={avatar.image} alt={avatar.name} className="avatar-img" />
              </div>
            ))}
          </div>
          <div className="teaser-stats">
            <span className="teaser-stats-text">16 TEAMS &middot; 47+ ORGANIZERS</span>
          </div>
        </div>

        {/* Right Info: Headings, description, and link to team page */}
        <div className="teams-teaser-info">
          <span className="teams-teaser-eyebrow">Our People</span>
          <h2 className="teams-teaser-title">
            Leadership &amp; Team
          </h2>
          <p className="teams-teaser-tagline">
            The minds behind SRC '26 &mdash; a collective of engineers, designers,
            and organizers working together to make this conference exceptional.
          </p>
          <Link to="/team" className="teams-teaser-btn" data-magnetic>
            Meet the Team
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default Teams;
