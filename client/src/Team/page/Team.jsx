import React from 'react';
import { bentoCards } from '../../TeamProfile/teamsData';
import './Team.css';
import TeamHero from './TeamHero';

const Team = () => {
  return (
    <>
      <TeamHero />
      <div className="team-page-container">
        <div className="teams-list">
        {bentoCards.map((team, idx) => (
          <div key={team.id} className="team-group" style={{ '--team-color': team.color || 'var(--primary)' }}>
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
                          <div key={`${name}-${index}`} className={`member-card ${type}-card`}>
                            <div className="member-image-placeholder">
                              {image && <img src={image} alt={name} className="member-image" />}
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
        ))}
      </div>
    </div>
    </>
  );
};

export default Team;
