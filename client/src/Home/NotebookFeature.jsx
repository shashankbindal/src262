import React from 'react';
import { Link } from 'react-router-dom';
import './NotebookFeature.css';

const NotebookFeature = () => {
  return (
    <div className="notebook-feature-wrapper">
      <div className="notebook-container">
        
        {/* Spiral Binding at the top */}
        <div className="spirals-container">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="spiral-unit">
              <div className="spiral-ring"></div>
              <div className="spiral-hole"></div>
            </div>
          ))}
        </div>
        
        {/* Notebook Content */}
        <div className="notebook-content">
          <div className="notebook-inner-content">
            <div className="notebook-header">
              <h1 className="notebook-title">
                AIChE Student Regional Conference
              </h1>
            </div>
            
            <div className="notebook-details">
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">21st-23rd August, 2026</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Venue</span>
                <span className="detail-value">Rajiv Gandhi Institute of Petroleum Technology</span>
              </div>
            </div>
            <div className="notebook-actions">
              <Link to="/register" className="notebook-register-btn" data-magnetic>
                Register Now
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
              
              <a href="https://www.aichergipt.com/" target="_blank" rel="noopener noreferrer" className="notebook-explore-btn" data-magnetic>
                Explore AIChE RGIPT
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10" /></svg>
              </a>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default NotebookFeature;
