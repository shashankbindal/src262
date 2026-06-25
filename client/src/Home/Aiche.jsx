import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Aiche.css'

gsap.registerPlugin(ScrollTrigger)

const Aiche = () => {
  const containerRef = useRef(null)
  const card1Ref = useRef(null)
  const card2Ref = useRef(null)

  useEffect(() => {
    let ctx = gsap.context(() => {
      
      gsap.set(card2Ref.current, { x: "100vw", opacity: 0.5 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "center center",
          end: "+=200%", 
          pin: true,
          scrub: true,
          fastScrollEnd: true,
          preventOverlaps: true,
        }
      })

      tl.to(card1Ref.current, {
        scale: 0.9,
        xPercent: -5,
        opacity: 0.5,
        duration: 1
      }, 0)

      tl.to(card2Ref.current, {
        x: "0vw",
        opacity: 1,
        duration: 1,
        ease: "power2.out"
      }, 0)

    }, containerRef)

    const timeout = setTimeout(() => ScrollTrigger.refresh(), 500)
    document.fonts.ready.then(() => ScrollTrigger.refresh())

    return () => {
      clearTimeout(timeout)
      ctx.revert()
    }
  }, [])

  return (
    <div className="aiche-section">
      <div className="pin-container" ref={containerRef}>
        <div className="aiche-cards-wrapper">
        <div className="aiche-card card-1" ref={card1Ref}>
          <div className="aiche-card-content">
            <h2 className="aiche-card-title">
              About AIChE
            </h2>
            <div className="aiche-card-text">
              <p>The American Institute of Chemical Engineers (AIChE) is the world’s leading organization for chemical engineering professionals and students. With a global network , AIChE promotes innovation, knowledge exchange, professional growth, and technological advancement through conferences, publications, competitions, and leadership opportunities.</p>
              <p>With over 60,000 members from 110+ countries and a presence in 14 global regions, AIChE unites students, researchers, and industry leaders to shape the future of chemical engineering across core industries and emerging fields .</p>
            </div>
          </div>
        </div>

        <div className="aiche-card card-2" ref={card2Ref}>
          <div className="aiche-card-content">
            <h2 className="aiche-card-title">
              AIChE RGIPT STUDENT CHAPTER : From Excellence to Eminence
            </h2>
            <div className="aiche-card-text">
              <p>"Having earned the privilege of hosting AIChE India SRC 2026, RGIPT stands ready to welcome the nation's brightest minds to a campus synonymous with academic excellence, innovation, and leadership in Chemical and Petroleum Engineering."</p>
              <p>Established in 2016, the AIChE RGIPT Student Chapter has grown into one of India's most distinguished and dynamic student chapters, building a strong community of over 500 members over the years. Based at the Rajiv Gandhi Institute of Petroleum Technology (RGIPT), an Institute of National Importance renowned for Chemical, Petroleum, and Energy Engineering, the chapter has consistently fostered innovation, leadership, and professional excellence.</p>
              <p>Recognized with the prestigious AIChE Outstanding Student Chapter Award for two consecutive years, the chapter serves as a proud AIChE Regional Center and has maintained a strong international presence through multiple members serving on the AIChE Executive Student Committee (ESC). The chapter has also strengthened global engagement through collaborations with international student chapters, including its former sister chapter, AIChE UI Indonesia.</p>
              <p>Over the years, AIChE RGIPT has successfully organised numerous technical, professional, and outreach initiatives while building strong relationships with leading organisations such as IndianOil, GAIL, HPCL, ONGC, MRPL, NRL, Indorama, ISRO, and CSIR. Today, with the collective efforts of 200+ dedicated student volunteers, the chapter is proudly hosting AIChE India SRC 2026 – Viplav, striving to deliver one of the most impactful and memorable editions of the conference while continuing its tradition of excellence, leadership, and innovation.</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Aiche
