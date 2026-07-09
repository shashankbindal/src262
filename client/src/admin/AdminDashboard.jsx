import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError, API_BASE } from '../lib/api.js';
import './AdminDashboard.css';

/* ── Event registration status labels ── */
const EVENT_STATUS_LABELS = {
  registered:         'Registered',
  waiting_submission: 'Awaiting Submission',
  submitted:          'Submitted',
  completed:          'Completed',
};

const EVENT_STATUS_TABS = [
  { id: 'registered',         label: 'Registered' },
  { id: 'waiting_submission', label: 'Awaiting Submission' },
  { id: 'submitted',          label: 'Submissions' },
  { id: 'completed',          label: 'Completed' },
];

/* ══════════════════════════════════════ CONFERENCE REGISTRATION COMPONENTS */

/* ── Conf Reg: Reject Modal ── */
function ConfRejectModal({ confRegId, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');

  const submit = async () => {
    if (!reason.trim()) { setError('Rejection reason is required.'); return; }
    setBusy(true);
    try {
      await api.patch(`/admin/conference-registrations/${confRegId}/decision`, {
        action: 'reject',
        reason: reason.trim(),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reject.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-bg" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Reject Conference Registration</h3>
        <p>Provide a clear reason so the participant knows what to fix when re-submitting.</p>
        {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}
        <textarea
          placeholder="e.g. Screenshot is unclear. Please re-upload a clearer image."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
        <div className="admin-modal-actions">
          <button className="tbl-btn" onClick={onClose}>Cancel</button>
          <button className="tbl-btn reject" onClick={submit} disabled={busy}>
            {busy ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Conf Reg: Approve Modal ── */
function ConfApproveModal({ confRegId, onClose, onDone }) {
  const [srcId, setSrcId]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');

  const submit = async () => {
    if (!srcId.trim()) { setError('SRC ID is required.'); return; }
    setBusy(true);
    try {
      await api.patch(`/admin/conference-registrations/${confRegId}/decision`, {
        action: 'approve',
        srcId: srcId.trim(),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to approve.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-bg" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Approve Conference Registration</h3>
        <p>Assign a unique SRC ID. This cannot be changed after approval.</p>
        {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}
        <input
          className="admin-modal-input"
          type="text"
          placeholder="e.g. SRC-2026-001"
          value={srcId}
          onChange={(e) => setSrcId(e.target.value)}
          autoFocus
        />
        <div className="admin-modal-actions">
          <button className="tbl-btn" onClick={onClose}>Cancel</button>
          <button className="tbl-btn approve" onClick={submit} disabled={busy}>
            {busy ? 'Approving…' : 'Confirm Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Conf Reg: Full detail modal (includes Aadhaar/passport number) ── */
function ConfDetailModal({ confRegId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/conference-registrations/${confRegId}/detail`)
      .then((res) => setDetail(res.data))
      .catch(() => setError('Failed to load participant details.'))
      .finally(() => setLoading(false));
  }, [confRegId]);

  const u = detail?.userId || {};

  const Row = ({ label, value }) => (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '—'}</span>
    </div>
  );

  return (
    <div className="admin-modal-bg" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '660px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3>Participant Details</h3>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}><div className="auth-spinner" style={{ margin: '0 auto' }} /></div>
        ) : error ? (
          <div className="auth-error">{error}</div>
        ) : (
          <>
            <div className="detail-grid">
              <Row label="Full Name" value={u.name} />
              <Row label="Email" value={u.email} />
              <Row label="Phone" value={u.phone ? `${u.phoneCountryCode || ''} ${u.phone}` : ''} />
              <Row label="Date of Birth" value={u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString('en-IN') : ''} />
              <Row label="Gender" value={u.gender} />
              <Row label="Institute" value={u.college} />
              <Row label="Course" value={u.course} />
              <Row label="Year of Study" value={u.yearOfStudy} />
              <Row label="Student Chapter" value={u.studentChapterName} />
              <Row label="Faculty Advisor" value={u.facultyAdvisorName} />
              <Row label="Faculty Advisor Email" value={u.facultyAdvisorEmail} />
              <Row label={u.idType === 'passport' ? 'Passport Number' : 'Aadhaar Number'} value={u.idNumber} />
              <Row label="AIChE ID" value={u.aicheId} />
              <Row label="City" value={u.city} />
              <Row label="State" value={u.state} />
              <Row label="Country" value={u.country} />
              <Row label="Merch Size" value={u.merchSize} />
              <Row label="Accommodation" value={detail.needsAccommodation ? 'Yes' : 'No'} />
              <Row label="Registration Fee" value={`₹${detail.registrationFee ?? '—'}`} />
              <Row label="Transaction ID" value={detail.transactionId} />
              <Row label="Status" value={detail.status} />
              <Row label="SRC ID" value={detail.srcId} />
              <Row label="Reference Number" value={detail.referenceNumber} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              {detail.paymentScreenshotSignedUrl && (
                <a className="tbl-btn" href={detail.paymentScreenshotSignedUrl} target="_blank" rel="noreferrer">
                  Payment Screenshot ↗
                </a>
              )}
              {u.universityIdCardSignedUrl && (
                <a className="tbl-btn" href={u.universityIdCardSignedUrl} target="_blank" rel="noreferrer">
                  University ID Card ↗
                </a>
              )}
            </div>
          </>
        )}
        <div className="admin-modal-actions">
          <button className="tbl-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Conf Reg: Row in table ── */
function ConfRegRow({ confReg, onRefresh }) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject]   = useState(false);
  const [showDetail, setShowDetail]   = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  const viewScreenshot = async () => {
    if (screenshotUrl) { window.open(screenshotUrl, '_blank'); return; }
    /* Open the tab synchronously within the click gesture so popup blockers
     * don't block it once the URL resolves after the await below. */
    const tab = window.open('', '_blank');
    try {
      const res = await api.get(`/admin/conference-registrations/${confReg._id}/screenshot`);
      setScreenshotUrl(res.data?.signedUrl);
      if (tab) tab.location = res.data?.signedUrl;
    } catch {
      if (tab) tab.close();
      alert('Could not load screenshot.');
    }
  };

  const u = confReg.userId || {};

  return (
    <>
      <tr>
        <td className="name-cell">{u.name || '—'}</td>
        <td>{u.email || '—'}</td>
        <td>{u.college || '—'}</td>
        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          {confReg.transactionId || '—'}
        </td>
        <td>{confReg.srcId ? <strong style={{ color: 'var(--primary)' }}>{confReg.srcId}</strong> : '—'}</td>
        <td>{confReg.needsAccommodation ? 'Yes' : 'No'}</td>
        <td>₹{confReg.registrationFee ?? '—'}</td>
        <td>{new Date(confReg.createdAt).toLocaleDateString('en-IN')}</td>
        <td>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="tbl-btn" onClick={() => setShowDetail(true)}>View Details</button>
            {confReg.paymentScreenshotUrl && (
              <button className="tbl-btn" onClick={viewScreenshot}>Screenshot</button>
            )}
            {confReg.status === 'pending' && (
              <>
                <button className="tbl-btn approve" onClick={() => setShowApprove(true)}>Approve</button>
                <button className="tbl-btn reject" onClick={() => setShowReject(true)}>Reject</button>
              </>
            )}
          </div>
        </td>
      </tr>

      {showDetail && (
        <ConfDetailModal confRegId={confReg._id} onClose={() => setShowDetail(false)} />
      )}
      {showApprove && (
        <ConfApproveModal
          confRegId={confReg._id}
          onClose={() => setShowApprove(false)}
          onDone={() => { setShowApprove(false); onRefresh(); }}
        />
      )}
      {showReject && (
        <ConfRejectModal
          confRegId={confReg._id}
          onClose={() => setShowReject(false)}
          onDone={() => { setShowReject(false); onRefresh(); }}
        />
      )}
    </>
  );
}

/* ── Conference Registrations Section ── */
function ConfRegSection({ counts }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState('');

  const CONF_TABS = [
    { id: 'pending',  label: 'Pending',  count: counts?.pending  || 0 },
    { id: 'approved', label: 'Approved', count: counts?.approved || 0 },
    { id: 'rejected', label: 'Rejected', count: counts?.rejected || 0 },
  ];

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api.get(`/admin/conference-registrations?status=${activeTab}&limit=100`)
      .then((res) => setRows(res.data?.docs || []))
      .catch(() => { setRows([]); setLoadError('Failed to load registrations.'); })
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="admin-event-section">
      <h2 className="admin-event-title">
        Conference Registrations
        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 400 }}>
          {(counts?.total || 0)} total
        </span>
      </h2>

      <div className="export-bar">
        <a
          href={`${API_BASE}/admin/conference-registrations/export/csv?status=${activeTab}`}
          className="export-btn"
          target="_blank"
          rel="noreferrer"
        >
          ↓ Export CSV
        </a>
      </div>

      <div className="admin-status-tabs">
        {CONF_TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-status-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}{t.count > 0 ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}><div className="auth-spinner" style={{ margin: '0 auto' }} /></div>
      ) : loadError ? (
        <div className="admin-empty">{loadError}</div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">No registrations in this category.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>Transaction ID</th>
                <th>SRC ID</th>
                <th>Accommodation</th>
                <th>Fee Paid</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => <ConfRegRow key={r._id} confReg={r} onRefresh={load} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════ EVENT REGISTRATION COMPONENTS */

/* ── Submission download + review cell ── */
function SubmissionCell({ registrationId, status, onRefresh }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchSubmission = async () => {
    if (submission) return submission;
    const res = await api.get(`/admin/registrations/${registrationId}/submission-file`);
    setSubmission(res.data);
    return res.data;
  };

  const download = async () => {
    const tab = window.open('', '_blank');
    setLoading(true);
    try {
      const sub = await fetchSubmission();
      if (tab) tab.location = sub?.signedUrl;
    } catch {
      if (tab) tab.close();
      alert('Could not load submission file.');
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    if (!window.confirm('Mark this submission as completed?')) return;
    setCompleting(true);
    try {
      const sub = await fetchSubmission();
      await api.patch(`/admin/submissions/${sub._id}/complete`, {});
      onRefresh?.();
    } catch {
      alert('Could not mark submission as completed.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="tbl-btn" onClick={download} disabled={loading}>
        {loading ? '…' : 'Download'}
      </button>
      {status !== 'completed' && (
        <button className="tbl-btn approve" onClick={markComplete} disabled={completing}>
          {completing ? '…' : 'Mark Complete'}
        </button>
      )}
    </div>
  );
}

/* ── Event Registration Row ── */
function RegRow({ reg, onRefresh }) {
  const participant = reg.participantSnapshot || reg.userId || {};
  const team        = reg.teamId;

  if (team) {
    return (
      <>
        <tr className="team-header-row" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <td colSpan="7" style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--primary)' }}>
            Team: {team.teamName} <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>({(team.members?.length || 0) + 1} members)</span>
          </td>
        </tr>
        <tr>
          <td className="name-cell">
            {participant.name || '—'}
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(56, 189, 114, 0.2)', color: 'var(--primary)', borderRadius: '4px', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leader</span>
          </td>
          <td>{participant.email || '—'}</td>
          <td>{participant.college || '—'}</td>
          <td>—</td>
          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
            {reg.srcId || '—'}
          </td>
          <td>{new Date(reg.createdAt).toLocaleDateString('en-IN')}</td>
          <td>
            {['submitted', 'completed'].includes(reg.status) && (
              <SubmissionCell registrationId={reg._id} status={reg.status} onRefresh={onRefresh} />
            )}
          </td>
        </tr>
        {team.members?.map((m) => (
          <tr key={m.userId || m._id || m.email} style={{ opacity: 0.85 }}>
            <td className="name-cell" style={{ paddingLeft: '24px' }}>
              ↳ {m.name || '—'}
            </td>
            <td>{m.email || '—'}</td>
            <td>{m.college || '—'}</td>
            <td>—</td>
            <td>—</td>
            <td>—</td>
            <td>—</td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <tr>
      <td className="name-cell">{participant.name || '—'}</td>
      <td>{participant.email || '—'}</td>
      <td>{participant.college || '—'}</td>
      <td>—</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
        {reg.srcId || '—'}
      </td>
      <td>{new Date(reg.createdAt).toLocaleDateString('en-IN')}</td>
      <td>
        {reg.status === 'submitted' && <SubmissionCell registrationId={reg._id} />}
      </td>
    </tr>
  );
}

/* ── Event Section with tabs ── */
function EventSection({ evt }) {
  const [activeTab, setActiveTab] = useState('registered');
  const [regs, setRegs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api.get(`/admin/events/${evt.event._id}/registrations?status=${activeTab}&limit=100`)
      .then((res) => setRegs(res.data?.docs || []))
      .catch(() => { setRegs([]); setLoadError('Failed to load registrations.'); })
      .finally(() => setLoading(false));
  }, [evt.event._id, activeTab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="admin-event-section">
      <h2 className="admin-event-title">
        {evt.event.name}
        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 400 }}>
          {evt.total} registrations
        </span>
      </h2>

      <div className="export-bar">
        <a
          href={`${API_BASE}/admin/events/${evt.event._id}/export/csv?status=${activeTab}`}
          className="export-btn"
          target="_blank"
          rel="noreferrer"
        >
          ↓ CSV
        </a>
        <a
          href={`${API_BASE}/admin/events/${evt.event._id}/export/excel?status=${activeTab}`}
          className="export-btn"
          target="_blank"
          rel="noreferrer"
        >
          ↓ Excel
        </a>
      </div>

      <div className="admin-status-tabs">
        {EVENT_STATUS_TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-status-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {evt.counts?.[t.id] ? ` (${evt.counts[t.id]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}><div className="auth-spinner" style={{ margin: '0 auto' }} /></div>
      ) : loadError ? (
        <div className="admin-empty">{loadError}</div>
      ) : regs.length === 0 ? (
        <div className="admin-empty">No registrations in this category.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>Team</th>
                <th>SRC ID</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((r) => <RegRow key={r._id} reg={r} onRefresh={load} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════ EVENT MANAGEMENT COMPONENTS */

const EMPTY_EVENT_FORM = {
  name: '', slug: '', description: '', type: 'solo',
  registrationDeadline: '', submissionDeadline: '',
  fileUploadRequired: false, maxFileSizeMB: 10,
  minTeamSize: 2, maxTeamSize: 4, registrationEnabled: true,
};

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── Event create/edit modal ── */
function EventFormModal({ event, onClose, onDone }) {
  const isEdit = Boolean(event);
  const [form, setForm] = useState(() => event ? {
    name: event.name || '',
    slug: event.slug || '',
    description: event.description || '',
    type: event.type || 'solo',
    registrationDeadline: toDatetimeLocal(event.registrationDeadline),
    submissionDeadline: toDatetimeLocal(event.submissionDeadline),
    fileUploadRequired: Boolean(event.fileUploadRequired),
    maxFileSizeMB: event.maxFileSizeMB || 10,
    minTeamSize: event.minTeamSize || 2,
    maxTeamSize: event.maxTeamSize || 4,
    registrationEnabled: event.registrationEnabled !== false,
  } : EMPTY_EVENT_FORM);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async () => {
    if (!form.name.trim()) { setError('Event name is required.'); return; }
    if (!form.registrationDeadline) { setError('Registration deadline is required.'); return; }

    setBusy(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        type: form.type,
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        submissionDeadline: form.submissionDeadline ? new Date(form.submissionDeadline).toISOString() : undefined,
        fileUploadRequired: form.fileUploadRequired,
        maxFileSizeMB: Number(form.maxFileSizeMB) || 10,
        registrationEnabled: form.registrationEnabled,
      };
      if (form.type === 'team') {
        body.minTeamSize = Number(form.minTeamSize) || 1;
        body.maxTeamSize = Number(form.maxTeamSize) || body.minTeamSize;
      }

      if (isEdit) {
        await api.patch(`/admin/events/${event._id}`, body);
      } else {
        await api.post('/admin/events', body);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save event.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-bg" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <h3>{isEdit ? 'Edit Event' : 'Create Event'}</h3>
        {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input className="admin-modal-input" name="name" placeholder="Event name" value={form.name} onChange={handle} autoFocus />
          <input className="admin-modal-input" name="slug" placeholder="Slug (auto-generated if blank)" value={form.slug} onChange={handle} />
          <textarea className="admin-modal-input" name="description" placeholder="Description" value={form.description} onChange={handle} rows={2} />

          <label className="auth-label">Type</label>
          <select className="admin-modal-input" name="type" value={form.type} onChange={handle}>
            <option value="solo">Solo</option>
            <option value="team">Team</option>
          </select>

          <label className="auth-label">Registration Deadline</label>
          <input className="admin-modal-input" type="datetime-local" name="registrationDeadline" value={form.registrationDeadline} onChange={handle} />

          <label className="auth-label">Submission Deadline (optional)</label>
          <input className="admin-modal-input" type="datetime-local" name="submissionDeadline" value={form.submissionDeadline} onChange={handle} />

          {form.type === 'team' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="auth-label">Min team size</label>
                <input className="admin-modal-input" type="number" min="1" name="minTeamSize" value={form.minTeamSize} onChange={handle} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="auth-label">Max team size</label>
                <input className="admin-modal-input" type="number" min="1" name="maxTeamSize" value={form.maxTeamSize} onChange={handle} />
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <input type="checkbox" name="fileUploadRequired" checked={form.fileUploadRequired} onChange={handle} />
            Requires file submission (PDF)
          </label>

          {form.fileUploadRequired && (
            <>
              <label className="auth-label">Max file size (MB)</label>
              <input className="admin-modal-input" type="number" min="1" max="100" name="maxFileSizeMB" value={form.maxFileSizeMB} onChange={handle} />
            </>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <input type="checkbox" name="registrationEnabled" checked={form.registrationEnabled} onChange={handle} />
            Registrations open
          </label>
        </div>

        <div className="admin-modal-actions">
          <button className="tbl-btn" onClick={onClose}>Cancel</button>
          <button className="tbl-btn approve" onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Event Management Section ── */
function EventManagementSection({ events, onRefresh }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const deleteEvent = async (evt) => {
    if (!window.confirm(
      `Delete "${evt.name}"? This permanently removes ALL registrations, teams, and submissions for this event. This cannot be undone.`
    )) return;

    setDeletingId(evt._id);
    try {
      await api.delete(`/admin/events/${evt._id}`);
      onRefresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete event.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-event-section">
      <h2 className="admin-event-title">
        Event Management
        <button className="tbl-btn approve" onClick={() => setShowCreate(true)}>+ Create Event</button>
      </h2>

      {events.length === 0 ? (
        <div className="admin-empty">No events yet. Create one to get started.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Registration Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr key={evt._id}>
                  <td className="name-cell">{evt.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{evt.type}</td>
                  <td>{new Date(evt.registrationDeadline).toLocaleString('en-IN')}</td>
                  <td>{evt.registrationEnabled ? 'Open' : 'Closed'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="tbl-btn" onClick={() => setEditingEvent(evt)}>Edit</button>
                      <button
                        className="tbl-btn reject"
                        onClick={() => deleteEvent(evt)}
                        disabled={deletingId === evt._id}
                      >
                        {deletingId === evt._id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <EventFormModal
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); onRefresh(); }}
        />
      )}
      {editingEvent && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onDone={() => { setEditingEvent(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════ USER MANAGEMENT COMPONENTS */

/* ── Add user modal ── */
function UserFormModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/admin/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-bg" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add User</h3>
        {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input className="admin-modal-input" name="name" placeholder="Full name" value={form.name} onChange={handle} autoFocus />
          <input className="admin-modal-input" name="email" type="email" placeholder="Email" value={form.email} onChange={handle} />
          <input className="admin-modal-input" name="password" type="password" placeholder="Password (min 8 chars, 1 uppercase, 1 number)" value={form.password} onChange={handle} />
          <label className="auth-label">Role</label>
          <select className="admin-modal-input" name="role" value={form.role} onChange={handle}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="admin-modal-actions">
          <button className="tbl-btn" onClick={onClose}>Cancel</button>
          <button className="tbl-btn approve" onClick={submit} disabled={busy}>
            {busy ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── User Management Section ── */
function UserManagementSection() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}&limit=100` : '?limit=100';
    api.get(`/admin/users${qs}`)
      .then((res) => setUsers(res.data?.docs || []))
      .catch(() => { setUsers([]); setLoadError('Failed to load users.'); })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const deleteUser = async (u) => {
    if (!window.confirm(
      `Delete ${u.name} (${u.email})? This permanently removes their conference registration, event registrations, and team memberships. This cannot be undone.`
    )) return;

    setDeletingId(u._id);
    try {
      await api.delete(`/admin/users/${u._id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-event-section">
      <h2 className="admin-event-title">
        User Management
        <button className="tbl-btn approve" onClick={() => setShowCreate(true)}>+ Add User</button>
      </h2>

      <input
        className="admin-modal-input"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '16px', maxWidth: '320px' }}
      />

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}><div className="auth-spinner" style={{ margin: '0 auto' }} /></div>
      ) : loadError ? (
        <div className="admin-empty">{loadError}</div>
      ) : users.length === 0 ? (
        <div className="admin-empty">No users found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="name-cell">{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>{u.isEmailVerified ? 'Yes' : 'No'}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button
                      className="tbl-btn reject"
                      onClick={() => deleteUser(u)}
                      disabled={deletingId === u._id}
                    >
                      {deletingId === u._id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <UserFormModal
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ ADMIN ROOT */
export default function AdminDashboard() {
  const { logout } = useAuth();
  const [data, setData]       = useState({ conferenceRegistrations: null, events: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadOverview = useCallback(() => {
    api.get('/admin/overview')
      .then((res) => { setData(res.data || { conferenceRegistrations: null, events: [] }); setLoadError(''); })
      .catch(() => setLoadError('Failed to load dashboard data. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const confCounts = data.conferenceRegistrations || {};
  const events     = data.events || [];

  return (
    <div className="admin-layout">
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>VIPLAV '26 — Registration Management</p>
          </div>
          <button
            className="tbl-btn"
            onClick={async () => { await logout(); window.location.href = '/'; }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="admin-body">
        {loading ? (
          <div className="dash-loader"><div className="auth-spinner" /></div>
        ) : loadError ? (
          <div className="admin-empty">{loadError}</div>
        ) : (
          <>
            {/* Overview tiles */}
            <div className="overview-grid">
              {/* Conference registrations tile */}
              <div className="overview-card" style={{ borderTop: '3px solid var(--primary)' }}>
                <div className="overview-card-event">Conference Registrations</div>
                <div className="overview-counts">
                  <div className="oc-item">
                    <span className="oc-label">Total</span>
                    <span className="oc-value">{confCounts.total || 0}</span>
                  </div>
                  <div className="oc-item">
                    <span className="oc-label">Pending</span>
                    <span className="oc-value" style={{ color: '#60a5fa' }}>{confCounts.pending || 0}</span>
                  </div>
                  <div className="oc-item">
                    <span className="oc-label">Approved</span>
                    <span className="oc-value" style={{ color: 'var(--primary)' }}>{confCounts.approved || 0}</span>
                  </div>
                  <div className="oc-item">
                    <span className="oc-label">Rejected</span>
                    <span className="oc-value" style={{ color: '#f87171' }}>{confCounts.rejected || 0}</span>
                  </div>
                </div>
              </div>

              {/* Per-event tiles */}
              {events.map(({ event, counts, total }) => (
                <div className="overview-card" key={event._id}>
                  <div className="overview-card-event">{event.name}</div>
                  <div className="overview-counts">
                    <div className="oc-item">
                      <span className="oc-label">Total</span>
                      <span className="oc-value">{total}</span>
                    </div>
                    <div className="oc-item">
                      <span className="oc-label">Waiting</span>
                      <span className="oc-value" style={{ color: '#60a5fa' }}>{counts.waiting_submission || 0}</span>
                    </div>
                    <div className="oc-item">
                      <span className="oc-label">Submitted</span>
                      <span className="oc-value" style={{ color: 'var(--primary)' }}>{counts.submitted || 0}</span>
                    </div>
                    <div className="oc-item">
                      <span className="oc-label">Completed</span>
                      <span className="oc-value" style={{ color: '#6ee7b7' }}>{counts.completed || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Event management (create / edit / delete events) */}
            <EventManagementSection events={events.map((e) => e.event)} onRefresh={loadOverview} />

            {/* Conference registrations management section */}
            <ConfRegSection counts={confCounts} />

            {/* User management (add / delete accounts) */}
            <UserManagementSection />

            {/* Per-event sections */}
            {events.map((item) => (
              <EventSection key={item.event._id} evt={item} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
