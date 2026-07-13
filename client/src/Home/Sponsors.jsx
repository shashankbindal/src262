import React, { useRef, useState, useEffect } from 'react'
import { useReveal } from './useReveal.js'
import './Sponsors.css'

const sponsorsData = [
  { name: 'GAIL', url: '/gail.png' },
  { name: 'HP', url: '/hp.png' },
  { name: 'IndianOil', url: '/indianoil.png' },
  { name: 'ONGC', url: '/mrpl.png' },
  { name: 'Indorama', url: '/indorama.png' },
  { name: 'ISRO', url: '/isro.png' },
  { name: 'CSIR', url: '/csir.png' },
  { name: 'SBI', url: '/sbi.png' },
  { name: 'NRL', url: 'https://res.cloudinary.com/cnocxcvz/image/upload/v1783560062/site/gnic3xatmeoahcxzl9ps.jpg' },
  { name: 'SERB INDIA', url: '/inserb.png' },
  { name: 'PNB', url: '/pnb.png' },
  { name: 'Burger Singh', url: '/burger.png' }
];

const Sponsors = () => {
  const [ref, isVisible] = useReveal(0.1);
  const sliderRef = useRef(null);
  
  // Dragging state
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScroll);
      checkScroll();
      window.addEventListener('resize', checkScroll);
      
      // Delay check slightly to let content render/load
      const timer = setTimeout(checkScroll, 100);
      return () => {
        slider.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, []);

  // Auto scroll effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        const cardWidth = window.innerWidth <= 480 ? 98 : window.innerWidth <= 768 ? 112 : 136;
        
        // If we are at the end, smoothly scroll back to start
        if (scrollLeft >= scrollWidth - clientWidth - 10) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3000); // Scroll every 3 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleMouseDown = (e) => {
    isDown.current = true;
    sliderRef.current.classList.add('grabbing');
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftState.current = sliderRef.current.scrollLeft;
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    sliderRef.current.classList.remove('grabbing');
    setIsPaused(false);
  };

  const handleMouseUp = () => {
    isDown.current = false;
    sliderRef.current.classList.remove('grabbing');
    setIsPaused(false);
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Drag sensitivity
    sliderRef.current.scrollLeft = scrollLeftState.current - walk;
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const cardWidth = window.innerWidth <= 480 ? 98 : window.innerWidth <= 768 ? 112 : 136;
      const offset = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      sliderRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className={`premium-sponsors-section reveal ${isVisible ? 'visible' : ''}`} ref={ref}>
      <div className="sponsors-header">
        <span className="sponsors-subtitle">Trusted by Industry Leaders</span>
        <h2 className="sponsors-title">Our Past Partners</h2>
        <div className="sponsors-divider"></div>
      </div>

      <div 
        className="sponsors-slider-outer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {showLeftArrow && (
          <button className="slider-arrow left" onClick={() => scrollSlider('left')} aria-label="Scroll left">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <div className="sponsors-marquee-wrapper">
          <div 
            ref={sliderRef}
            className="sponsors-slider-container"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {sponsorsData.map((item, index) => (
              <div key={index} className="premium-sponsor-card">
                <div className="sponsor-card-inner">
                  <img src={item.url} alt={item.name} className="premium-sponsor-logo" loading="lazy" decoding="async" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {showRightArrow && (
          <button className="slider-arrow right" onClick={() => scrollSlider('right')} aria-label="Scroll right">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

export default Sponsors
