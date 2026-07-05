import React from 'react'
import { useReveal } from './useReveal.js'
import { useTextScramble } from './useTextScramble.js'
import { useRevealWords } from './useRevealWords.js'
import './Src.css'

const Src = () => {
  const [block1Ref, block1Visible] = useReveal(0.15)
  const [block2Ref, block2Visible] = useReveal(0.15)

  /* ── Block 1 animations ── */
  const sub1Ref = useTextScramble('ABOUT SRC', block1Visible, 0.1)
  const title1Ref = useRevealWords(block1Visible, 0.35)

  /* ── Block 2 animations ── */
  const sub2Ref = useTextScramble('CONFERENCE', block2Visible, 0.1)
  const title2Ref = useRevealWords(block2Visible, 0.35)

  return (
    <div className="src-section-ref">

      {/* Block 1 — Text Left, Image Right */}
      <div ref={block1Ref} className={`ref-block block-right-image ${block1Visible ? 'visible' : ''}`}>
        <div className="ref-image-wrapper img-right">
          <img
            src="/about-src.png"
            alt="Student Regional Conference"
            className="ref-img"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="ref-text-content">
          <div className="ref-subtitle">
            <span className="ref-line" />
            <span ref={sub1Ref} className="sub-text">ABOUT SRC</span>
          </div>
          <h2 ref={title1Ref} className="ref-title">
            Student Regional Conference (SRC)
          </h2>
          <div className="ref-desc">
            <p>
              The AIChE Student Regional Conference (SRC) is the flagship annual gathering of
              AIChE student chapters across the India Region. Bringing together hundreds of
              students, researchers, academicians, and industry professionals, SRC serves as a
              platform for <strong>technical competitions, research presentations, professional
                networking, and leadership development</strong>. The conference provides participants
              with opportunities to showcase their innovations, exchange ideas, and engage with
              emerging trends shaping the future of chemical engineering and allied industries.
              Winners of several SRC competitions also earn the opportunity to represent the
              region at AIChE's global student events.
            </p>
            <p>
              In India, SRC has been previously hosted by esteemed institutions such as
              AIChE-VIT's SRC, MIT-WPU's SYNTROPY, Ahmedabad
              University's ALCHEMY, SVNIT Surat's SYNERGICON, NIT Rourkela's STHITIVARTANA, ICT IOCB's NAIMISHYA.
            </p>
            <p>
              <em>
                "Following a successful bid, AIChE India SRC 2026 will be hosted for the first
                time at RGIPT, a premier Institute of National Importance recognized for its
                excellence in Chemical, Petroleum, and Energy Engineering. This milestone reflects
                the growing prominence of both RGIPT and its award-winning AIChE Student Chapter
                on the national stage."
              </em>
            </p>
          </div>
        </div>
      </div>

      {/* Block 2 — Image Left, Text Right */}
      <div ref={block2Ref} className={`ref-block block-left-image ${block2Visible ? 'visible' : ''}`}>
        <div className="ref-image-wrapper img-left">
          <img
            src="/about-viplav.jpeg"
            alt="Sustainable energy landscape"
            className="ref-img"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="ref-text-content">
          <div className="ref-subtitle">
            <span className="ref-line" />
            <span ref={sub2Ref} className="sub-text">CONFERENCE</span>
          </div>
          <h2 ref={title2Ref} className="ref-title">
            VIPLAV - AIChE India SRC 2026
          </h2>
          <div className="ref-desc">
            <p>
              <em>
                "Every great advancement begins with a revolution of thought. This year, AIChE
                India SRC 2026 proudly presents VIPLAV - a call to transform ideas into impact,
                challenges into opportunities, and ambition into innovation."
              </em>
            </p>
            <p>
              <strong>VIPLAV</strong>, a Sanskrit term signifying transformation, revolution,
              and progressive change, captures the spirit of AIChE India SRC 2026.
            </p>
            <p>
              Hosted by Rajiv Gandhi Institute of Petroleum Technology (RGIPT) — an Institute
              of National Importance renowned for its excellence in Chemical Engineering,
              Petroleum Engineering, and Energy studies — this theme reflects the institute's
              commitment to innovation, academic rigour, and industry-oriented learning.
            </p>
            <p>
              SRC 2026 aims to inspire the next generation of engineers while addressing the
              evolving challenges and opportunities in the chemical, energy, and process
              industries. More than a conference, <strong>VIPLAV</strong> is a celebration of
              transformation, innovation, and the collective vision shaping the future of
              engineering.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Src
