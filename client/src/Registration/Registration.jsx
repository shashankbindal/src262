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

/* ── Event selector card ── */
function EventCard({ event, selected, onClick }) {
  const isPast = event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
  const disabled = !event.registrationEnabled || isPast;

  return (
    <div
      className={`event-select-card${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      onClick={() => !disabled && onClick(event)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && onClick(event)}
    >
      <div className="esc-header">
        <span className="esc-name">{event.name}</span>
        <span className="esc-type">{event.type}</span>
      </div>
      <div className="esc-meta">
        <span>Fee: ₹{event.fee || 0}</span>
        <span>Deadline: {formatDate(event.registrationDeadline)}</span>
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
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [step, setStep]     = useState(1); // 1 = pick event, 2 = form, 3 = success
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');
  const [successReg, setSuccessReg] = useState(null);

  /* Form state */
  const [teamName, setTeamName]           = useState('');
  const [memberEmails, setMemberEmails]   = useState(['']);

  /* Load events */
  useEffect(() => {
    api.get('/events')
      .then((res) => setEvents(res.data || []))
      .finally(() => setEventsLoading(false));
  }, []);

  /* Pre-select event from ?event= query param */
  useEffect(() => {
    const slug = params.get('event');
    if (slug && events.length > 0) {
      const found = events.find((e) => e.slug === slug);
      if (found) { setSelectedEvent(found); setStep(2); }
    }
  }, [params, events]);

  return (
    <div className="reg-simple-container">
      <div className="reg-content-wrapper" style={{ textAlign: 'center' }}>
        <h1 className="reg-simple-title">Registration Starting Soon</h1>
        <p className="reg-simple-desc">We are currently setting up our servers. Registration will be available shortly.</p>
        <Link to="/" className="reg-simple-btn" style={{ textDecoration: 'none', marginTop: '24px' }} data-magnetic>
          Back to Home
        </Link>
      </div>
    </div>
  );

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

  if (authLoading || eventsLoading) {
    return (
      <div className="reg-simple-container">
        <div className="auth-spinner" />
      </div>
    );
  }

  /* Email verification gate */
  if (!user?.isEmailVerified) {
    return (
      <div className="reg-simple-container">
        <div className="reg-content-wrapper" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
          <h1 className="reg-simple-title">Verify your email first</h1>
          <p className="reg-simple-desc">
            Please verify your email address before registering for events.
            Check your inbox for the verification link.
          </p>
          <button className="reg-simple-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
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
            Your registration is now <strong>pending payment verification</strong>.
            Please go to your dashboard to upload your payment screenshot and transaction ID.
          </p>
          <div className="reg-notice" style={{ margin: '20px 0', textAlign: 'left' }}>
            Your registration details may be edited until payment approval. Payment approval is done manually
            by the organizing team and may take some time. Once approved, registration details become locked.
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
            <p className="reg-page-sub">Select an event to register for.</p>
          </div>

          <div className="event-select-grid">
            {events.map((evt) => (
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
              <span>Fee: <strong>₹{selectedEvent?.fee || 0}</strong></span>
              <span>Deadline: <strong>{formatDate(selectedEvent?.registrationDeadline)}</strong></span>
              {selectedEvent?.submissionDeadline && (
                <span>Submission Deadline: <strong>{formatDate(selectedEvent.submissionDeadline)}</strong></span>
              )}
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
                {memberEmails.map((email, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      className="auth-input"
                      type="email"
                      placeholder={`Member ${i + 1} email (must have an account)`}
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

          {/* Payment info */}
          <div className="reg-section reg-payment-info">
            <h3 className="reg-section-title">Payment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px', lineHeight: 1.6 }}>
              After submitting this form, you'll be directed to your dashboard where you can upload your payment
              screenshot and transaction ID. A QR code for payment will be shown there.
            </p>
            <div className="reg-notice">
              Your registration details may be edited until payment approval. Payment approval is done manually
              by the organizing team and may take some time. Once approved, registration details become locked.
            </div>
          </div>

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
