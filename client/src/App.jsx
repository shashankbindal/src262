import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";

/* Layout */
import Navbar from "./shared/Navbar.jsx";
import Footer from "./shared/Footer.jsx";
import SmoothScroller from "./shared/SmoothScroller.jsx";
import ScrollToTop from "./shared/ScrollToTop.jsx";

/* Auth */
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

/* Public pages */
import Main from "./Home/Main.jsx";
import Event from "./Events/page/Event.jsx";
import Team from "./Team/page/Team.jsx";
import Accommodation from "./Accommodation/Accommodation.jsx";
import Contact from "./Contact/Contact.jsx";
import Registration from "./Registration/Registration.jsx";
import Sponsor from "./Sponsors/Sponsor.jsx";

/* Auth pages */
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import ForgotPassword from "./auth/ForgotPassword.jsx";
import ResetPassword from "./auth/ResetPassword.jsx";
import VerifyEmail from "./auth/VerifyEmail.jsx";

/* Dashboard & Admin */
import Dashboard from "./dashboard/Dashboard.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import ConferenceRegistration from "./ConferenceRegistration/ConferenceRegistration.jsx";

/* ── Page transition wrapper ── */
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

/* ── Effect hooks that need router context ── */
const AppContent = () => {
  const location = useLocation();

  /* Pages that hide navbar/footer */
  const hideNavFooter =
    location.pathname.startsWith("/team-profile");

  React.useEffect(() => {
    /* Spotlight tracker for cards that use --mouse-x/y */
    const SPOTLIGHT_SELECTOR = [
      ".rm-event-block", ".carousel-card", ".info-card", ".aiche-card",
      ".competition-card-container", ".contact-card", ".sponsor-card",
      ".contact-form-container", ".rm-postit", ".member-image-placeholder",
      ".team-card",
    ].join(", ");

    let mouseFrame;
    const handleMouseMove = (e) => {
      if (mouseFrame) cancelAnimationFrame(mouseFrame);
      mouseFrame = requestAnimationFrame(() => {
        const card = e.target.closest(SPOTLIGHT_SELECTOR);
        if (card) {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        }
        const magEl = e.target.closest("[data-magnetic]");
        if (magEl) {
          const r = magEl.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) * 0.35;
          const dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
          magEl.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      });
    };

    const handleMouseLeave = (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return;
      const magEl = e.target.closest("[data-magnetic]");
      if (magEl) {
        magEl.style.transition = "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)";
        magEl.style.transform = "";
        setTimeout(() => { if (magEl) magEl.style.transition = ""; }, 600);
      }
    };

    let scrollFrame;
    const handleScroll = () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0) {
          const bar = document.querySelector(".scroll-progress");
          if (bar) bar.style.transform = `scaleX(${window.scrollY / total})`;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, true);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave, true);
      window.removeEventListener("scroll", handleScroll);
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
            {/* ── Public ── */}
            <Route path="/"        element={<PageTransition><Main /></PageTransition>} />
            <Route path="/events"  element={<PageTransition><Event /></PageTransition>} />
            <Route path="/team"    element={<PageTransition><Team /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/sponsors" element={<PageTransition><Sponsor /></PageTransition>} />

            {/* ── Registration (auth-gated internally) ── */}
            <Route path="/register" element={<PageTransition><Registration /></PageTransition>} />

            {/* ── Auth ── */}
            <Route path="/login"           element={<PageTransition><Login /></PageTransition>} />
            <Route path="/signup"          element={<PageTransition><Register /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
            <Route path="/reset-password"  element={<PageTransition><ResetPassword /></PageTransition>} />
            <Route path="/verify-email"    element={<PageTransition><VerifyEmail /></PageTransition>} />

            {/* ── Protected: User ── */}
            <Route
              path="/conference-registration"
              element={
                <ProtectedRoute>
                  <PageTransition><ConferenceRegistration /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Protected: Admin ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
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
      <AuthProvider>
        <AppContent />
        <Analytics />
      </AuthProvider>
    </Router>
  );
}
