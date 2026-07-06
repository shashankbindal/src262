import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import '../Home/animations.css';
import './Registration.css';

/* ── Helper ── */
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const EVENT_IMAGES = {
  'Chem-E-Car': 'https://www.aiche.org/sites/default/files/images/conference/event/23370477461_f16f1dd228_z.jpg',
  'K-12 STEM': 'https://learningliftoff.com/wp-content/uploads/2023/01/pexels-artem-podrez-6941450-1536x864.jpg.webp',
  'Poster Presentation': 'https://images.unsplash.com/photo-1771344488060-f6b32a503b34?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0',
  'Paper Presentation': 'https://images.unsplash.com/photo-1515603403036-f3d35f75ca52?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0',
  'Chem-E-Jeopardy': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5jUsij8b-x-PBqn3yMZbAYUwfyACiF3GPAw&s'
};

/* ── Event selector card ── */
function EventCard({ event, selected, onClick }) {
  const isPast = event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
  const disabled = !event.registrationEnabled || isPast;
  const bgImg = EVENT_IMAGES[event.name] || '/bg.png';

  return (
    <div
      className={`event-select-card${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      onClick={() => !disabled && onClick(event)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && onClick(event)}
      style={{ '--bg-img': `url(${bgImg})` }}
    >
      <div className="esc-header">
        <span className="esc-name">{event.name}</span>
        <span className="esc-type">{event.type}</span>
      </div>
      {disabled && (
        <span className="esc-closed">{isPast ? 'Closed' : 'Disabled'}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ MAIN COMPONENT */
export default function Registration() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate       = useNavigate();
  const [params]       = useSearchParams();

  const [events, setEvents]         = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(() => {
    try {
      const saved = sessionStorage.getItem('er_event');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [step, setStep] = useState(() => Number(sessionStorage.getItem('er_step')) || 1); // 1 = pick event, 2 = form, 3 = success
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');
  const [successReg, setSuccessReg] = useState(null);

  /* Conference registration status */
  const [confReg, setConfReg]           = useState(null);
  const [confRegLoading, setConfRegLoading] = useState(true);

  /* Form state */
  const [teamName, setTeamName]         = useState(() => sessionStorage.getItem('er_teamName') || '');
  const [memberEmails, setMemberEmails] = useState(() => {
    try {
      const saved = sessionStorage.getItem('er_members');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [''];
  });

  /* Persist state.
   * Step 3 (success) is intentionally never persisted: successReg only lives
   * in React state, so a refresh on the success screen can't reconstruct it.
   * Actively clearing er_step here (rather than just skipping the write)
   * ensures a refresh always falls back to a clean step 1 instead of getting
   * stuck on a stale step 2/3 with no selectedEvent to render. */
  useEffect(() => {
    if (step === 1 || step === 2) {
      sessionStorage.setItem('er_step', step);
    } else {
      sessionStorage.removeItem('er_step');
    }
  }, [step]);
  useEffect(() => {
    if (selectedEvent) sessionStorage.setItem('er_event', JSON.stringify(selectedEvent));
    else sessionStorage.removeItem('er_event');
  }, [selectedEvent]);
  useEffect(() => {
    sessionStorage.setItem('er_teamName', teamName);
  }, [teamName]);
  useEffect(() => {
    sessionStorage.setItem('er_members', JSON.stringify(memberEmails));
  }, [memberEmails]);

  /* Load events */
  useEffect(() => {
    api.get('/events')
      .then((res) => setEvents(res.data || []))
      .finally(() => setEventsLoading(false));
  }, []);

  /* Load conference registration status */
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      api.get('/conference-registration')
        .then((res) => setConfReg(res.data || null))
        .catch(() => setConfReg(null))
        .finally(() => setConfRegLoading(false));
    } else if (!authLoading) {
      setConfRegLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  /* Pre-select event from ?event= query param */
  useEffect(() => {
    const slug = params.get('event');
    if (slug && events.length > 0) {
      const found = events.find((e) => e.slug === slug);
      if (found) { setSelectedEvent(found); setStep(2); }
    }
  }, [params, events]);

  /* Redirect to login if not authenticated */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="reg-simple-container">
        <div className="reg-content-wrapper" style={{ textAlign: 'center' }}>
          <h1 className="reg-simple-title">Sign in to Register</h1>
          <p className="reg-simple-desc">You need an account to register for events. It only takes a minute.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
            <Link to="/login" className="reg-simple-btn" style={{ textDecoration: 'none' }} data-magnetic>Sign In</Link>
            <Link to="/signup" className="reg-simple-btn" style={{ textDecoration: 'none', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }} data-magnetic>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || eventsLoading || confRegLoading) {
    return (
      <div className="reg-simple-container">
        <div className="auth-spinner" />
      </div>
    );
  }


  /* Conference registration gate */
  if (!confReg || confReg.status !== 'approved') {
    const isPending  = confReg?.status === 'pending';
    const isRejected = confReg?.status === 'rejected';

    return (
      <div className="reg-simple-container">
        <div className="reg-content-wrapper" style={{ textAlign: 'center' }}>
          {isPending ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
              <h1 className="reg-simple-title">Registration Under Review</h1>
              <p className="reg-simple-desc">
                Your conference registration payment is being reviewed by the organizing team.
                You'll be able to register for events once it's approved.
              </p>
            </>
          ) : isRejected ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠</div>
              <h1 className="reg-simple-title">Conference Registration Rejected</h1>
              <p className="reg-simple-desc">
                Your conference registration was rejected. Please re-submit with the correct payment details.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎫</div>
              <h1 className="reg-simple-title">Register for the Conference First</h1>
              <p className="reg-simple-desc">
                You need an approved conference registration to sign up for events.
                Pay the conference fee to get started.
              </p>
            </>
          )}
          <Link to="/conference-registration" className="reg-simple-btn" style={{ textDecoration: 'none', marginTop: '16px' }} data-magnetic>
            {isPending ? 'View Status' : isRejected ? 'Re-submit Payment' : 'Register for Conference'}
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (step === 3 && successReg) {
    return (
      <div className="reg-simple-container">
        <div className="reg-content-wrapper" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
          <h1 className="reg-simple-title">Registration Submitted!</h1>
          <p className="reg-simple-desc">
            You're registered for <strong style={{ color: 'var(--primary)' }}>{selectedEvent?.name}</strong>.
            <br /><br />
            Head to your dashboard to track your registration status and upload submission files when required.
          </p>
          <div className="reg-notice" style={{ margin: '20px 0', textAlign: 'left' }}>
            Team details can be edited while your registration is in the <em>Registered</em> or <em>Awaiting Submission</em> state.
          </div>
          <button className="reg-simple-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 1: Pick event ── */
  if (step === 1) {
    return (
      <div className="reg-page">
        <div className="reg-page-inner">
          <div className="reg-page-header">
            <span className="auth-eyebrow">AIChE India SRC 2026</span>
            <h1 className="reg-page-title">Event Registration</h1>
            <p className="reg-page-sub">Select an event to register for. Your SRC ID: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{confReg.srcId}</strong></p>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>Team Events</h2>
          <div className="event-select-grid" style={{ marginBottom: '48px' }}>
            {events.filter(e => e.type === 'team').map((evt) => (
              <EventCard
                key={evt._id}
                event={evt}
                selected={selectedEvent?._id === evt._id}
                onClick={(e) => { setSelectedEvent(e); setStep(2); setError(''); }}
              />
            ))}
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>Solo Events</h2>
          <div className="event-select-grid">
            {events.filter(e => e.type === 'solo').map((evt) => (
              <EventCard
                key={evt._id}
                event={evt}
                selected={selectedEvent?._id === evt._id}
                onClick={(e) => { setSelectedEvent(e); setStep(2); setError(''); }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 2: Registration form ── */
  const isTeam = selectedEvent?.type === 'team';
  const minMembers = (selectedEvent?.minTeamSize || 2) - 1; // excluding leader
  const maxMembers = (selectedEvent?.maxTeamSize || 4) - 1;

  const addMember = () => {
    if (memberEmails.length < maxMembers) setMemberEmails([...memberEmails, '']);
  };
  const removeMember = (i) => setMemberEmails(memberEmails.filter((_, idx) => idx !== i));
  const updateMember = (i, val) => {
    const arr = [...memberEmails];
    arr[i] = val;
    setMemberEmails(arr);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedEvent) {
      setError('No event selected. Please pick an event first.');
      setStep(1);
      return;
    }

    if (isTeam) {
      const filled = memberEmails.filter((m) => m.trim());
      if (filled.length < minMembers) {
        setError(`Team must have at least ${minMembers} member(s) besides the leader.`);
        return;
      }
      for (const em of filled) {
        if (!/\S+@\S+\.\S+/.test(em)) { setError(`"${em}" is not a valid email.`); return; }
      }
    }

    setBusy(true);
    try {
      const body = {};
      if (isTeam) {
        body.teamName = teamName.trim() || undefined;
        body.memberEmails = memberEmails.filter((m) => m.trim());
      }

      const res = await api.post(`/registrations/event/${selectedEvent._id}`, body);
      
      sessionStorage.removeItem('er_step');
      sessionStorage.removeItem('er_event');
      sessionStorage.removeItem('er_teamName');
      sessionStorage.removeItem('er_members');

      setSuccessReg(res.data);
      setStep(3);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="reg-page">
      <div className="reg-page-inner">
        <button
          className="reg-back-btn"
          onClick={() => { setStep(1); setSelectedEvent(null); setError(''); }}
        >
          ← Back to Events
        </button>

        <div className="reg-form-card">
          <div className="reg-form-header">
            <h2 className="reg-form-title">{selectedEvent?.name}</h2>
            <div className="reg-form-meta">
              <span>Type: <strong>{selectedEvent?.type}</strong></span>
            </div>
          </div>

          {/* Auto-filled participant info */}
          <div className="reg-section">
            <h3 className="reg-section-title">Your Details (Leader)</h3>
            <div className="reg-fields-row">
              <div className="auth-field">
                <label className="auth-label">Name</label>
                <input className="auth-input" value={user?.name || ''} disabled />
              </div>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input className="auth-input" value={user?.email || ''} disabled />
              </div>
            </div>
            <div className="reg-fields-row">
              <div className="auth-field">
                <label className="auth-label">College</label>
                <input className="auth-input" value={user?.college || ''} disabled placeholder="Update in profile" />
              </div>
              <div className="auth-field">
                <label className="auth-label">Phone</label>
                <input className="auth-input" value={user?.phone || ''} disabled placeholder="Update in profile" />
              </div>
            </div>
            {(!user?.college || !user?.phone) && (
              <p style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '8px' }}>
                ⚠ Complete your <Link to="/dashboard" style={{ color: 'var(--primary)' }}>profile</Link> to prefill college and phone.
              </p>
            )}
          </div>

          {/* Team section */}
          {isTeam && (
            <div className="reg-section">
              <h3 className="reg-section-title">Team Details</h3>
              <div className="auth-field">
                <label className="auth-label">Team Name (optional)</label>
                <input
                  className="auth-input"
                  placeholder={`${user?.name}'s Team`}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label className="auth-label">
                  Team Members (min {minMembers}, max {maxMembers} besides you)
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  All members must have an account with an approved conference registration.
                </p>
                {memberEmails.map((email, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      className="auth-input"
                      type="email"
                      placeholder={`Member ${i + 1} email`}
                      value={email}
                      onChange={(e) => updateMember(i, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {memberEmails.length > 1 && (
                      <button
                        type="button"
                        className="reg-remove-btn"
                        onClick={() => removeMember(i)}
                        aria-label="Remove member"
                      >×</button>
                    )}
                  </div>
                ))}
                {memberEmails.length < maxMembers && (
                  <button type="button" className="reg-add-member-btn" onClick={addMember}>
                    + Add Member
                  </button>
                )}
              </div>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={submit}>
            <button className="reg-simple-btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: '8px' }} data-magnetic>
              {busy ? 'Submitting…' : 'Submit Registration →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
