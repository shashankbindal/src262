import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Src.css'

gsap.registerPlugin(ScrollTrigger)

const Src = () => {
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
    <div className="src-section">
      <div className="pin-container" ref={containerRef}>
        <div className="info-cards-wrapper">
        <div className="info-card card-1" ref={card1Ref}>
          <div className="info-card-content">
            <h2 className="info-card-title">
              About <span className="target-src-placeholder">SRC</span>
            </h2>
            <div className="info-card-text">
              <p>The AIChE Student Regional Conference (SRC) is the flagship annual gathering of AIChE student chapters across the India Region. Bringing together hundreds of students, researchers, academicians, and industry professionals, SRC serves as a platform for technical competitions, research presentations, professional networking, and leadership development. The conference provides participants with opportunities to showcase their innovations, exchange ideas, and engage with emerging trends shaping the future of chemical engineering and allied industries. Winners of several SRC competitions also earn the opportunity to represent the region at AIChE's global student events.</p>
              <p>In India, SRC has been previously hosted by esteemed institutions such as AIChE-VIT, MIT-WPU (SYNTROPY), NIT Rourkela (2020, 2024), Ahmedabad University (2021), VIT (2022), and SVNIT (2023) , ICT IOCB (2025).</p>
              <p>Following a successful bid, AIChE India SRC 2026 will be hosted for the first time at RGIPT, a premier Institute of National Importance recognized for its excellence in Chemical, Petroleum, and Energy Engineering. This milestone reflects the growing prominence of both RGIPT and its award-winning AIChE Student Chapter on the national stage.</p>
            </div>
          </div>
        </div>

        <div className="info-card card-2" ref={card2Ref}>
          <div className="info-card-content">
            <h2 className="info-card-title">
              About VIPLAV
            </h2>
            <div className="info-card-text">
              <p>"Every great advancement begins with a revolution of thought. This year, AIChE India SRC 2026 proudly presents VIPLAV—a call to transform ideas into impact, challenges into opportunities, and ambition into innovation."</p>
              <p>VIPLAV, a Sanskrit term signifying transformation, revolution, and progressive change, captures the spirit of AIChE India SRC 2026. Hosted by Rajiv Gandhi Institute of Petroleum Technology (RGIPT)—an Institute of National Importance renowned for its excellence in Chemical Engineering, Petroleum Engineering, and Energy studies—this theme reflects the institute's commitment to innovation, academic rigour, and industry-oriented learning.</p>
              <p>SRC 2026 aims to inspire the next generation of engineers while addressing the evolving challenges and opportunities in the chemical, energy, and process industries. More than a conference, VIPLAV is a celebration of transformation, innovation, and the collective vision shaping the future of engineering.</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Src
