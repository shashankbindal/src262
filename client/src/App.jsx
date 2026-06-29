import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./shared/Navbar.jsx";
import Footer from "./shared/Footer.jsx";
import Main from "./Home/Main.jsx";
import Event from "./Events/page/Event.jsx";
import Team from "./Team/page/Team.jsx";
import Accommodation from "./Accommodation/Accommodation.jsx";
import Contact from "./Contact/Contact.jsx";
import Registration from "./Registration/Registration.jsx";
import Sponsor from "./Sponsors/Sponsor.jsx";
import SmoothScroller from "./shared/SmoothScroller.jsx";
import TeamProfile from "./TeamProfile/TeamProfile.jsx";
import ScrollToTop from "./shared/ScrollToTop.jsx";

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: 100, rotateX: 45 }}
    animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
    exit={{ opacity: 0, scale: 1.2, y: -100, rotateX: -45, filter: "blur(20px)" }}
    transition={{ type: "spring", stiffness: 100, damping: 15, duration: 1 }}
    style={{ transformOrigin: "center center" }}
  >
    {children}
  </motion.div>
);

const AppContent = () => {
  const location = useLocation();
  const hideNavFooter = location.pathname.startsWith('/team-profile');

  React.useEffect(() => {
    /* 1 ─ Mouse-spotlight tracker for cards that use --mouse-x/y */
    const SPOTLIGHT_SELECTOR = [
      '.rm-event-block', '.carousel-card', '.info-card', '.aiche-card',
      '.competition-card-container', '.contact-card', '.sponsor-card',
      '.contact-form-container', '.rm-postit', '.member-image-placeholder',
      '.team-card',
    ].join(', ')

    const handleMouseMove = (e) => {
      /* Spotlight for tracked cards */
      const card = e.target.closest(SPOTLIGHT_SELECTOR)
      if (card) {
        const rect = card.getBoundingClientRect()
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
      }

      /* Magnetic effect for [data-magnetic] elements */
      const magEl = e.target.closest('[data-magnetic]')
      if (magEl) {
        const r  = magEl.getBoundingClientRect()
        const cx = r.left + r.width  / 2
        const cy = r.top  + r.height / 2
        const dx = (e.clientX - cx) * 0.35
        const dy = (e.clientY - cy) * 0.35
        magEl.style.transform = `translate(${dx}px, ${dy}px)`
      }
    }

    const handleMouseLeave = (e) => {
      const magEl = e.target.closest('[data-magnetic]')
      if (magEl) {
        magEl.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)'
        magEl.style.transform  = ''
        /* Clear inline transition after it completes so hover-CSS transitions still work */
        setTimeout(() => { magEl && (magEl.style.transition = '') }, 600)
      }
    }

    /* 2 ─ Scroll progress bar */
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total > 0) {
        const pct = (window.scrollY / total) * 100
        const bar = document.querySelector('.scroll-progress')
        if (bar) bar.style.width = `${pct}%`
      }
    }

    window.addEventListener('mousemove',  handleMouseMove,  { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave, true)
    window.addEventListener('scroll',     handleScroll,     { passive: true })

    return () => {
      window.removeEventListener('mousemove',  handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave, true)
      window.removeEventListener('scroll',     handleScroll)
    }
  }, [])

  return (
    <SmoothScroller>
      <div className="scroll-progress" />
      <div className="bg-glow-orb orb-1" />
      <div className="bg-glow-orb orb-2" />
      <div className="bg-glow-orb orb-3" />
      <ScrollToTop />
      {!hideNavFooter && <Navbar />}
      <main style={{ flex: 1, overflowX: "hidden", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"              element={<PageTransition><Main /></PageTransition>} />
            <Route path="/events"        element={<PageTransition><Event /></PageTransition>} />
            <Route path="/team"          element={<PageTransition><Team /></PageTransition>} />
            <Route path="/contact"       element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/register"      element={<PageTransition><Registration /></PageTransition>} />
            <Route path="/sponsors"      element={<PageTransition><Sponsor /></PageTransition>} />
            <Route path="/team-profile/:teamId" element={<PageTransition><TeamProfile /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideNavFooter && <Footer />}
    </SmoothScroller>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
