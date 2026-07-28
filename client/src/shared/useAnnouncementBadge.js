import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

export const LAST_SEEN_ANNOUNCEMENT_KEY = 'lastSeenAnnouncement';
export const LAST_SEEN_ANNOUNCEMENT_TIME_KEY = 'lastSeenAnnouncementTime';
const POLL_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Persists the given announcement id and creation time as "seen" and notifies
 * every mounted useAnnouncementBadge() instance in this tab immediately.
 */
export function markAnnouncementsRead(latestId, createdAt) {
  if (!latestId) return;
  localStorage.setItem(LAST_SEEN_ANNOUNCEMENT_KEY, latestId);
  if (createdAt) {
    localStorage.setItem(LAST_SEEN_ANNOUNCEMENT_TIME_KEY, new Date(createdAt).getTime().toString());
  }
  window.dispatchEvent(new Event('updatesRead'));
}

/**
 * Tracks whether a newer announcement exists than the one the user last
 * saw. Polls on an interval and refetches on tab focus.
 */
export function useAnnouncementBadge() {
  const [hasNew, setHasNew] = useState(false);

  const checkLatest = useCallback(async () => {
    try {
      const res = await api.get('/announcements/latest');
      const latest = res.data;
      if (!latest) {
        setHasNew(false);
        return;
      }
      const lastSeenId = localStorage.getItem(LAST_SEEN_ANNOUNCEMENT_KEY);
      const lastSeenTime = localStorage.getItem(LAST_SEEN_ANNOUNCEMENT_TIME_KEY);

      if (lastSeenTime) {
        const isNewer = new Date(latest.createdAt).getTime() > Number(lastSeenTime);
        setHasNew(isNewer && latest._id !== lastSeenId);
      } else {
        setHasNew(latest._id !== lastSeenId);
      }
    } catch {
      // Network hiccup — leave the badge as-is rather than flashing it off.
    }
  }, []);

  useEffect(() => {
    checkLatest();

    const interval = setInterval(checkLatest, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkLatest();
    };
    const handleRead = () => setHasNew(false);
    const handleStorage = (e) => {
      if (e.key === LAST_SEEN_ANNOUNCEMENT_KEY) checkLatest();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkLatest);
    window.addEventListener('updatesRead', handleRead);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkLatest);
      window.removeEventListener('updatesRead', handleRead);
      window.removeEventListener('storage', handleStorage);
    };
  }, [checkLatest]);

  return hasNew;
}
