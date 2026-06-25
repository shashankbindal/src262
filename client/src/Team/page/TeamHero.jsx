import React from 'react';
import { useReveal } from '../../Home/useReveal.js';
import '../../Home/animations.css';
import './TeamHero.css';

const TeamHero = () => {
  const [heroRef, heroVisible] = useReveal(0.1);

  return (
    <div className="team-hero">
      <div className="team-hero-bg"></div>
      <div className="team-hero-fade"></div>
      <div ref={heroRef} className={`team-hero-content reveal-scale ${heroVisible ? 'visible' : ''}`}>
        <h1 className="team-hero-title">OUR TEAM</h1>
        <p className="team-hero-subtitle">The minds behind SRC '26</p>
      </div>
    </div>
  );
};

export default TeamHero;
