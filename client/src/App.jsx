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

const PageTransition = ({ children }) => {
  return (
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
};

const AppContent = () => {
  const location = useLocation();
  const hideNavFooter = location.pathname.startsWith('/team-profile');

  React.useEffect(() => {
    // 1. Mouse move tracker for card hover spotlight gradients ( O(1) hover tracking )
    const handleMouseMove = (e) => {
      const card = e.target.closest(
        '.rm-event-block, .carousel-card, .info-card, .aiche-card, .competition-card-container, .contact-card, .sponsor-card, .contact-form-container, .rm-postit, .member-image-placeholder'
      );
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    // 2. Scroll progress tracker
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
          progressBar.style.width = `${progress}%`;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
            <Route path="/" element={<PageTransition><Main /></PageTransition>} />
            <Route path="/events" element={<PageTransition><Event /></PageTransition>} />
            <Route path="/team" element={<PageTransition><Team /></PageTransition>} />
            {/* <Route path="/accommodation" element={<PageTransition><Accommodation /></PageTransition>} /> */}
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Registration /></PageTransition>} />
            <Route path="/sponsors" element={<PageTransition><Sponsor /></PageTransition>} />
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