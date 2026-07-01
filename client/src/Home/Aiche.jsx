import React from 'react'
import { useReveal } from './useReveal.js'
import { useTextScramble } from './useTextScramble.js'
import { useRevealWords } from './useRevealWords.js'
import CountUp from '../shared/CountUp.jsx'
import './Aiche.css'

const Aiche = () => {
  const [block3Ref, block3Visible] = useReveal(0.15)
  const [block4Ref, block4Visible] = useReveal(0.15)

  /* ── Block 3 animations ── */
  const sub3Ref   = useTextScramble('ABOUT AIChE', block3Visible, 0.1)
  const title3Ref = useRevealWords(block3Visible, 0.35)

  /* ── Block 4 animations ── */
  const sub4Ref    = useTextScramble('AIChE RGIPT STUDENT CHAPTER', block4Visible, 0.1)
  const title4aRef = useRevealWords(block4Visible, 0.35)
  const title4bRef = useRevealWords(block4Visible, 0.55)

  return (
    <div className="src-section-ref">

      {/* Block 3 — Text Left, Image Right */}
      <div ref={block3Ref} className={`ref-block block-right-image ${block3Visible ? 'visible' : ''}`}>
        <div className="ref-image-wrapper img-right">
          <img
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop"
            alt="Global tech network"
            className="ref-img"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="ref-text-content">
          <div className="ref-subtitle">
            <span className="ref-line" />
            <span ref={sub3Ref} className="sub-text">ABOUT AIChE</span>
          </div>
          <h2 ref={title3Ref} className="ref-title">
            About AIChE
          </h2>
          <div className="ref-desc">
            <p>
              The American Institute of Chemical Engineers (AIChE) is the world's leading
              organization for chemical engineering professionals and students. With a global
              network, AIChE promotes innovation, knowledge exchange, professional growth, and
              technological advancement through conferences, publications, competitions, and
              leadership opportunities.
            </p>
            <p>
              With over 60,000 members from 110+ countries and a presence in 14 global regions,
              AIChE unites students, researchers, and industry leaders to shape the future of
              chemical engineering across core industries and emerging fields.
            </p>
          </div>

          <div className="ref-stats-row">
            <div className="ref-stat">
              <span className="ref-stat-num"><CountUp value={60000} suffix="+" /></span>
              <span className="ref-stat-label">Members</span>
            </div>
            <div className="ref-stat">
              <span className="ref-stat-num"><CountUp value={110} suffix="+" /></span>
              <span className="ref-stat-label">Countries</span>
            </div>
            <div className="ref-stat">
              <span className="ref-stat-num"><CountUp value={14} /></span>
              <span className="ref-stat-label">Global Regions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Block 4 — Image Left, Text Right */}
      <div ref={block4Ref} className={`ref-block block-left-image ${block4Visible ? 'visible' : ''}`}>
        <div className="ref-image-wrapper img-left">
          <img
            src="/teams.jpg"
            alt="AIChE RGIPT team"
            className="ref-img"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="ref-text-content">
          <div className="ref-subtitle">
            <span className="ref-line" />
            <span ref={sub4Ref} className="sub-text">AIChE RGIPT STUDENT CHAPTER</span>
          </div>
          <h2 ref={title4aRef} className="ref-title">
            AIChE RGIPT STUDENT CHAPTER:
          </h2>
          <h2 ref={title4bRef} className="ref-title">
            From Excellence to Eminence
          </h2>
          <div className="ref-desc">
            <p>
              <em>
                "Having earned the privilege of hosting AIChE India SRC 2026, RGIPT stands ready
                to welcome the nation's brightest minds to a campus synonymous with academic
                excellence, innovation, and leadership in Chemical and Petroleum Engineering."
              </em>
            </p>
            <p>
              Established in 2016, the AIChE RGIPT Student Chapter has grown into one of India's
              most distinguished and dynamic student chapters, building a strong community of
              over <CountUp value={500} suffix="+" /> members over the years. Based at the Rajiv Gandhi Institute of Petroleum
              Technology (RGIPT), an Institute of National Importance renowned for Chemical,
              Petroleum, and Energy Engineering, the chapter has consistently fostered
              innovation, leadership, and professional excellence.
            </p>
            <p>
              Recognized with the prestigious AIChE Outstanding Student Chapter Award for two
              consecutive years, the chapter serves as a proud AIChE Regional Center and has
              maintained a strong international presence through multiple members serving on the
              AIChE Executive Student Committee (ESC). The chapter has also strengthened global
              engagement through collaborations with international student chapters, including
              its former sister chapter, AIChE UI Indonesia.
            </p>
            <p>
              Over the years, AIChE RGIPT has successfully organised numerous technical,
              professional, and outreach initiatives while building strong relationships with
              leading organisations such as IndianOil, GAIL, HPCL, ONGC, MRPL, NRL, Indorama,
              ISRO, and CSIR. Today, with the collective efforts of 200+ dedicated student
              volunteers, the chapter is proudly hosting AIChE India SRC 2026 –{' '}
              <strong>VIPLAV</strong>, striving to deliver one of the most impactful and
              memorable editions of the conference while continuing its tradition of excellence,
              leadership, and innovation.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Aiche
