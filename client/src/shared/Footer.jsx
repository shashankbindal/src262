import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const textRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!textRef.current) return;
    const rect = textRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    textRef.current.style.setProperty('--mouse-x', `${x}px`);
    textRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <footer className="footer">
      <div className="footer-card" onMouseMove={handleMouseMove}>
        <div className="dot dot-tl"></div>
        <div className="dot dot-tr"></div>
        <div className="dot dot-bl"></div>
        <div className="dot dot-br"></div>

        <div className="footer-top">
          <div className="footer-left">
            <h2 className="footer-heading">Contacts</h2>
            <div className="footer-left-bottom">
              <a href="mailto:aiche@rgipt.ac.in" className="footer-primary-link">aiche@rgipt.ac.in ↗</a>
              <p className="footer-address">RGIPT, Rae Bareli, India</p>
            </div>
          </div>

          <div className="footer-right">
            <div className="footer-copyright">
              © 2026 VIPLAV
            </div>
            
            <div className="footer-links-container">
              <div className="footer-link-row">
                <Link to="/">Home ↗</Link>
                <Link to="/events">Events ↗</Link>
                <Link to="/register">Registration ↗</Link>
                <Link to="/team">Our Team ↗</Link>
              </div>
              <div className="footer-link-row footer-link-row-legal">
                <Link to="/privacy-policy">Privacy Policy</Link>
                <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="footer-giant-text"
          ref={textRef}
        >
          VIPLAV
        </div>
      </div>
    </footer>
  );
};

export default Footer;