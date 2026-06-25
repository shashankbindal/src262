import React from 'react'
import { useReveal } from './useReveal.js'
import './Sponsors.css'

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

const Sponsors = () => {
  const [ref, isVisible] = useReveal(0.1);

  return (
    <div className={`sponsors-section reveal ${isVisible ? 'visible' : ''}`} ref={ref}>
      <h2 className="sponsors-title">Our Past Sponsors</h2>
      <div className="sponsors-marquee-wrapper">
        <div className="sponsors-marquee-track">
          
          {[...sponsorsData, ...sponsorsData].map((item, index) => (
            <div key={index} className="sponsor-card">
              <img src={item.url} alt={item.name} className="sponsor-logo" loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sponsors
