import React from 'react'
import Banner from './Banner.jsx'
import Src from './Src.jsx'
import Events from './Events.jsx'
import Aiche from './Aiche.jsx'
import Sponsors from './Sponsors.jsx'
import Teams from './Teams.jsx'
import Faq from './Faq.jsx'
import { useReveal } from './useReveal.js'
import './Main.css'
import './animations.css'

const Main = () => {
  const [beigeRef, beigeVisible] = useReveal(0.1);
  const [headingRef, headingVisible] = useReveal(0.2);
  const [orangeRef, orangeVisible] = useReveal(0.1);
  const [toolkitRef, toolkitVisible] = useReveal(0.15);

  return (
    <div className="rm-container">
      {/* Top Green Hero Section */}
      <div className="rm-green-section">
        <div className="rm-title-wrapper">
          <h1 className="rm-title-main">VIPLAV '26</h1>
          <h2 className="rm-title-sub">STUDENT REGIONAL CONFERENCE</h2>
          <p className="rm-title-desc">Make the most of AIChE SRC 2026 at RGIPT</p>
          <div className="rm-title-pill">Register Now</div>
        </div>

        {/* Notebook Container */}
        <div className="rm-notebook">
          <div className="rm-notebook-rings">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="rm-ring"></div>
            ))}
          </div>
          
          <div className="rm-notebook-inner">
            <Banner />
            
            <div 
              ref={toolkitRef} 
              className={`rm-toolkit-wrapper reveal-scale ${toolkitVisible ? 'visible' : ''}`}
            >
              <Events />
              <Sponsors />
            </div>
          </div>
        </div>
      </div>

      <div ref={beigeRef} className="rm-beige-section">
        <h2 
          ref={headingRef} 
          className={`rm-section-heading reveal-left ${headingVisible ? 'visible' : ''}`}
        >
          About the Organizers
        </h2>
        <div className={`rm-beige-content ${beigeVisible ? 'beige-animate' : ''}`}>
          <Src />
          <Aiche />
        </div>
      </div>

      <div ref={orangeRef} className={`rm-orange-section ${orangeVisible ? 'orange-animate' : ''}`}>
        <Teams />
        <Faq />
      </div>
    </div>
  )
}

export default Main
