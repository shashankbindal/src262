import React from 'react';
import { useReveal } from '../Home/useReveal.js';
import '../Home/animations.css';
import './SponsorsHero.css';

const SponsorsHero = () => {
  const [heroRef, heroVisible] = useReveal(0.1);

  return (
    <div className="sponsors-hero">
      <div ref={heroRef} className={`sponsors-hero-content reveal-scale ${heroVisible ? 'visible' : ''}`}>
        <h1 className="sponsors-hero-title">OUR SPONSOR</h1>
        <p className="sponsors-hero-subtitle">
          POWERING THE NEXT GENERATION
        </p>
      </div>
    </div>
  );
};

export default SponsorsHero;
