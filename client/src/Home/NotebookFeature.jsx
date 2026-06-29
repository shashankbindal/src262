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
            <h1 className="notebook-title">
              Engineering the<br />Decarbonization Revolution
            </h1>
            
            <div className="notebook-details">
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">22nd-23rd August, 2026</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Venue</span>
                <span className="detail-value">Rajiv Gandhi Institute of Petroleum Technology</span>
              </div>
            </div>

            <Link to="/registration" className="notebook-register-btn">
              Register Now
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default NotebookFeature;
