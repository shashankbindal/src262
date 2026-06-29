import React from 'react'
import { useReveal } from './useReveal.js'
import './Aiche.css'

const Aiche = () => {
  const [card1Ref, card1Visible] = useReveal(0.15);
  const [card2Ref, card2Visible] = useReveal(0.15);

  return (
    <div className="src-section-ref">
      
      {/* Block 3: Text Left, Image Right (Half-Pill Left) */}
      <div ref={card1Ref} className={`ref-block block-right-image ${card1Visible ? 'visible' : ''}`}>
        <div className="ref-text-content">
          <div className="ref-subtitle">
            <span className="ref-line"></span> ABOUT AIChE
          </div>
          <h2 className="ref-title">
            About AIChE
          </h2>
          <div className="ref-desc">
            <p>The American Institute of Chemical Engineers (AIChE) is the world’s leading organization for chemical engineering professionals and students. With a global network, AIChE promotes innovation, knowledge exchange, professional growth, and technological advancement through conferences, publications, competitions, and leadership opportunities.</p>
            <p>With over 60,000 members from 110+ countries and a presence in 14 global regions, AIChE unites students, researchers, and industry leaders to shape the future of chemical engineering across core industries and emerging fields.</p>
          </div>
        </div>
        <div className="ref-image-wrapper img-right">
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop" 
            alt="Global tech network" 
            className="ref-img"
          />
        </div>
      </div>

      {/* Block 4: Image Left (Half-Pill Right), Text Right */}
      <div ref={card2Ref} className={`ref-block block-left-image ${card2Visible ? 'visible' : ''}`}>
        <div className="ref-image-wrapper img-left">
          <img 
            src="/teams.jpg" 
            alt="AIChE RGIPT team" 
            className="ref-img"
          />
        </div>
        <div className="ref-text-content">
          <div className="ref-subtitle">
            <span className="ref-line"></span> AIChE RGIPT STUDENT CHAPTER
          </div>
          <h2 className="ref-title">
            AIChE RGIPT STUDENT CHAPTER:
          </h2>
          <h2 className="ref-title">
            From Excellence to Eminence
          </h2>
          <div className="ref-desc">
            <p><em>"Having earned the privilege of hosting AIChE India SRC 2026, RGIPT stands ready to welcome the nation's brightest minds to a campus synonymous with academic excellence, innovation, and leadership in Chemical and Petroleum Engineering."</em></p>
            <p>Established in 2016, the AIChE RGIPT Student Chapter has grown into one of India's most distinguished and dynamic student chapters, building a strong community of over 500 members over the years. Based at the Rajiv Gandhi Institute of Petroleum Technology (RGIPT), an Institute of National Importance renowned for Chemical, Petroleum, and Energy Engineering, the chapter has consistently fostered innovation, leadership, and professional excellence.</p>
            <p>Recognized with the prestigious AIChE Outstanding Student Chapter Award for two consecutive years, the chapter serves as a proud AIChE Regional Center and has maintained a strong international presence through multiple members serving on the AIChE Executive Student Committee (ESC). The chapter has also strengthened global engagement through collaborations with international student chapters, including its former sister chapter, AIChE UI Indonesia.</p>
            <p>Over the years, AIChE RGIPT has successfully organised numerous technical, professional, and outreach initiatives while building strong relationships with leading organisations such as IndianOil, GAIL, HPCL, ONGC, MRPL, NRL, Indorama, ISRO, and CSIR. Today, with the collective efforts of 200+ dedicated student volunteers, the chapter is proudly hosting AIChE India SRC 2026 – <strong>Viplav</strong>, striving to deliver one of the most impactful and memorable editions of the conference while continuing its tradition of excellence, leadership, and innovation.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Aiche
