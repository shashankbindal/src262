import React, { useState } from 'react'
import './Contact.css'

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  return (
    <>
      <div className="contact-container">
      <div className="contact-left">
        <h1 className="contact-title">Contact Us</h1>
        <p className="contact-description">
          We're happy to answer any questions you have or provide you with an estimate. Just send us a message in the form with any question you may have.
        </p>

        <div className="contact-cards">
          <div className="contact-card">
            <h3 className="card-title">General Queries</h3>
            <h4 className="card-name">Shubhendra Singh</h4>
            <div className="card-info">
              <div className="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>24re3011@rgipt.ac.in</span>
              </div>
            </div>
          </div>

          <div className="contact-card">
            <h3 className="card-title">Accommodation Queries</h3>
            <h4 className="card-name">Abhimanyu Singh</h4>
            <div className="card-info">
              <div className="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>24ce3002@rgipt.ac.in</span>
              </div>
            </div>
          </div>
          <div className="contact-card">
            <h3 className="card-title">Travel & Coordination Queries</h3>
            <h4 className="card-name">Sharad Shukla</h4>
            <div className="card-info">
              <div className="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>24ce3067@rgipt.ac.in</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-right">
        <div className="contact-form-container">
          {isSubmitted ? (
            <div className="success-message" style={{ textAlign: 'center', padding: '40px 0' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Message Sent!</h3>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>Thank you for reaching out. We will get back to you shortly.</p>
              <button onClick={() => setIsSubmitted(false)} className="submit-btn">Send Another Message</button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }}>
              <div className="form-group">
                <label className="form-label">
                  YOUR NAME
                  <span className="required-badge">Required</span>
                </label>
                <input type="text" className="form-input" placeholder="Write your name" required />
              </div>

              <div className="form-group">
                <label className="form-label">
                  YOUR E-MAIL (required)
                  <span className="required-badge">Required</span>
                </label>
                <input type="email" className="form-input" placeholder="Write your email" required />
              </div>

              <div className="form-group">
                <label className="form-label">
                  YOUR MESSAGE
                </label>
                <textarea className="form-textarea" placeholder="Write your message"></textarea>
              </div>

              <button type="submit" className="submit-btn">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </div>
      
    <div className="how-to-reach-section">
        <h2 className="how-to-reach-title">How to Reach</h2>
        <div className="map-container">
          <iframe
            src="https://maps.google.com/maps?q=Rajiv%20Gandhi%20Institute%20of%20Petroleum%20Technology,%20Jais&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="RGIPT Map Location"
          ></iframe>
        </div>
      </div>
      
    </>
  )
}

export default Contact
