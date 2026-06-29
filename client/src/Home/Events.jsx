import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useReveal } from './useReveal.js'
import './Events.css'

const eventData = [
  { id: 1, title: "Chem-E-Jeopardy", desc: "Chemical Engineering Trivia", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5jUsij8b-x-PBqn3yMZbAYUwfyACiF3GPAw&s" },
  { id: 2, title: "Chem-E-Car", desc: "Chemical Energy Vehicles", img: "https://www.aiche.org/sites/default/files/images/conference/event/23370477461_f16f1dd228_z.jpg" },
  { id: 3, title: "Poster Presentation", desc: "Research & Technical Projects", img: "https://images.unsplash.com/photo-1515603403036-f3d35f75ca52?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: 4, title: "Paper Presentation", desc: "Emerging Trends & Analysis", img: "https://images.unsplash.com/photo-1771344488060-f6b32a503b34?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: 5, title: "K-12 STEM", desc: "Inspiring the Next Generation", img: "https://learningliftoff.com/wp-content/uploads/2023/01/pexels-artem-podrez-6941450-1536x864.jpg.webp" }
]

const TX_MAP = [0, 105, 190] // Percentages of width
const SCALE_MAP = [1, 0.8, 0.6]
const OPACITY_MAP = [1, 0.7, 0.4]

const getCardStyle = (offset) => {
  const abs = Math.abs(offset)
  const sign = Math.sign(offset)

  if (abs > 2) {
    return { opacity: 0, pointerEvents: 'none', transform: `translateX(${sign * 260}%) scale(0.4)`, zIndex: 1 }
  }

  return {
    transform: `translateX(${sign * TX_MAP[abs]}%) scale(${SCALE_MAP[abs]})`,
    zIndex: 10 - abs,
    opacity: OPACITY_MAP[abs],
    pointerEvents: 'auto',
  }
}

const Events = () => {
  const [ref, isVisible] = useReveal(0.1)
  const [activeIndex, setActiveIndex] = useState(2)



  useEffect(() => {
    if (!isVisible) return; // Pause auto-play when off-screen to save CPU/GPU overhead
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % eventData.length)
    }, 4000) // Change card every 4 seconds
    return () => clearInterval(timer)
  }, [isVisible])

  return (
    <div className="fan-section" ref={ref}>
      <div className={`fan-header ${isVisible ? 'visible' : ''}`}>
        <div className="fan-header-left">
          <h2 className="fan-title">
            Featured Events
          </h2>
        </div>
        <div className="fan-header-right" style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
          <Link to="/events" className="fan-explore-btn">View All Events</Link>
        </div>
      </div>

      <div className={`fan-stage ${isVisible ? 'visible' : ''}`}>
        <div className="fan-corner fan-corner--tl" />
        <div className="fan-corner fan-corner--tr" />
        <div className="fan-corner fan-corner--bl" />
        <div className="fan-corner fan-corner--br" />

        <div className="fan-label">
          <h3 className="fan-label-title">{eventData[activeIndex].title}</h3>
          <p className="fan-label-sub">{eventData[activeIndex].desc}</p>
        </div>

        <div className="fan-track">
          {eventData.map((event, index) => {
            let offset = index - activeIndex
            if (offset < -2) offset += eventData.length
            if (offset > 2) offset -= eventData.length
            const isCenter = offset === 0

            return (
              <div
                key={event.id}
                className={`fan-card${isCenter ? ' fan-card--active' : ''}`}
                style={getCardStyle(offset)}
                onClick={() => { if (!isCenter) setActiveIndex(index) }}
              >
                <img src={event.img} alt={event.title} className="fan-card-img" loading="lazy" decoding="async" />
                <div className="fan-card-overlay" />
              </div>
            )
          })}
        </div>


      </div>
    </div>
  )
}

export default Events
