import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import { COUNTRY_CODES } from '../shared/countryCodes.js';
import './Dashboard.css';

/* ── helpers ── */
const STATUS_LABELS = {
  registered:         'Registered',
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
    name:             user.name             || '',
    college:          user.college          || '',
    department:       user.department       || '',
    phoneCountryCode: user.phoneCountryCode || '+91',
    phone:            user.phone            || '',
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
    <div className="profile-page-inner">
      <div className="dash-section-header">
        <h2 className="dash-section-title">My Profile</h2>
      </div>

      <div className="profile-row">
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

          <div className="profile-field">
            <label className="profile-label" htmlFor="prof-phone">Phone</label>
            <div className="profile-phone-row">
              <select
                id="prof-phoneCountryCode"
                name="phoneCountryCode"
                className="profile-select"
                value={form.phoneCountryCode}
                onChange={handle}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.country} value={c.code}>{c.code} ({c.country})</option>
                ))}
              </select>
              <input
                id="prof-phone"
                name="phone"
                className="profile-input"
                placeholder="9876543210"
                maxLength={15}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              />
            </div>
          </div>

          <button className="profile-save-btn" type="submit" disabled={busy}>
            {busy ? <><span className="btn-spinner" /> Saving…</> : 'Save Changes'}
          </button>
        </form>
      </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ CONFERENCE REGISTRATION BANNER */
