import React, { useState } from 'react';
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
  return (
    <>
      <SponsorsHero />
      <div className="sponsors-page">
        <div className="sponsors-container">
          <div className="sponsors-grid">
            {sponsorsData.map((sponsor, idx) => (
              <div key={idx} className="sponsor-card">
                <img src={sponsor.url} alt={sponsor.name} className="sponsor-logo" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sponsor;
