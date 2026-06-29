import React, { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useReveal } from './useReveal.js'
import './Src.css'

const Src = () => {
  const [card1Ref, card1Visible] = useReveal(0.15);
  const [card2Ref, card2Visible] = useReveal(0.15);

  return (
    <div className="src-section-ref">
      
      {/* Block 1: Text Left, Image Right (Half-Pill Left) */}
      <div ref={card1Ref} className={`ref-block block-right-image ${card1Visible ? 'visible' : ''}`}>
        <div className="ref-text-content">
          <div className="ref-subtitle">
            <span className="ref-line"></span> ABOUT SRC
          </div>
          <h2 className="ref-title">
            Student Regional Conference (SRC)
          </h2>
          <div className="ref-desc">
            <p>The AIChE Student Regional Conference (SRC) is the flagship annual gathering of AIChE student chapters across the India Region. Bringing together hundreds of students, researchers, academicians, and industry professionals, SRC serves as a platform for <strong>technical competitions, research presentations, professional networking, and leadership development</strong>. The conference provides participants with opportunities to showcase their innovations, exchange ideas, and engage with emerging trends shaping the future of chemical engineering and allied industries. Winners of several SRC competitions also earn the opportunity to represent the region at AIChE's global student events.</p>
            <p>In India, SRC has been previously hosted by esteemed institutions such as AIChE-VIT’s SRC, MIT-WPU’s SYNTROPY, NIT Rourkela’s STHITIVARTANA, Ahmedabad University’s ALCHEMY, SVNIT Surat’s SYNERGICON, ICT IOCB’s NAIMISHYA.</p>
            <p><em>"Following a successful bid, AIChE India SRC 2026 will be hosted for the first time at RGIPT, a premier Institute of National Importance recognized for its excellence in Chemical, Petroleum, and Energy Engineering. This milestone reflects the growing prominence of both RGIPT and its award-winning AIChE Student Chapter on the national stage."</em></p>
          </div>
        </div>
        <div className="ref-image-wrapper img-right">
          <img 
            src="https://plus.unsplash.com/premium_photo-1676496046182-356a6a0ed002?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bGFuZHNjYXBlfGVufDB8fDB8fHww" 
            alt="Wind turbines landscape" 
            className="ref-img"
          />
        </div>
      </div>

      {/* Block 2: Image Left (Half-Pill Right), Text Right */}
      <div ref={card2Ref} className={`ref-block block-left-image ${card2Visible ? 'visible' : ''}`}>
        <div className="ref-image-wrapper img-left">
          <img 
            src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=1600&auto=format&fit=crop" 
            alt="Sustainable energy landscape" 
            className="ref-img"
          />
        </div>
        <div className="ref-text-content">
          <div className="ref-subtitle">
            <span className="ref-line"></span> CONFERENCE
          </div>
          <h2 className="ref-title">
            VIPLAV - AIChE India SRC 2026
          </h2>
          <div className="ref-desc">
            <p><em>"Every great advancement begins with a revolution of thought. This year, AIChE India SRC 2026 proudly presents Viplav - a call to transform ideas into impact, challenges into opportunities, and ambition into innovation."</em></p>
            <p><strong>Viplav</strong>, a Sanskrit term signifying transformation, revolution, and progressive change, captures the spirit of AIChE India SRC 2026.</p>
            <p>Hosted by Rajiv Gandhi Institute of Petroleum Technology (RGIPT) - an Institute of National Importance renowned for its excellence in Chemical Engineering, Petroleum Engineering, and Energy studies - this theme reflects the institute's commitment to innovation, academic rigour, and industry-oriented learning.</p>
            <p>SRC 2026 aims to inspire the next generation of engineers while addressing the evolving challenges and opportunities in the chemical, energy, and process industries. More than a conference, <strong>Viplav</strong> is a celebration of transformation, innovation, and the collective vision shaping the future of engineering.</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Src

