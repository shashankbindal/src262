import React from 'react';
import './SponsorsHero.css';

const SponsorsHero = () => {
  return (
    <div className="sponsors-hero">
      <div className="sponsors-hero-bg"></div>
      <div className="sponsors-hero-fade"></div>
      <div className="sponsors-hero-content">
        <h1 className="sponsors-hero-title">Our Past Sponsors</h1>
        <p className="sponsors-hero-subtitle">
          Supported by industry leaders who believe in innovation, leadership, and the future of engineering.
        </p>
      </div>
    </div>
  );
};

export default SponsorsHero;
