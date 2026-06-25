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

  return (
    <SmoothScroller>
      <ScrollToTop />
      {!hideNavFooter && <Navbar />}
      <main style={{ flex: 1, overflowX: "hidden" }}>
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