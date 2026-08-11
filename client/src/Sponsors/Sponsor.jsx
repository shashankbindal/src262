import React from 'react';
import { useReveal } from '../Home/useReveal.js';
import { useDocumentTitle } from '../shared/useDocumentTitle.js';
import '../Home/animations.css';
import './Sponsor.css';

const sponsorsData = [
  { name: 'HMEL', url: '/hmel.svg', href: 'https://www.hmel.in/' }
];

import SponsorsHero from './SponsorsHero';

const Sponsor = () => {
  useDocumentTitle('Sponsors | VIPLAV 2026 — AIChE India SRC');
  const [containerRef, containerVisible] = useReveal(0.1);

  return (
    <>
      <SponsorsHero />
      <div className="sponsors-page">
        <div ref={containerRef} className={`sponsors-container reveal ${containerVisible ? 'visible' : ''}`}>
          <h2 className="current-sponsor-title">Our Sponsor</h2>
          <div className="sponsors-grid">
            {sponsorsData.map((sponsor, idx) => (
              <a key={idx} href={sponsor.href} target="_blank" rel="noreferrer" className={`sponsor-card reveal-scale reveal-d${idx % 8 + 1} ${containerVisible ? 'visible' : ''}`}>
                <img src={sponsor.url} alt={sponsor.name} className="sponsor-logo" loading="lazy" decoding="async" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sponsor;
