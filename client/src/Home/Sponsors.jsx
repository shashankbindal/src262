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
    <section className={`premium-sponsors-section reveal ${isVisible ? 'visible' : ''}`} ref={ref}>
      <div className="sponsors-header">
        <span className="sponsors-subtitle">Trusted by Industry Leaders</span>
        <h2 className="sponsors-title">Our Partners</h2>
        <div className="sponsors-divider"></div>
      </div>

      <div className="sponsors-marquee-wrapper">
        <div className="sponsors-marquee-track">
          {[...sponsorsData, ...sponsorsData].map((item, index) => (
            <div key={index} className="premium-sponsor-card">
              <div className="sponsor-card-inner">
                <img src={item.url} alt={item.name} className="premium-sponsor-logo" loading="lazy" decoding="async" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Sponsors
