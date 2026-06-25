import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useReveal } from '../Home/useReveal.js'
import '../Home/animations.css'
import './Registration.css'

const Registration = () => {
  const navigate = useNavigate();
  const [ref, isVisible] = useReveal(0.1);

  return (
    <div className="reg-simple-container">
      <div ref={ref} className={`reg-content-wrapper reveal-scale ${isVisible ? 'visible' : ''}`}>
        <h1 className="reg-simple-title">Registration Not Yet Started</h1>
        <p className="reg-simple-desc">Event registration has not started yet. Please check back later.</p>
        
        <button className="reg-simple-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default Registration
