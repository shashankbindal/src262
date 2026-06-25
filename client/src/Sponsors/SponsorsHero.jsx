import React from 'react';
import { useReveal } from '../Home/useReveal.js';
import '../Home/animations.css';
import './SponsorsHero.css';

const SponsorsHero = () => {
  const [heroRef, heroVisible] = useReveal(0.1);

  return (
    <div className="sponsors-hero">
      <div className="sponsors-hero-bg"></div>
      <div className="sponsors-hero-fade"></div>
      <div ref={heroRef} className={`sponsors-hero-content reveal-scale ${heroVisible ? 'visible' : ''}`}>
        <h1 className="sponsors-hero-title">Our Partners</h1>
        <p className="sponsors-hero-subtitle">
          Collaborating with industry leaders to power the next generation of engineering excellence.
        </p>
      </div>
    </div>
  );
};

export default SponsorsHero;
