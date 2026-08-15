import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import { COUNTRY_CODES } from '../shared/countryCodes.js';
import { useResendCooldown, formatCooldown } from '../shared/useResendCooldown.js';
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

function ViewConferenceIdCardButton({ className = 'confbanner-btn outlined' }) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  const handleClick = async () => {
    setState('loading');
    setError('');
    const cardWindow = window.open('', '_blank');

    try {
      const pdf = await api.download('/conference-registration/id-card');
      const url = URL.createObjectURL(pdf);

      if (cardWindow) {
        cardWindow.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setState('idle');
    } catch (err) {
      cardWindow?.close();
      setState('error');
      setError(err instanceof ApiError ? err.message : 'Could not open your ID card. Please try again.');
    }
  };

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
      <button type="button" className={className} onClick={handleClick} disabled={state === 'loading'}>
        {state === 'loading' ? 'Opening ID Card…' : 'View ID Card'}
      </button>
      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444', maxWidth: '220px', lineHeight: 1.4 }}>{error}</span>}
    </span>
  );
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
  const [conferenceReg, setConferenceReg] = useState(null);

  /* Email Verification state */
  const [showVerification, setShowVerification] = useState(false);
  const [otp, setOtp]                           = useState('');
  const [otpBusy, setOtpBusy]                   = useState(false);
  const [otpError, setOtpError]                 = useState('');
  const [otpSuccess, setOtpSuccess]             = useState('');
  const [otpCooldown, startOtpCooldown]         = useResendCooldown(300);

  useEffect(() => {
    api.get('/conference-registration')
      .then((res) => setConferenceReg(res.data || null))
      .catch(() => setConferenceReg(null));
  }, []);

  const sendVerificationOTP = async () => {
    setOtpBusy(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      await api.post('/auth/send-otp', { email: user.email });
      setOtpSuccess('Verification code sent to your email.');
      setShowVerification(true);
      startOtpCooldown();
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : 'Could not send verification code.');
    } finally {
      setOtpBusy(false);
    }
  };

  const submitVerificationOTP = async () => {
    setOtpBusy(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      await api.post('/auth/verify-otp', { email: user.email, otp: otp.trim() });
      await refreshUser();
      setShowVerification(false);
      setOtp('');
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setOtpBusy(false);
    }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <input className="profile-input" style={{ flex: 1, minWidth: '200px' }} value={user.email} disabled />
            <span className={`email-badge ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
              {user.isEmailVerified ? '✓ Verified' : '! Unverified'}
            </span>
            {!user.isEmailVerified && !showVerification && (
              <button
                type="button"
                className="profile-verify-btn"
                onClick={sendVerificationOTP}
                disabled={otpBusy || otpCooldown > 0}
              >
                {otpBusy ? 'Sending...' : otpCooldown > 0 ? `Sent (${formatCooldown(otpCooldown)})` : 'Verify Now'}
              </button>
            )}
          </div>
        </div>

        {/* Expandable verification box */}
        {!user.isEmailVerified && showVerification && (
          <div className="profile-verification-box">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.90rem', color: 'var(--text-primary)', fontWeight: '600' }}>
              Enter Verification Code
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              We sent a 6-digit code to <strong>{user.email}</strong>. Enter it below to verify your email.
            </p>

            {otpError && <div className="auth-error" style={{ marginBottom: '12px' }}>{otpError}</div>}
            {otpSuccess && <div className="auth-success" style={{ marginBottom: '12px' }}>{otpSuccess}</div>}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="profile-input"
                style={{ width: '140px', textAlign: 'center', letterSpacing: '2px', fontSize: '1.1rem', height: '42px', padding: '6px' }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button
                type="button"
                className="profile-save-btn"
                style={{ height: '42px', padding: '0 20px', fontSize: '0.85rem' }}
                onClick={submitVerificationOTP}
                disabled={otpBusy || otp.length !== 6}
              >
                {otpBusy ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => {
                  setShowVerification(false);
                  setOtpError('');
                  setOtpSuccess('');
                  setOtp('');
                }}
              >
                Cancel
              </button>
            </div>

            <p style={{ margin: '12px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Didn't receive the code?{' '}
              <button
                type="button"
                className="auth-link-btn"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
                onClick={sendVerificationOTP}
                disabled={otpBusy || otpCooldown > 0}
              >
                {otpCooldown > 0 ? `Resend code (${formatCooldown(otpCooldown)})` : 'Resend code'}
              </button>
            </p>
          </div>
        )}


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

      {conferenceReg?.status === 'approved' && (
        <section className="profile-conference-card" aria-labelledby="profile-conference-heading">
          <div>
            <span className="profile-conference-eyebrow">Conference Registration · Approved</span>
            <h3 id="profile-conference-heading" className="profile-conference-heading">Your VIPLAV Delegate Details</h3>
            <div className="profile-srcid-row">
              <span className="profile-srcid-label">SRC ID</span>
              <strong className="profile-srcid-value">{conferenceReg.srcId}</strong>
            </div>
          </div>
          <div className="profile-conference-actions">
            <ViewConferenceIdCardButton className="profile-conference-btn profile-id-card-btn" />
            <a href="https://chat.whatsapp.com/KXApATqIm4rKRQ9ojYjWch" target="_blank" rel="noreferrer" className="profile-conference-btn profile-whatsapp-btn">
              Join WhatsApp Group
            </a>
          </div>
        </section>
      )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ CONFERENCE REGISTRATION BANNER */
function ConferenceRegBanner() {
  const [confReg, setConfReg] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchReg = api.get('/conference-registration').catch(() => ({ data: null }));
    const fetchConfig = api.get('/conference-registration/config').catch(() => ({ data: null }));

    Promise.all([fetchReg, fetchConfig])
      .then(([regRes, cfgRes]) => {
        setConfReg(regRes.data || null);
        setConfig(cfgRes.data || null);
      })
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
    const tierList = config?.tiers?.map((t) => `${t.title}: ₹${t.amount}`).join(', ');
    const msg = tierList
      ? `You haven't registered yet. Complete registration (${tierList}) to unlock event registration.`
      : "You haven't registered for the conference yet. Complete registration to unlock event registration.";

    return (
      <div className="confbanner confbanner-none">
        <div className="confbanner-body">
          <span className="confbanner-label">Conference Registration</span>
          <p className="confbanner-msg">{msg}</p>
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
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Link to="/register" className="confbanner-btn outlined">Register for Events</Link>
          <ViewConferenceIdCardButton />
          <a href="https://chat.whatsapp.com/KXApATqIm4rKRQ9ojYjWch" target="_blank" rel="noreferrer" className="confbanner-btn whatsapp">
            Join WhatsApp Group
          </a>
        </div>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════ SUBMISSION UPLOAD */
function SubmissionUploadForm({ registrationId, event, onDone }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = React.useRef(null);

  const validateAndSetFiles = (selectedFiles, append = false) => {
    const isMultiple = event?.pdfUploadMode === 'multiple';
    const fileList = isMultiple ? Array.from(selectedFiles) : [selectedFiles[0]];
    const maxMB = event?.maxFileSizeMB || 10;

    setFiles((prevFiles) => {
      const validFiles = isMultiple && append ? [...prevFiles] : [];

      for (const f of fileList) {
        if (!f) continue;
        if (f.type !== 'application/pdf') {
          setError('Please select PDF files only.');
          return prevFiles;
        }
        if (f.size > maxMB * 1024 * 1024) {
          setError(`File "${f.name}" exceeds the ${maxMB}MB limit.`);
          return prevFiles;
        }
        if (validFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
          continue;
        }
        validFiles.push(f);
      }

      setError('');
      return validFiles;
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      validateAndSetFiles(selectedFiles, true);
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
    const selectedFiles = e.dataTransfer.files;
    if (selectedFiles && selectedFiles.length > 0) {
      validateAndSetFiles(selectedFiles, true);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (files.length === 0) { setError('Please select a file.'); return; }
    setBusy(true);
    setError('');
    const fd = new FormData();
    if (files.length === 1) {
      fd.append('file', files[0]);
    } else {
      files.forEach((file) => {
        fd.append('files', file);
      });
    }
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
        <label>Upload File{event?.pdfUploadMode === 'multiple' ? 's' : ''} (PDF)</label>
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
            multiple={event?.pdfUploadMode === 'multiple'}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {files.length > 0 ? (
            <div className="cr-file-thumb cr-file-thumb-pdf" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'default', width: '100%' }} onClick={(e) => e.stopPropagation()}>
              {files.map((file, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="cr-pdf-icon">PDF</span>
                    <span className="cr-file-name" style={{ fontSize: '0.85rem' }}>{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', padding: '0 4px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {event?.pdfUploadMode === 'multiple' && (
                <button
                  type="button"
                  className="reg-action-btn"
                  onClick={() => fileRef.current?.click()}
                  style={{ marginTop: '8px', fontSize: '0.8rem', padding: '4px 8px' }}
                >
                  + Add another file
                </button>
              )}
            </div>
          ) : (
            <div className="cr-upload-placeholder">
              <span className="cr-upload-icon">⬆</span>
              <span>Click to upload {event?.pdfUploadMode === 'multiple' ? 'PDFs' : 'PDF'} (max {event?.maxFileSizeMB || 10} MB per file)</span>
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
  const [submission, setSubmission]         = useState(null);
  const [replacingFileKey, setReplacingFileKey] = useState(null);
  const [busy, setBusy]                     = useState(false);

  const replaceFileRef = React.useRef(null);
  const addFileRef     = React.useRef(null);

  const event    = reg.eventId;
  const canEdit  = ['registered', 'waiting_submission'].includes(reg.status) && event?.type === 'team';
  const canSubmit = ['waiting_submission', 'submitted'].includes(reg.status) && event?.fileUploadRequired;

  useEffect(() => {
    if (['submitted', 'completed'].includes(reg.status)) {
      api.get(`/submissions/${reg._id}`)
        .then((res) => setSubmission(res.data))
        .catch(() => {});
    }
  }, [reg._id, reg.status]);

  const triggerReplace = (fileKey) => {
    setReplacingFileKey(fileKey);
    replaceFileRef.current?.click();
  };

  const handleReplaceFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }
    const maxMB = event?.maxFileSizeMB || 10;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File size exceeds the ${maxMB}MB limit.`);
      return;
    }

    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('fileKey', replacingFileKey);

    try {
      await api.uploadPut(`/submissions/${reg._id}/replace-file`, fd);
      onRefresh();
      // Fetch submission again to update display
      api.get(`/submissions/${reg._id}`)
        .then((res) => setSubmission(res.data))
        .catch(() => {});
    } catch (err) {
      alert(err.message || 'Replace failed.');
    } finally {
      setBusy(false);
      setReplacingFileKey(null);
      e.target.value = '';
    }
  };

  const triggerAddFile = () => {
    addFileRef.current?.click();
  };

  const handleAddFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }
    const maxMB = event?.maxFileSizeMB || 10;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File size exceeds the ${maxMB}MB limit.`);
      return;
    }

    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      await api.upload(`/submissions/${reg._id}/add-file`, fd);
      onRefresh();
      // Fetch submission again to update display
      api.get(`/submissions/${reg._id}`)
        .then((res) => setSubmission(res.data))
        .catch(() => {});
    } catch (err) {
      alert(err.message || 'Add file failed.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="reg-card">
      <input
        ref={replaceFileRef}
        type="file"
        accept="application/pdf"
        onChange={handleReplaceFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={addFileRef}
        type="file"
        accept="application/pdf"
        onChange={handleAddFileChange}
        style={{ display: 'none' }}
      />

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
        {reg.participantType && (
          <div className="reg-meta-item">
            <span className="reg-meta-label">Participant Type</span>
            <span className="reg-meta-value" style={{ textTransform: 'capitalize' }}>{reg.participantType}</span>
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
        {submission && (
          <div className="reg-meta-item" style={{ gridColumn: '1 / -1' }}>
            <span className="reg-meta-label">Uploaded Files</span>
            <div className="reg-meta-value" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {submission.files && submission.files.length > 0 ? (
                submission.files.map((file, i) => (
                  <div key={file.fileKey || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)' }}>
                    <a href={file.signedFileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                      {file.fileName || 'Download PDF'}
                    </a>
                    {canSubmit && (
                      <button
                        type="button"
                        className="tbl-btn"
                        onClick={() => triggerReplace(file.fileKey)}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}
                      >
                        Replace
                      </button>
                    )}
                  </div>
                ))
              ) : (
                submission.signedFileUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)' }}>
                    <a href={submission.signedFileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                      {submission.fileName || 'Download PDF'}
                    </a>
                    {canSubmit && (
                      <button
                        type="button"
                        className="tbl-btn"
                        onClick={() => triggerReplace(submission.fileKey)}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}
                      >
                        Replace
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
            {busy && (
              <div style={{ marginTop: '10px', color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="auth-spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'auth-spin 0.6s linear infinite' }} />
                Uploading file...
              </div>
            )}
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
            <>
              {event?.pdfUploadMode === 'multiple' && submission && (
                <button className="reg-action-btn primary" onClick={triggerAddFile} disabled={busy}>
                  + Add PDF
                </button>
              )}
              <button className="reg-action-btn" onClick={() => { setShowSubmission((v) => !v); setShowEdit(false); }} disabled={busy}>
                {showSubmission ? 'Cancel' : (reg.status === 'submitted' ? '↺ Replace All Files' : 'Upload Submission')}
              </button>
            </>
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
          event={event}
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
