import React from 'react';
import { useReveal } from '../Home/useReveal.js';
import '../Home/animations.css';
import './Sponsor.css';

const sponsorsData = [
  { name: 'GAIL', url: '/gail.png' },
  { name: 'HP', url: '/hp.png' },
  { name: 'IndianOil', url: '/indianoil.png' },
  { name: 'ONGC', url: '/mrpl.png' },
  { name: 'Indorama', url: '/indorama.png' },
  { name: 'ISRO', url: '/isro.png' },
  { name: 'CSIR', url: '/csir.png' },
  { name: 'SBI', url: '/sbi.png' },
  { name: 'NRL', url: '/nrl.jpg' },
  { name: 'SERB INDIA', url: '/inserb.png' },
  { name: 'PNB', url: '/pnb.png' },
  { name: 'Burger Singh', url: '/burger.png' }
];

import SponsorsHero from './SponsorsHero';

const Sponsor = () => {
  const [containerRef, containerVisible] = useReveal(0.1);

  return (
    <>
      <SponsorsHero />
      <div className="sponsors-page">
        <div ref={containerRef} className={`sponsors-container reveal ${containerVisible ? 'visible' : ''}`}>
          <h2 className="past-sponsors-title">Past Sponsors</h2>
          <div className="sponsors-grid">
            {sponsorsData.map((sponsor, idx) => (
              <div key={idx} className={`sponsor-card reveal-scale reveal-d${idx % 8 + 1} ${containerVisible ? 'visible' : ''}`}>
                <img src={sponsor.url} alt={sponsor.name} className="sponsor-logo" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sponsor;
