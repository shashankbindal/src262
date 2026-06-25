import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const iconRef = useRef(null);

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

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);

  return (
    <>
      <div className={`nav-side-logo rgipt-side-logo ${scrolled ? 'scrolled' : ''}`}>
        <img src="/rgipt.png" alt="RGIPT Logo" className="navbar-logo-img" fetchpriority="high" />
      </div>
      <div className={`nav-side-logo aiche-side-logo ${scrolled ? 'scrolled' : ''}`}>
        <img src="/aiche.png" alt="AIChE Logo" className="navbar-logo-img" fetchpriority="high" />
        <img src="/aiche-rgipt.jpeg" alt="AIChE RGIPT Logo" className="navbar-logo-img aiche-round-logo" fetchpriority="high" />
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <ul className="nav-menu">
            {NAV_ITEMS.map(item => (
              <NavItem key={item.href} item={item} onClose={closeMenu} />
            ))}
          </ul>

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