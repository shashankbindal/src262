import React from 'react';
import './TeamHero.css';

const TeamHero = () => {
  return (
    <div className="team-hero">
      <div className="team-hero-bg"></div>
      <div className="team-hero-fade"></div>
      <div className="team-hero-content">
        <h1 className="team-hero-title">OUR TEAM</h1>
        <p className="team-hero-subtitle">The minds behind SRC '26</p>
      </div>
    </div>
  );
};

export default TeamHero;
