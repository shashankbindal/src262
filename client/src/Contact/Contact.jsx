import React, { useState } from 'react'
import { api } from '../lib/api.js'
import { useReveal } from '../Home/useReveal.js'
import { useStaggerLines } from '../Home/useStaggerLines.js'
import '../Home/animations.css'
import './Contact.css'

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    try {
      await api.post('/contact', form);
      setIsSubmitted(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      alert(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const [headerRef, headerVisible] = useReveal(0.1);
  const textRef = useStaggerLines('p', 0.1);
  const [cardsRef, cardsVisible] = useReveal(0.1);
  const [formRef, formVisible] = useReveal(0.1);
  const [mapRef, mapVisible] = useReveal(0.1);
  const [placesRef, placesVisible] = useReveal(0.1);
  const [place1Ref, place1Visible] = useReveal(0.2);
  const [place2Ref, place2Visible] = useReveal(0.2);

  return (
    <>
      <div className="contact-container">
      <div className="contact-left">
        <h1 ref={headerRef} className={`contact-title reveal-left ${headerVisible ? 'visible' : ''}`}>Contact Us</h1>
        <div ref={textRef}>
          <p className="contact-description">
            We're happy to answer any questions you have or provide you with an estimate. Just send us a message in the form with any question you may have.
          </p>
        </div>

        <div ref={cardsRef} className={`contact-cards reveal-scale ${cardsVisible ? 'visible' : ''}`}>
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
            <h3 className="card-title">Travel & Coordination Queries</h3>
            <h4 className="card-name">Abhimanyu Singh</h4>
            <div className="card-info">
              <div className="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>24ce3002@rgipt.ac.in</span>
              </div>
            </div>
          </div>
          <div className="contact-card">
            <h3 className="card-title">Accommodation Queries</h3>
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

      <div ref={formRef} className={`contact-right reveal-right ${formVisible ? 'visible' : ''}`}>
        <div className="contact-form-container">
          {isSubmitted ? (
            <div className="success-message" style={{ textAlign: 'center', padding: '40px 0' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00a651" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <h3 style={{ fontSize: '1.8rem', color: '#000', marginBottom: '16px', fontWeight: '800' }}>Message Sent!</h3>
              <p style={{ fontSize: '1.1rem', color: '#000', marginBottom: '32px', fontWeight: '600' }}>Thank you for reaching out. We will get back to you shortly.</p>
              <button onClick={() => setIsSubmitted(false)} className="submit-btn">Send Another Message</button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  YOUR NAME
                  <span className="required-badge">Required</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Write your name" 
                  required 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  YOUR E-MAIL (required)
                  <span className="required-badge">Required</span>
                </label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Write your email" 
                  required 
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  YOUR MESSAGE
                </label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Write your message" 
                  required
                  value={form.message}
                  onChange={(e) => setForm({...form, message: e.target.value})}
                ></textarea>
              </div>

              <button type="submit" className="submit-btn" disabled={loading} data-magnetic>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
      
    <div ref={mapRef} className={`how-to-reach-section reveal-scale ${mapVisible ? 'visible' : ''}`}>
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
      
      <div ref={placesRef} className={`places-to-visit-section reveal-scale ${placesVisible ? 'visible' : ''}`}>
        <div className="places-header">
          <div className="places-line"></div>
          <h2 className="places-title">PLACES TO VISIT</h2>
          <div className="places-line"></div>
        </div>
        
        <div className="places-timeline">
          <div className="timeline-center-line"></div>
          
          {/* Ayodhya (Right Side) */}
          <div ref={place1Ref} className={`timeline-item right ${place1Visible ? 'in-view' : ''}`}>
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-text">
                <h3>Ayodhya</h3>
                <p>Experience the spiritual heart of India. Visit the grand Ram Mandir and stroll along the serene Sarayu river ghats.</p>
              </div>
              <div className="timeline-images">
                <div className="place-img" style={{ backgroundImage: "url('/ayodhya-1.jpg')" }}></div>
                <div className="place-img offset" style={{ backgroundImage: "url('/ayodhya-2.jpg')" }}></div>
              </div>
            </div>
          </div>

          {/* Banaras (Left Side) */}
          <div ref={place2Ref} className={`timeline-item left ${place2Visible ? 'in-view' : ''}`}>
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-text">
                <h3>Banaras (Varanasi)</h3>
                <p>Discover the eternal city of lights. Witness the mesmerizing Ganga Aarti and experience profound spirituality.</p>
              </div>
              <div className="timeline-images">
                <div className="place-img" style={{ backgroundImage: "url('/varanasi-1.jpeg')" }}></div>
                <div className="place-img offset" style={{ backgroundImage: "url('/varanasi-2.jpg')" }}></div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
    </>
  )
}

export default Contact
