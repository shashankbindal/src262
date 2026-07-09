import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';
import StaggerText from './StaggerText';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Registration', href: '/register' },
  // { label: 'Accommodation', href: '/accommodation' },
  { label: 'Sponsors', href: '/sponsors' },
  { label: 'Team', href: '/team' },
  { label: 'Contact', href: '/contact' },
];

const NavItem = ({ item, onClose }) => (
  <li className="nav-item">
    <Link
      to={item.href}
      className="nav-link block-link"
      onClick={onClose}
    >
      <StaggerText text={item.label} hoverColor="var(--primary)" />
    </Link>
  </li>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const iconRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        iconRef.current &&
        !menuRef.current.contains(e.target) &&
        !iconRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutsideUser = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutsideUser);
    return () => document.removeEventListener('click', handleClickOutsideUser);
  }, [userMenuOpen]);

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a
            href="https://www.rgipt.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-brand navbar-logo-anchor"
            title="RGIPT"
          >
            <img src="/rgipt.png" alt="RGIPT Logo" className="navbar-logo-img rgipt-logo" fetchpriority="high" />
          </a>

          <ul className="nav-menu">
            {NAV_ITEMS.map(item => (
              <NavItem key={item.href} item={item} onClose={closeMenu} />
            ))}
          </ul>

          <div className="nav-brand nav-brand-right">
            <a
              href="https://www.aiche.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-logo-anchor"
              title="AIChE"
            >
              <img src="/aiche.png" alt="AIChE Logo" className="navbar-logo-img aiche-text-logo" fetchpriority="high" />
            </a>
            <a
              href="https://www.aichergipt.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-logo-anchor"
              title="AIChE RGIPT Chapter"
            >
              <img src="https://res.cloudinary.com/cnocxcvz/image/upload/v1783560040/site/aoelmtrp4vz1nxexd9wl.png" alt="AIChE RGIPT Logo" className="navbar-logo-img aiche-round-logo" fetchpriority="high" />
            </a>
            <div className="user-dropdown-container" ref={userMenuRef}>
              <button 
                className="navbar-user-btn" 
                aria-label="User Menu"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  {user ? (
                    <>
                      <Link to="/profile" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>My Profile</Link>
                      <Link to="/dashboard" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>My Registrations</Link>
                      <button className="user-dropdown-item sign-out-btn" onClick={async () => { await logout(); setUserMenuOpen(false); window.location.href = '/'; }}>Sign Out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Log In</Link>
                      <Link to="/register" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Register</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            ref={iconRef}
            className={`mobile-menu-icon ${mobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div ref={menuRef} className={`mobile-nav-overlay ${mobileMenuOpen ? 'active' : ''}`}>
        <ul className="mobile-nav-menu">
          {NAV_ITEMS.map(item => (
            <NavItem key={`mobile-${item.href}`} item={item} onClose={closeMenu} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default Navbar;