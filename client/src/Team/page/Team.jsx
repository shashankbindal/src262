import React from 'react';
import { bentoCards } from '../../TeamProfile/teamsData';
import { useReveal } from '../../Home/useReveal.js';
import { useTilt } from '../../shared/useTilt.js';
import { useDocumentTitle } from '../../shared/useDocumentTitle.js';
import '../../Home/animations.css';
import './Team.css';
import TeamHero from './TeamHero';

const Team = () => {
  useDocumentTitle('Organizing Team | VIPLAV 2026 — AIChE India SRC');
  const { onTiltMove, onTiltLeave } = useTilt(7);

  return (
    <>
      <TeamHero />
      <div className="team-page-container">

        {/* ── Faculty Advisor ── */}
        <div className="faculty-advisor-section">
          <p className="faculty-advisor-eyebrow">Our Mentor</p>
          <h2 className="faculty-advisor-heading">Faculty Advisor</h2>
          <div className="faculty-advisor-card">
            <div className="faculty-advisor-img-wrap">
              <img src="/team/mentor.jpg" alt="Faculty Advisor" className="faculty-advisor-img" loading="lazy" decoding="async" />
            </div>
            <div className="faculty-advisor-info">
              <h3 className="faculty-advisor-name">Dr. Vivek Kumar</h3>
              <p className="faculty-advisor-role">Faculty Advisor</p>
            </div>
          </div>
        </div>

        <div className="faculty-divider" />

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
                          <div
                            key={`${name}-${index}`}
                            className={`member-card ${type}-card reveal reveal-d${index % 8 + 1} ${teamVisible ? 'visible' : ''}`}
                            onMouseMove={onTiltMove}
                            onMouseLeave={onTiltLeave}
                          >
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
