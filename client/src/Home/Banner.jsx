import React from 'react'
import { useNavigate } from 'react-router-dom'
import StaggerText from '../shared/StaggerText'
import './Banner.css'

const Banner = () => {
  const navigate = useNavigate();

  const handleRegisterClick = (e) => {
    e.preventDefault();
    const btn = e.currentTarget;
    btn.classList.add('clicked');
    setTimeout(() => {
      navigate('/register');
    }, 400);
  };

  return (
    <div className="hero-section">
      <div className="hero-bg-image"></div>
      <div className="hero-content">
        <div className="hero-title-wrapper">
          <h1 className="hero-title">
            <span className="hero-title-main">VIPLAV</span>
            <span className="hero-title-accent">'26</span>
          </h1>
          <h2 className="hero-title-subheading">Student Regional Conference</h2>
          <p className="hero-description">
            <span className="theme-title">Engineering the Decarbonization Revolution</span><br/>
            This theme represents a revolution, bold, transformative, and driven by innovation. It reflects the crucial role of engineering in accelerating the transition toward a sustainable, low-carbon future.
          </p>
        </div>

        <div className="hero-footer">
          <div className="hero-metadata">
            <div className="hero-meta-item">
              <span className="hero-meta-label">Date</span>
              <span className="hero-meta-value">21st-23rd August 2026</span>
            </div>
            
            <div className="hero-meta-divider"></div>
            
            <div className="hero-meta-item">
              <span className="hero-meta-label">Venue</span>
              <span className="hero-meta-value">Rajiv Gandhi Institute of Petroleum Technology</span>
            </div>
          </div>
          
          <button className="register-btn hero-cta-btn" onClick={handleRegisterClick}>
            <StaggerText text="Register&nbsp;&#8594;" hoverColor="#ffffff" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Banner
