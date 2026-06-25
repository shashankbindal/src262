import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { bentoCards } from '../TeamProfile/teamsData'
import { useReveal } from './useReveal.js'
import './Teams.css'

const Teams = () => {
  const navigate = useNavigate();
  const [ref, isVisible] = useReveal(0.1);
  const carouselRef = useRef(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  return (
    <div className="teams-section" ref={ref}>
      <div className={`teams-header-carousel reveal-left ${isVisible ? 'visible' : ''}`}>
        <div>
          <h2 className="teams-title">Leadership & Team</h2>
          <p className="teams-subtitle">The minds behind SRC '26</p>
        </div>
        <div className="carousel-nav-buttons">
          <button className="carousel-nav-btn" onClick={scrollLeft}>&larr;</button>
          <button className="carousel-nav-btn" onClick={scrollRight}>&rarr;</button>
        </div>
      </div>
      
      <div className="teams-carousel-wrapper" ref={carouselRef}>
        <div className="teams-carousel-row">
          {bentoCards.map((card, index) => {
            const num = (index + 1).toString().padStart(2, '0');
            return (
              <div 
                key={card.id} 
                className={`carousel-card reveal-scale reveal-d${Math.min(index + 1, 8)} ${isVisible ? 'visible' : ''}`}
                style={{ '--team-color': card.color || 'var(--primary)' }}
              >
                <div className="carousel-card-number">{num}</div>
                <div className="carousel-card-inner">
                  <h3 className="carousel-team-name">{card.name}</h3>
                  <button className="carousel-know-more" onClick={() => navigate(`/team-profile/${card.id}`)}>
                    <span className="text">View Profile</span> <span className="arrow">&rarr;</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default Teams
