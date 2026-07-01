import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import './Dashboard.css';

/* ── helpers ── */
const STATUS_LABELS = {
  pending_payment:    'Awaiting Payment',
  payment_submitted:  'Payment Submitted',
  payment_approved:   'Payment Approved',
  payment_rejected:   'Payment Rejected',
  waiting_submission: 'Awaiting Submission',
  submitted:          'Submitted',
  completed:          'Completed',
};

function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>;
}

/* ═══════════════════════════════════════════════════════════════ PROFILE TAB */
function ProfileTab({ user, refreshUser }) {
  const [form, setForm]     = useState({
    name:       user.name       || '',
    college:    user.college    || '',
    department: user.department || '',
    phone:      user.phone      || '',
  });
  const [busy, setBusy]     = useState(false);
  const [msg, setMsg]       = useState({ type: '', text: '' });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      await api.patch('/users/profile', form);
      await refreshUser();
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Update failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">My Profile</h2>
      </div>

      <div className="profile-card">
        {/* Email row */}
        <div className="profile-field">
          <label className="profile-label">Email</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input className="profile-input" value={user.email} disabled />
            <span className={`email-badge ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
              {user.isEmailVerified ? '✓ Verified' : '! Unverified'}
            </span>
          </div>
        </div>

        {msg.text && (
          <div className={msg.type === 'success' ? 'auth-success' : 'auth-error'} style={{ marginBottom: '20px' }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={save} noValidate>
          {[
            { name: 'name',       label: 'Full Name',   placeholder: 'Your full name' },
            { name: 'college',    label: 'College',     placeholder: 'Institution name' },
            { name: 'department', label: 'Department',  placeholder: 'e.g. Chemical Engineering' },
            { name: 'phone',      label: 'Phone',       placeholder: '+91 XXXXX XXXXX' },
          ].map((f) => (
            <div className="profile-field" key={f.name}>
              <label className="profile-label" htmlFor={`prof-${f.name}`}>{f.label}</label>
              <input
                id={`prof-${f.name}`}
                name={f.name}
                className="profile-input"
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={handle}
              />
            </div>
          ))}

          <button className="profile-save-btn" type="submit" disabled={busy}>
            {busy ? <><span className="btn-spinner" /> Saving…</> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ PAYMENT UPLOAD */
function PaymentUploadForm({ registrationId, onDone }) {
  const [txId, setTxId]   = useState('');
  const [file, setFile]   = useState(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!txId.trim()) { setError('Transaction ID is required.'); return; }
    if (!file) { setError('Please select a screenshot.'); return; }
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('screenshot', file);
    fd.append('transactionId', txId.trim());
    try {
      await api.upload(`/registrations/${registrationId}/payment`, fd);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="payment-form" onSubmit={submit}>
      {error && <div className="auth-error" style={{ margin: 0 }}>{error}</div>}

      <div style={{ textAlign: 'center', marginBottom: '24px', padding: '16px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-medium)' }}>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Scan the QR Code below to pay using any UPI app.
        </p>
        <div style={{ width: '180px', height: '180px', margin: '0 auto', background: '#fff', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Replace this div with an actual <img src="/qr.jpg" /> when you have your real QR code! */}
          <div style={{ border: '2px dashed #ccc', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.9rem', textAlign: 'center' }}>
            Payment<br/>QR Code<br/>Placeholder
          </div>
        </div>
        <p style={{ margin: '16px 0 0 0', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
          UPI ID: your-upi-id@bank
        </p>
      </div>

      <div>
        <label>Transaction ID</label>
        <input type="text" placeholder="Enter UPI/bank transaction ID" value={txId} onChange={(e) => setTxId(e.target.value)} />
      </div>
      <div>
        <label>Payment Screenshot</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
      <button className="reg-action-btn primary" type="submit" disabled={busy}>
        {busy ? <><span className="btn-spinner" /> Uploading…</> : 'Submit Payment'}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════ SUBMISSION UPLOAD */
function SubmissionUploadForm({ registrationId, onDone }) {
  const [file, setFile]   = useState(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.upload(`/submissions/${registrationId}`, fd);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="payment-form" onSubmit={submit}>
      {error && <div className="auth-error" style={{ margin: 0 }}>{error}</div>}
      <div>
        <label>Upload File (PDF)</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
      <button className="reg-action-btn primary" type="submit" disabled={busy}>
        {busy ? <><span className="btn-spinner" /> Uploading…</> : 'Submit File'}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════ EDIT FORM */
function EditRegistrationForm({ reg, onDone }) {
  const [teamName, setTeamName] = useState(reg.teamId?.teamName || '');
  const [emails, setEmails] = useState(
    reg.teamId?.members?.map(m => m.email).join(', ') || ''
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const memberEmails = emails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      await api.patch(`/registrations/${reg._id}`, { teamName, memberEmails });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="payment-form" onSubmit={submit}>
      {error && <div className="auth-error" style={{ margin: 0 }}>{error}</div>}
      <div>
        <label>Team Name</label>
        <input
          type="text"
          placeholder="Your team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>
      <div>
        <label>Member Emails (comma-separated)</label>
        <input
          type="text"
          placeholder="member1@example.com, member2@example.com"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
        />
      </div>
      <button className="reg-action-btn primary" type="submit" disabled={busy}>
        {busy ? <><span className="btn-spinner" /> Saving…</> : 'Save Changes'}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════ REGISTRATION CARD */
function RegCard({ reg, onRefresh }) {
  const [showPayment, setShowPayment]       = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const [showEdit, setShowEdit]             = useState(false);

  const event = reg.eventId;
  const canPayment   = ['pending_payment', 'payment_rejected'].includes(reg.status);
  const canSubmit    = ['waiting_submission', 'submitted'].includes(reg.status) && event?.fileUploadRequired;
  const isRejected   = reg.status === 'payment_rejected';

  return (
    <div className="reg-card">
      <div className="reg-card-header">
        <h3 className="reg-event-name">{event?.name || 'Event'}</h3>
        <span className="reg-event-type">{event?.type}</span>
      </div>

      <div className="reg-meta">
        <div className="reg-meta-item">
          <span className="reg-meta-label">Status</span>
          <StatusBadge status={reg.status} />
        </div>
        <div className="reg-meta-item">
          <span className="reg-meta-label">Registered</span>
          <span className="reg-meta-value">{new Date(reg.createdAt).toLocaleDateString('en-IN')}</span>
        </div>
        {reg.transactionId && (
          <div className="reg-meta-item">
            <span className="reg-meta-label">Transaction ID</span>
            <span className="reg-meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {reg.transactionId}
            </span>
          </div>
        )}
        {reg.teamId?.teamName && (
          <div className="reg-meta-item">
            <span className="reg-meta-label">Team</span>
            <span className="reg-meta-value">{reg.teamId.teamName}</span>
          </div>
        )}
        {reg.teamId?.members && reg.teamId.members.length > 0 && (
          <div className="reg-meta-item" style={{ gridColumn: '1 / -1' }}>
            <span className="reg-meta-label">Team Members</span>
            <span className="reg-meta-value">
              {reg.participantSnapshot?.name} (Leader), {reg.teamId.members.map((m) => m.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      {isRejected && reg.paymentRejectedReason && (
        <div className="auth-error" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
          <strong>Reason:</strong> {reg.paymentRejectedReason}
        </div>
      )}

      {(canPayment || canSubmit) && (
        <div className="reg-card-actions">
          {canPayment && event?.type === 'team' && (
            <button className="reg-action-btn" onClick={() => { setShowEdit((v) => !v); setShowPayment(false); setShowSubmission(false); }}>
              {showEdit ? 'Cancel Edit' : 'Edit Team'}
            </button>
          )}
          {canPayment && (
            <button className="reg-action-btn primary" onClick={() => { setShowPayment((v) => !v); setShowSubmission(false); setShowEdit(false); }}>
              {showPayment ? 'Cancel' : (isRejected ? '↺ Re-submit Payment' : 'Submit Payment')}
            </button>
          )}
          {canSubmit && (
            <button className="reg-action-btn primary" onClick={() => { setShowSubmission((v) => !v); setShowPayment(false); setShowEdit(false); }}>
              {showSubmission ? 'Cancel' : (reg.status === 'submitted' ? '↺ Replace File' : 'Upload Submission')}
            </button>
          )}
        </div>
      )}

      {showEdit && (
        <EditRegistrationForm
          reg={reg}
          onDone={() => { setShowEdit(false); onRefresh(); }}
        />
      )}
      {showPayment && (
        <PaymentUploadForm
          registrationId={reg._id}
          onDone={() => { setShowPayment(false); onRefresh(); }}
        />
      )}
      {showSubmission && (
        <SubmissionUploadForm
          registrationId={reg._id}
          onDone={() => { setShowSubmission(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════ REGISTRATIONS TAB */
function RegistrationsTab() {
  const [regs, setRegs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = () => {
    setLoading(true);
    api.get('/registrations')
      .then((res) => setRegs(res.data || []))
      .catch(() => setError('Failed to load registrations.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="dash-loader"><div className="auth-spinner" /></div>;
  if (error)   return <div className="auth-error">{error}</div>;

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">My Registrations</h2>
      </div>

      {regs.length === 0 ? (
        <div className="reg-empty">
          <h3>No registrations yet</h3>
          <p>Head over to the <a href="/register" style={{ color: 'var(--primary)' }}>Registration</a> page to sign up for events.</p>
        </div>
      ) : (
        <div className="reg-cards-grid">
          {regs.map((r) => <RegCard key={r._id} reg={r} onRefresh={load} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ DASHBOARD ROOT */
export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();
  const isProfile = location.pathname.startsWith('/profile');

  return (
    <div className="dash-layout">
      <div className="dash-topbar">
        <div className="dash-topbar-inner">
          <div style={{ padding: '16px 24px', fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '600' }}>
            {isProfile ? 'My Profile' : 'My Registrations'}
          </div>
          <div style={{ flex: 1 }} />
          {user?.role === 'admin' && (
            <button
              className="dash-tab"
              onClick={() => window.location.href = '/admin'}
              style={{ color: 'var(--primary)', fontWeight: 'bold' }}
            >
              Admin Panel
            </button>
          )}
          <button
            className="dash-tab"
            onClick={async () => { await logout(); window.location.href = '/'; }}
            style={{ color: 'var(--text-muted)' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="dash-body">
        {isProfile ? <ProfileTab user={user} refreshUser={refreshUser} /> : <RegistrationsTab />}
      </div>
    </div>
  );
}
