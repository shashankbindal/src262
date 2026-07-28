import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api.js';
import { useDocumentTitle } from '../shared/useDocumentTitle.js';
import { markAnnouncementsRead } from '../shared/useAnnouncementBadge.js';
import './Updates.css';

const PAGE_SIZE = 20;

function timeAgo(dateString) {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} month${month === 1 ? '' : 's'} ago`;
  const year = Math.floor(month / 12);
  return `${year} year${year === 1 ? '' : 's'} ago`;
}



function NewspaperSkeleton() {
  return (
    <>
      <div className="np-skel-lead" aria-hidden="true">
        <div className="skel-line skel-kicker" />
        <div className="skel-line skel-headline" />
        <div className="skel-line skel-text" />
        <div className="skel-line skel-text" />
        <div className="skel-line skel-text short" />
      </div>
      <div className="np-briefs" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="np-brief np-skel-brief" key={i}>
            <div className="skel-line skel-brief-title" />
            <div className="skel-line skel-text" />
            <div className="skel-line skel-text short" />
          </div>
        ))}
      </div>
    </>
  );
}

const Updates = () => {
  useDocumentTitle('Latest Updates | VIPLAV 2026 — AIChE India SRC');

  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount]   = useState(0);

  const loadPage = useCallback((pageNum) => {
    const setBusy = pageNum === 1 ? setLoading : setLoadingMore;
    setBusy(true);
    setError('');
    return api.get(`/announcements?page=${pageNum}&limit=${PAGE_SIZE}`)
      .then((res) => {
        const data = res.data || {};
        setItems((prev) => (pageNum === 1 ? (data.docs || []) : [...prev, ...(data.docs || [])]));
        setHasNextPage(Boolean(data.hasNextPage));
        setTotalCount(data.totalDocs || 0);
        setPage(pageNum);
      })
      .catch(() => setError('Failed to load updates. Please try again.'))
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  /* Mark the newest announcement as seen the moment this page is viewed,
   * clearing the navbar badge. */
  useEffect(() => {
    api.get('/announcements/latest')
      .then((res) => {
        if (res.data?._id) {
          markAnnouncementsRead(res.data._id, res.data.createdAt);
        }
      })
      .catch(() => {});
  }, []);

  const dateline = useMemo(() => {
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    return `${today} · RGIPT, Rae Bareli`;
  }, []);

  const [lead, ...briefs] = items;

  return (
    <div className="updates-page">
      <header className="np-masthead">
        <h1 className="np-nameplate">Latest Updates</h1>
        <p className="np-tagline">Stay informed with official announcements, registration updates, event schedules, and important notices from the VIPLAV 2026 Organizing Committee.</p>
      </header>

      <div className="np-dateline-bar">{dateline}</div>

      <div className="np-body">
        {loading ? (
          <NewspaperSkeleton />
        ) : error ? (
          <div className="np-notice np-notice--error">
            <span className="np-notice-label">Wire Error</span>
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="np-notice">
            <span className="np-notice-label">Notice</span>
            <p>No official announcements have been published yet.</p>
            <span>Check back soon for official updates.</span>
          </div>
        ) : (
          <>
            <article className="np-lead">
              <h2 className="np-lead-headline">{lead.title}</h2>
              <div className="np-byline">
                By Organizers · Published{' '}
                <time dateTime={lead.createdAt} title={timeAgo(lead.createdAt)}>
                  {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
              </div>
              <p className="np-lead-text">{lead.content}</p>
            </article>

            {briefs.length > 0 && (
              <>
                <div className="np-section-rule"><span>Earlier Announcements</span></div>
                <div className="np-briefs">
                  {briefs.map((item) => (
                    <article className="np-brief" key={item._id}>
                      <h3 className="np-brief-headline">{item.title}</h3>
                      <div className="np-byline np-byline--small">By Organizers · {timeAgo(item.createdAt)}</div>
                      <p className="np-brief-text">{item.content}</p>
                    </article>
                  ))}
                </div>
              </>
            )}

            {hasNextPage && (
              <div className="np-load-more">
                <button
                  className="np-load-more-btn"
                  onClick={() => loadPage(page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : 'More Dispatches →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Updates;
