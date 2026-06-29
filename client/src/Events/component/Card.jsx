import React, { useRef } from 'react';
import { useReveal } from '../../Home/useReveal.js';
import { useStaggerLines } from '../../Home/useStaggerLines.js';
import './Card.css';

const Card = ({ event, index }) => {
  const isEven = index % 2 !== 0;
  const team = [...(event.chairs || []), ...(event.coordinators || [])];
  
  const [cardRef, cardVisible] = useReveal(0.1);
  const textRef = useStaggerLines('p, ul', 0.15);

  // Assign brutalist colors based on index
  const colors = ["#00a651", "#f5eedc", ];
  const bgColor = colors[index % colors.length];
  const textColor = bgColor === "#f5eedc" ? "#000" : "#fff";

  return (
    <div 
      ref={cardRef} 
      className={`competition-card-container ${isEven ? 'even' : 'odd'} reveal-scale ${cardVisible ? 'visible' : ''}`}
      style={{ backgroundColor: bgColor, color: textColor, borderColor: '#000' }}
    >
      <div className="competition-card-image">
        <img
          src={event.image || "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop"}
          alt={event.title}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="competition-card-content" style={{ backgroundColor: bgColor }}>
        <h2 className="competition-card-title">{event.title}</h2>
        <div className="competition-card-description" ref={textRef}>
          {typeof event.description === 'string' ? <p>{event.description}</p> : event.description}
        </div>

        {team.length > 0 && (
          <div className="competition-card-team">
            {team.map((member, i) => (
              <span key={`${member.name}-${i}`} className="competition-team-pill">
                <span className="competition-team-role">{member.role}</span>
                <span className="competition-team-name">{member.name}</span>
              </span>
            ))}
          </div>
        )}

        <a href={event.rulebookLink || "#"} className="competition-rulebook-btn" target="_blank" rel="noreferrer">
          Download Rulebook
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default Card;
