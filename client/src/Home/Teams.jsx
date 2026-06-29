import React, { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { bentoCards } from '../TeamProfile/teamsData'
import { useReveal } from './useReveal.js'
import { useTextReveal } from './useTextReveal.js'
import './Teams.css'

const Teams = () => {
  const navigate  = useNavigate()
  const [ref, isVisible] = useReveal(0.1)
  const titleRef  = useTextReveal(0.15)
  const gridRef   = useRef(null)

  /* ---- Grid-level mouse spotlight ---- */
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const onMove = (e) => {
      const r = grid.getBoundingClientRect()
      grid.style.setProperty('--sx', `${e.clientX - r.left}px`)
      grid.style.setProperty('--sy', `${e.clientY - r.top}px`)
    }
    const onLeave = () => {
      grid.style.setProperty('--sx', '-9999px')
      grid.style.setProperty('--sy', '-9999px')
    }

    grid.addEventListener('mousemove', onMove, { passive: true })
    grid.addEventListener('mouseleave', onLeave)
    return () => {
      grid.removeEventListener('mousemove', onMove)
      grid.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  /* ---- Per-card 3D tilt ---- */
  const onTiltMove = useCallback((e) => {
    const el = e.currentTarget
    const r  = el.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)
    const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2)
    el.style.setProperty('--rx', `${-dy * 5}deg`)
    el.style.setProperty('--ry', `${dx  * 5}deg`)
  }, [])

  const onTiltLeave = useCallback((e) => {
    e.currentTarget.style.setProperty('--rx', '0deg')
    e.currentTarget.style.setProperty('--ry', '0deg')
  }, [])

  return (
    <section className="teams-section" ref={ref}>

      <div className={`teams-header ${isVisible ? 'visible' : ''}`}>
        <div className="teams-header-left">
          <span className="teams-eyebrow">Our People</span>
          {/* overflow:hidden on the wrapper lets useTextReveal clip the roll-in */}
          <div style={{ overflow: 'hidden' }}>
            <h2 ref={titleRef} className="teams-title">
              Leadership &amp; <em>Team</em>
            </h2>
          </div>
        </div>
        <p className="teams-tagline">
          The minds behind SRC&nbsp;'26 — a collective of engineers, designers,
          and organizers working together to make this conference exceptional.
        </p>
      </div>

      <div className="teams-grid" ref={gridRef}>
        {bentoCards.map((card, i) => {
          const beigeShades = ['#eaddc5', '#f5eedc', '#F5DFB3', '#DDC8A0', '#EED8B3', '#E3D5BA']
          const accentColor = beigeShades[i % beigeShades.length]
          const num         = (i + 1).toString().padStart(2, '0')
          const isWide      = card.span === 'col-span-2'
          const allMembers  = [...card.chairs, ...card.coordinators]
          const chips       = allMembers.slice(0, isWide ? 3 : 2)
          const extra       = allMembers.length - chips.length

          return (
            <div
              key={card.id}
              className={`team-card${isWide ? ' team-card--wide' : ''} ${isVisible ? 'visible' : ''}`}
              style={{ '--c': accentColor, '--delay': `${i * 0.05}s` }}
              onClick={() => navigate(`/team-profile/${card.id}`)}
              onMouseMove={onTiltMove}
              onMouseLeave={onTiltLeave}
            >
              <div className="team-card-accent" />
              <div className="team-card-orb" />
              <span className="team-card-num" aria-hidden="true">{num}</span>

              <div className="team-card-body">
                <h3 className="team-card-name">{card.name}</h3>
                <p className="team-card-desc">{card.description}</p>
              </div>

              <div className="team-card-footer">
                <div className="team-card-chips">
                  {chips.map((m, ci) => (
                    <span key={ci} className="team-chip">
                      {m.name.split(' ')[0]}
                    </span>
                  ))}
                  {extra > 0 && (
                    <span className="team-chip team-chip--more">+{extra}</span>
                  )}
                </div>
                <button className="team-card-cta" tabIndex={-1}>
                  View <span className="cta-arrow">→</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Teams