function ConferenceRegBanner() {
  const [confReg, setConfReg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/conference-registration')
      .then((res) => setConfReg(res.data || null))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (loadError) {
    return (
      <div className="confbanner confbanner-none">
        <div className="confbanner-body">
          <span className="confbanner-label">Conference Registration</span>
          <p className="confbanner-msg">Couldn't load your conference registration status. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  if (!confReg) {
    return (
      <div className="confbanner confbanner-none">
        <div className="confbanner-body">
          <span className="confbanner-label">Conference Registration</span>
          <p className="confbanner-msg">You haven't registered for the conference yet. Pay the conference fee to unlock event registration.</p>
        </div>
        <Link to="/conference-registration" className="confbanner-btn">Register Now</Link>
      </div>
    );
  }

  if (confReg.status === 'pending') {
    return (
      <div className="confbanner confbanner-pending">
        <div className="confbanner-body">
          <span className="confbanner-label">Conference Registration · Under Review</span>
          <p className="confbanner-msg">Your payment has been submitted and is being reviewed. You will receive a confirmation email within 24–72 hours.</p>
          <div className="confbanner-meta">
            {confReg.referenceNumber && (
              <span className="confbanner-meta-item">
                <span className="confbanner-meta-key">Ref No.</span>
                <span className="confbanner-meta-val confbanner-mono">{confReg.referenceNumber}</span>
              </span>
            )}
            {confReg.transactionId && (
              <span className="confbanner-meta-item">
                <span className="confbanner-meta-key">UTR</span>
                <span className="confbanner-meta-val confbanner-mono">{confReg.transactionId}</span>
              </span>
            )}
            {confReg.paymentTimestamp && (
              <span className="confbanner-meta-item">
                <span className="confbanner-meta-key">Submitted</span>
                <span className="confbanner-meta-val">{new Date(confReg.paymentTimestamp).toLocaleDateString('en-IN')}</span>
              </span>
            )}
          </div>
        </div>
        <Link to="/conference-registration" className="confbanner-btn outlined">View Details</Link>
      </div>
    );
  }

  if (confReg.status === 'rejected') {
    return (
      <div className="confbanner confbanner-rejected">
        <div className="confbanner-body">
          <span className="confbanner-label">Conference Registration · Rejected</span>
          {confReg.rejectionReason && (
            <p className="confbanner-msg"><strong>Reason:</strong> {confReg.rejectionReason}</p>
          )}
          {confReg.referenceNumber && (
            <div className="confbanner-meta">
              <span className="confbanner-meta-item">
                <span className="confbanner-meta-key">Ref No.</span>
                <span className="confbanner-meta-val confbanner-mono">{confReg.referenceNumber}</span>
              </span>
            </div>
          )}
        </div>
        <Link to="/conference-registration" className="confbanner-btn">Re-submit</Link>
      </div>
    );
  }

  if (confReg.status === 'approved') {
    return (
      <div className="confbanner confbanner-approved">
        <div className="confbanner-body">
          <span className="confbanner-label">Conference Registration · Approved</span>
          <div className="confbanner-srcid-row">
            <span className="confbanner-srcid-label">SRC ID</span>
            <strong className="confbanner-srcid">{confReg.srcId}</strong>
          </div>
          <div className="confbanner-meta">
            {confReg.referenceNumber && (
              <span className="confbanner-meta-item">
                <span className="confbanner-meta-key">Ref No.</span>
                <span className="confbanner-meta-val confbanner-mono">{confReg.referenceNumber}</span>
              </span>
            )}
          </div>
        </div>
        <Link to="/register" className="confbanner-btn outlined">Register for Events</Link>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════ SUBMISSION UPLOAD */
function SubmissionUploadForm({ registrationId, onDone }) {
  const [file, setFile]   = useState(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = React.useRef(null);

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

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
        <div
          className={`cr-upload-box ${isDragOver ? 'drag-over' : ''}`}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {file ? (
            <div className="cr-file-thumb cr-file-thumb-pdf">
              <span className="cr-pdf-icon">PDF</span>
              <span className="cr-file-name">{file.name}</span>
            </div>
          ) : (
            <div className="cr-upload-placeholder">
              <span className="cr-upload-icon">⬆</span>
              <span>Click to upload (PDF — max 10 MB)</span>
            </div>
          )}
        </div>
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
  const [names, setNames] = useState(
    reg.teamId?.members?.map(m => m.name).join(', ') || ''
  );
  const [srcIds, setSrcIds] = useState(
    reg.teamId?.members?.map(m => m.srcId).join(', ') || ''
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!teamName.trim()) {
      setError('Team name is required.');
      return;
    }

    setBusy(true);

    const memberSrcIds = srcIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await api.patch(`/registrations/${reg._id}`, { teamName, memberSrcIds });
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
          required
        />
      </div>
      <div>
        <label>Member Names (comma-separated, for your reference)</label>
        <input
          type="text"
          placeholder="Priya Sharma, Rahul Verma"
          value={names}
          onChange={(e) => setNames(e.target.value)}
        />
      </div>
      <div>
        <label>Member SRC IDs (comma-separated, same order as names)</label>
        <input
          type="text"
          placeholder="SRC1234, SRC5678"
          value={srcIds}
          onChange={(e) => setSrcIds(e.target.value)}
          style={{ textTransform: 'uppercase' }}
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
  const [showSubmission, setShowSubmission] = useState(false);
  const [showEdit, setShowEdit]             = useState(false);

  const event    = reg.eventId;
  const canEdit  = ['registered', 'waiting_submission'].includes(reg.status) && event?.type === 'team';
  const canSubmit = ['waiting_submission', 'submitted'].includes(reg.status) && event?.fileUploadRequired;

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
        {reg.srcId && (
          <div className="reg-meta-item">
            <span className="reg-meta-label">SRC ID</span>
            <span className="reg-meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
              {reg.srcId}
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

      {(canEdit || canSubmit) && (
        <div className="reg-card-actions">
          {canEdit && (
            <button className="reg-action-btn" onClick={() => { setShowEdit((v) => !v); setShowSubmission(false); }}>
              {showEdit ? 'Cancel Edit' : 'Edit Team'}
            </button>
          )}
          {canSubmit && (
            <button className="reg-action-btn primary" onClick={() => { setShowSubmission((v) => !v); setShowEdit(false); }}>
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
      <ConferenceRegBanner />

      <div className="dash-section-header">
        <h2 className="dash-section-title">My Event Registrations</h2>
      </div>

      {regs.length === 0 ? (
        <div className="reg-empty">
          <h3>No event registrations yet</h3>
          <p>Once your conference registration is approved, head to the <a href="/register" style={{ color: 'var(--primary)' }}>Registration</a> page to sign up for events.</p>
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
