import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api.js';
import { LAST_SEEN_ANNOUNCEMENT_KEY, LAST_SEEN_ANNOUNCEMENT_TIME_KEY, markAnnouncementsRead } from './useAnnouncementBadge.js';
import './AnnouncementPopup.css';

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState(null);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If we are already on the updates page, do not pop up.
    if (location.pathname === '/updates') return;

    let isMounted = true;
    let timer = null;

    api.get('/announcements/latest')
      .then((res) => {
        if (!isMounted) return;
        const latest = res.data;
        if (!latest || !latest._id) return;

        const lastSeenId = localStorage.getItem(LAST_SEEN_ANNOUNCEMENT_KEY);
        const lastSeenTime = localStorage.getItem(LAST_SEEN_ANNOUNCEMENT_TIME_KEY);

        let isNew = false;
        if (lastSeenTime) {
          isNew = new Date(latest.createdAt).getTime() > Number(lastSeenTime) && latest._id !== lastSeenId;
        } else {
          isNew = latest._id !== lastSeenId;
        }

        if (isNew) {
          // Delay popup by 800ms
          timer = setTimeout(() => {
            if (isMounted) {
              setAnnouncement(latest);
              setShow(true);
            }
          }, 800);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [location.pathname]);

  const handleClose = () => {
    if (announcement?._id) {
      markAnnouncementsRead(announcement._id, announcement.createdAt);
    }
    setShow(false);
  };

  const handleView = () => {
    if (announcement?._id) {
      markAnnouncementsRead(announcement._id, announcement.createdAt);
    }
    setShow(false);
    navigate('/updates');
  };

  return (
    <AnimatePresence>
      {show && announcement && (
        <motion.div
          className="announcement-popup"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
        >
          <div className="ap-header">
            <div className="ap-badge-group">
              <span className="ap-badge-icon">🔔</span>
              <span className="ap-badge-text">New Update</span>
            </div>
            <button className="ap-close" onClick={handleClose} aria-label="Close Announcement">
              &times;
            </button>
          </div>
          <h3 className="ap-title">{announcement.title}</h3>
          <p className="ap-content">
            {announcement.content && announcement.content.length > 120
              ? `${announcement.content.substring(0, 120)}...`
              : announcement.content}
          </p>
          <div className="ap-footer">
            <button className="ap-btn ap-btn--dismiss" onClick={handleClose}>
              Dismiss
            </button>
            <button className="ap-btn ap-btn--view" onClick={handleView}>
              View Update
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
