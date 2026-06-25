import React from 'react';
import { bentoCards } from '../../TeamProfile/teamsData';
import { useReveal } from '../../Home/useReveal.js';
import '../../Home/animations.css';
import './Team.css';
import TeamHero from './TeamHero';

const Team = () => {
  return (
    <>
      <TeamHero />
      <div className="team-page-container">
        <div className="teams-list">
        {bentoCards.map((team, idx) => {
          const [teamRef, teamVisible] = useReveal(0.1);
          
          return (
          <div ref={teamRef} key={team.id} className={`team-group reveal-scale ${teamVisible ? 'visible' : ''}`} style={{ '--team-color': team.color || 'var(--primary)' }}>
            <h2 className="team-group-name">{team.name}</h2>
            
            <div className="team-hierarchy">
              <div className="hierarchy-level">
                {(() => {
                  const chairs = (team.chairs || []).map(c => ({ ...c, type: 'chair' }));
                  const coords = (team.coordinators || []).map(c => ({ ...c, type: 'coordinator' }));
                  
                  let arrangedMembers = [...chairs];
                  coords.forEach((coord, i) => {
                    if (i % 2 === 0) {
                      arrangedMembers.unshift(coord);
                    } else {
                      arrangedMembers.push(coord);
                    }
                  });

                  return (
                    <>
                      {arrangedMembers.map((member, index) => {
                        const { role, name, image, type } = member;
                        return (
                          <div key={`${name}-${index}`} className={`member-card ${type}-card reveal-d${index % 8 + 1}`}>
                            <div className="member-image-placeholder">
                              {image && <img src={image} alt={name} className="member-image" loading="lazy" decoding="async" />}
                            </div>
                            <div className="member-info">
                              <h3 className="member-name">{name}</h3>
                              <p className="member-role">{role}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="mobile-break"></div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {idx !== bentoCards.length - 1 && <div className="team-divider"></div>}
          </div>
          )
        })}
      </div>
    </div>
    </>
  );
};

export default Team;
