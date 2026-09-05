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

function participantTypeFromEmail(email) {
  return String(email || '').trim().toLowerCase().endsWith('@rgipt.ac.in') ? 'internal' : 'external';
}

function participantTypeLabel(type) {
  return type === 'internal' ? 'Internal' : 'External';
}

/* ── Conference registration tier labels ── */
const TIER_LABELS = {
  base: 'Registration Only',
  fooding: 'Registration + Fooding',
  accommodation: 'Registration + Accommodation & Fooding',
  rgipt_events: 'Conference Events (RGIPT Student)',
  rgipt_kit: 'Conference Events + Registration Kit (RGIPT Student)',
  rgipt_fooding: 'Conference Events + Registration Kit + Fooding (RGIPT Student)',
};

function tierLabel(reg) {
  return TIER_LABELS[reg?.registrationTier] || (reg?.needsAccommodation ? TIER_LABELS.accommodation : TIER_LABELS.base);
}

const TIER_LABELS_SHORT = {
  base: 'Registration Only',
  fooding: 'Fooding',
  accommodation: 'Accommodation',
  rgipt_events: 'RGIPT Events',
  rgipt_kit: 'RGIPT Kit',
  rgipt_fooding: 'RGIPT Kit+Fooding',
};

function tierLabelShort(reg) {
  return TIER_LABELS_SHORT[reg?.registrationTier] || (reg?.needsAccommodation ? TIER_LABELS_SHORT.accommodation : TIER_LABELS_SHORT.base);
}

/* Toolbar: college filter input + "Resend Email to Selected" bulk action.
 * Shared by the conference and event registration tables. */
function AdminSelectionBar({ college, setCollege, selectedIds, endpoint, onDone }) {
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [msg, setMsg]     = useState('');
  const ids = [...selectedIds];

  const send = async () => {
    if (!ids.length) return;
    if (!window.confirm(`Resend the confirmation email to ${ids.length} selected participant(s)?`)) return;
    setState('sending'); setMsg('');
    try {
      const res = await api.post(endpoint, { ids });
      setState('done');
      setMsg(res.message || `Resent to ${ids.length}.`);
      onDone?.();
    } catch (err) {
      setState('error');
      setMsg(err instanceof ApiError ? err.message : 'Failed to resend.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: '4px 0 12px' }}>
      <input
        type="text"
        value={college}
        onChange={(e) => setCollege(e.target.value)}
        placeholder="Filter by college…"
        className="admin-modal-input"
        style={{ maxWidth: '240px', margin: 0 }}
      />
      {college && (
        <button className="tbl-btn" onClick={() => setCollege('')}>Clear</button>
      )}
      <button
        className="export-btn"
        disabled={!ids.length || state === 'sending'}
        onClick={send}
        title={!ids.length ? 'Select rows first' : ''}
      >
        {state === 'sending' ? 'Sending…' : `✉ Resend Email to Selected (${ids.length})`}
      </button>
      {msg && (
        <span style={{ fontSize: '0.8rem', color: state === 'error' ? '#ef4444' : 'var(--primary)' }}>{msg}</span>
      )}
    </div>
  );
}

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
    <div className="admin-modal-bg" onClick={onClose} data-lenis-prevent>
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
    <div className="admin-modal-bg" onClick={onClose} data-lenis-prevent>
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
    <div className="admin-modal-bg" onClick={onClose} data-lenis-prevent>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '660px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3>Participant Details</h3>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}><div className="auth-spinner" style={{ margin: '0 auto' }} /></div>
        ) : error ? (
          <div className="auth-error">{error}</div>
        ) : (
          <>
            {detail.photoUrl && (
              <img
                src={detail.photoUrl}
                alt={u.name || 'Participant photo'}
                style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-medium)', marginBottom: '16px' }}
              />
            )}
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
              <Row label="Participant Type" value={detail.participantType ? detail.participantType.toUpperCase() : 'EXTERNAL'} />
              <Row label="Registration Type" value={tierLabel(detail)} />
              <Row label="Registration Fee" value={`₹${detail.registrationFee ?? '—'}`} />
              <Row label="Transaction ID" value={detail.transactionId} />
              <Row label="Status" value={detail.status} />
              <Row label="SRC ID" value={detail.srcId} />
              <Row label="Reference Number" value={detail.referenceNumber} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              {detail.photoUrl && (
                <a className="tbl-btn approve" href={`${API_BASE}/admin/conference-registrations/${confRegId}/id-card-preview`} target="_blank" rel="noreferrer">
                  View Conference ID Card ↗
                </a>
              )}
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
function ConfRegRow({ confReg, onRefresh, selected, onToggle }) {
  const [issuing, setIssuing] = React.useState(false);
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
  const issueCertificate = async () => {
    setIssuing(true);
    try { await api.post(`/admin/conference-registrations/${confReg._id}/certificate/issue`); onRefresh(); }
    catch (err) { alert(err.message || 'Certificate issue failed'); }
    finally { setIssuing(false); }
  };

  const u = confReg.userId || {};
  /* Fall back to deriving internal/external from the email domain for legacy
   * rows saved before participantType existed (RGIPT accounts are internal). */
  const participantType = confReg.participantType
    || ((u.email || '').toLowerCase().endsWith('@rgipt.ac.in') ? 'internal' : 'external');

  return (
    <>
      <tr>
        <td style={{ textAlign: 'center' }}>
          <input type="checkbox" checked={selected} onChange={() => onToggle(confReg._id)} />
        </td>
        <td className="name-cell">{u.name || '—'}</td>
        <td>{u.email || '—'}</td>
        <td>{u.college || '—'}</td>
        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          {confReg.transactionId || '—'}
        </td>
        <td style={{ textTransform: 'capitalize' }}>{participantType}</td>
        <td>{confReg.srcId ? <strong style={{ color: 'var(--primary)' }}>{confReg.srcId}</strong> : '—'}</td>
        <td>{tierLabelShort(confReg)}</td>
        <td>₹{confReg.registrationFee ?? '—'}</td>
        <td>{new Date(confReg.createdAt).toLocaleDateString('en-IN')}</td>
        <td>
          <strong style={{ color: confReg.certificateIssued ? 'var(--primary)' : 'var(--text-muted)' }}>
            {confReg.certificateIssued ? 'Issued' : 'Not Issued'}
          </strong>
        </td>
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
            <button className="tbl-btn" onClick={() => setShowDetail(true)}>View Details</button>
            {confReg.certificateIssued ? (
              <>
                <a className="tbl-btn approve" href={`${API_BASE}/admin/conference-registrations/${confReg._id}/certificate`} target="_blank" rel="noreferrer">View Certificate</a>
                <button className="tbl-btn reject" onClick={async () => { if (!window.confirm('Withdraw this certificate?')) return; setIssuing(true); try { await api.post(`/admin/conference-registrations/${confReg._id}/certificate/withdraw`); onRefresh(); } catch (err) { alert(err.message || 'Withdrawal failed'); } finally { setIssuing(false); } }} disabled={issuing}>{issuing ? 'Withdrawing…' : 'Withdraw Certificate'}</button>
              </>
            ) : confReg.status === 'approved' ? (
              <>
                <a className="tbl-btn" href={`${API_BASE}/admin/conference-registrations/${confReg._id}/certificate/preview`} target="_blank" rel="noreferrer">Preview Certificate</a>
                <button className="tbl-btn approve" onClick={issueCertificate} disabled={issuing}>{issuing ? 'Issuing…' : 'Issue Certificate'}</button>
              </>
            ) : null}
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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [college, setCollege]     = useState('');
  const [certificateFilter, setCertificateFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const CONF_TABS = [
    { id: 'pending',  label: 'Pending',  count: counts?.pending  || 0 },
    { id: 'approved', label: 'Approved', count: counts?.approved || 0 },
    { id: 'rejected', label: 'Rejected', count: counts?.rejected || 0 },
  ];

  const load = useCallback(() => {
    if (isCollapsed) return;
    setLoading(true);
    setLoadError('');
    setSelectedIds(new Set());
    const params = new URLSearchParams({ status: activeTab, limit: '2000' });
    if (certificateFilter !== 'all') params.set('certificateStatus', certificateFilter);
    api.get(`/admin/conference-registrations?${params.toString()}`)
      .then((res) => setRows(res.data?.docs || []))
      .catch(() => { setRows([]); setLoadError('Failed to load registrations.'); })
      .finally(() => setLoading(false));
  }, [activeTab, certificateFilter, isCollapsed]);

  useEffect(() => { load(); }, [load]);

  /* Client-side college filter over the loaded page (≤100 rows). */
  const visibleRows = college.trim()
    ? rows.filter((r) => (r.userId?.college || '').toLowerCase().includes(college.trim().toLowerCase()))
    : rows;

  const toggleOne = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r._id));
  const toggleAll = () => setSelectedIds((prev) => {
    if (allVisibleSelected) {
      const next = new Set(prev);
      visibleRows.forEach((r) => next.delete(r._id));
      return next;
    }
    const next = new Set(prev);
    visibleRows.forEach((r) => next.add(r._id));
    return next;
  });

  return (
    <div className="admin-event-section">
      <div 
        className="collapsible-section-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="csh-left">
          <span 
            className="csh-arrow" 
            style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
          >
            ▶
          </span>
          <span className="csh-title">
            Conference Registrations
            <span className="csh-count">
              ({(counts?.total || 0)} total)
            </span>
          </span>
        </div>
        <div className="csh-right">
          {isCollapsed ? 'Expand' : 'Collapse'}
        </div>
      </div>

      {!isCollapsed && (
        <>
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

          <div className="admin-status-tabs" aria-label="Certificate status filter">
            {[
              { id: 'all', label: 'All Certificates' },
              { id: 'issued', label: 'Issued' },
              { id: 'not-issued', label: 'Not Issued' },
            ].map((option) => (
              <button
                key={option.id}
                className={`admin-status-tab${certificateFilter === option.id ? ' active' : ''}`}
                onClick={() => setCertificateFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <AdminSelectionBar
            college={college}
            setCollege={setCollege}
            selectedIds={selectedIds}
            endpoint="/admin/conference-registrations/resend-emails"
            onDone={() => setSelectedIds(new Set())}
          />

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center' }}><div className="auth-spinner" style={{ margin: '0 auto' }} /></div>
          ) : loadError ? (
            <div className="admin-empty">{loadError}</div>
          ) : visibleRows.length === 0 ? (
            <div className="admin-empty">
              {rows.length === 0 ? 'No registrations match the selected status filters.' : 'No registrations match that college.'}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} title="Select all" />
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>College</th>
                    <th>Transaction ID</th>
                    <th>Participant Type</th>
                    <th>SRC ID</th>
                    <th>Registration Type</th>
                    <th>Fee Paid</th>
                    <th>Submitted</th>
                    <th>Certificate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <ConfRegRow
                      key={r._id}
                      confReg={r}
                      onRefresh={load}
                      selected={selectedIds.has(r._id)}
                      onToggle={toggleOne}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════ EVENT REGISTRATION COMPONENTS */

/* ── Submission download + review cell ── */
/* ── Submission download + review cell ── */
function SubmissionCell({ registrationId, status, onRefresh }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchSubmission = async () => {
    if (submission) return submission;
    try {
      const res = await api.get(`/admin/registrations/${registrationId}/submission-file`);
      setSubmission(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [registrationId]);

  const downloadSingle = async () => {
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

  const downloadFile = (url) => {
    window.open(url, '_blank');
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

  const hasFiles = submission?.files && submission.files.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
      {hasFiles ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {submission.files.map((file, idx) => (
            <button
              key={file.fileKey || idx}
              className="tbl-btn"
              onClick={() => downloadFile(file.signedUrl)}
              style={{ fontSize: '0.72rem', padding: '4px 6px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={file.fileName}
            >
              ↓ {file.fileName || `PDF ${idx + 1}`}
            </button>
          ))}
        </div>
      ) : (
        <button className="tbl-btn" onClick={downloadSingle} disabled={loading}>
          {loading ? '…' : 'Download'}
        </button>
      )}
      {status !== 'completed' && (
        <button className="tbl-btn approve" onClick={markComplete} disabled={completing}>
          {completing ? '…' : 'Mark Complete'}
        </button>
      )}
    </div>
  );
}

/* ── Event Registration Row ── */
function RegRow({ reg, onRefresh, selected, onToggle }) {
  const participant = reg.participantSnapshot || reg.userId || {};
  const team        = reg.teamId;
  const [isCollapsed, setIsCollapsed] = useState(true);

  const deleteReg = async () => {
    const confirmMsg = team 
      ? `Delete team "${team.teamName}"? This permanently removes the team, its leader registration, and any files. This cannot be undone.`
      : `Delete registration for ${participant.name || 'this user'}? This cannot be undone.`;
      
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await api.delete(`/admin/registrations/${reg._id}`);
      onRefresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete registration.');
    }
  };

  if (team) {
    return (
      <>
        <tr
          className="team-header-row"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', userSelect: 'none' }}
        >
          <td style={{ textAlign: 'center' }}>
            <input type="checkbox" checked={selected} onChange={() => onToggle(reg._id)} />
          </td>
          <td
            colSpan="7"
            style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--primary)', cursor: 'pointer' }}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <span style={{ 
              marginRight: '8px', 
              display: 'inline-block', 
              fontSize: '0.8em',
              transition: 'transform 0.2s',
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
            }}>▶</span>
            Team: {team.teamName} <span style={{ fontSize: '0.85em', color: 'var(--text-muted)', fontWeight: 'normal' }}>({(team.members?.length || 0) + 1} members)</span>
          </td>
          <td>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {['submitted', 'completed'].includes(reg.status) && (
                <SubmissionCell registrationId={reg._id} status={reg.status} onRefresh={onRefresh} />
              )}
              <button className="tbl-btn reject" onClick={deleteReg}>
                Delete Team
              </button>
            </div>
          </td>
        </tr>
        {!isCollapsed && (
          <>
            <tr>
              <td />
              <td className="name-cell">
                {participant.name || '—'}
                <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(56, 189, 114, 0.2)', color: 'var(--primary)', borderRadius: '4px', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leader</span>
              </td>
              <td>{participant.email || '—'}</td>
              <td style={{ textTransform: 'capitalize' }}>{participantTypeLabel(reg.participantType || participantTypeFromEmail(participant.email))}</td>
              <td>{participant.college || '—'}</td>
              <td>—</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
                {reg.srcId || '—'}
              </td>
              <td>{new Date(reg.createdAt).toLocaleDateString('en-IN')}</td>
              <td>—</td>
            </tr>
            {team.members?.map((m) => (
              <tr key={m.userId || m._id || m.email} style={{ opacity: 0.85 }}>
                <td />
                <td className="name-cell" style={{ paddingLeft: '24px' }}>
                  ↳ {m.name || '—'}
                </td>
                <td>{m.email || '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{participantTypeLabel(m.participantType || participantTypeFromEmail(m.email))}</td>
                <td>{m.college || '—'}</td>
                <td>—</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
                  {m.srcId || '—'}
                </td>
                <td>—</td>
                <td>—</td>
              </tr>
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <tr>
      <td style={{ textAlign: 'center' }}>
        <input type="checkbox" checked={selected} onChange={() => onToggle(reg._id)} />
      </td>
      <td className="name-cell">{participant.name || '—'}</td>
      <td>{participant.email || '—'}</td>
      <td style={{ textTransform: 'capitalize' }}>{participantTypeLabel(reg.participantType || participantTypeFromEmail(participant.email))}</td>
      <td>{participant.college || '—'}</td>
      <td>—</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
        {reg.srcId || '—'}
      </td>
      <td>{new Date(reg.createdAt).toLocaleDateString('en-IN')}</td>
      <td>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['submitted', 'completed'].includes(reg.status) && <SubmissionCell registrationId={reg._id} status={reg.status} onRefresh={onRefresh} />}
          <button className="tbl-btn reject" onClick={deleteReg}>
            Delete
          </button>
        </div>
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
  const [college, setCollege]     = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    setSelectedIds(new Set());
    api.get(`/admin/events/${evt.event._id}/registrations?status=${activeTab}&limit=2000`)
      .then((res) => setRegs(res.data?.docs || []))
      .catch(() => { setRegs([]); setLoadError('Failed to load registrations.'); })
      .finally(() => setLoading(false));
  }, [evt.event._id, activeTab]);

  useEffect(() => { load(); }, [load]);

  /* College filter matches the registrant or any team member. */
  const matchesCollege = (reg) => {
    const q = college.trim().toLowerCase();
    if (!q) return true;
    const cols = [reg.participantSnapshot?.college, ...(reg.teamId?.members || []).map((m) => m.college)];
    return cols.some((c) => (c || '').toLowerCase().includes(q));
  };
  const visibleRegs = regs.filter(matchesCollege);

  const toggleOne = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allVisibleSelected = visibleRegs.length > 0 && visibleRegs.every((r) => selectedIds.has(r._id));
  const toggleAll = () => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (allVisibleSelected) visibleRegs.forEach((r) => next.delete(r._id));
    else visibleRegs.forEach((r) => next.add(r._id));
    return next;
  });

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

      <AdminSelectionBar
        college={college}
        setCollege={setCollege}
        selectedIds={selectedIds}
        endpoint="/admin/registrations/resend-emails"
        onDone={() => setSelectedIds(new Set())}
      />

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}><div className="auth-spinner" style={{ margin: '0 auto' }} /></div>
      ) : loadError ? (
        <div className="admin-empty">{loadError}</div>
      ) : visibleRegs.length === 0 ? (
        <div className="admin-empty">{regs.length === 0 ? 'No registrations in this category.' : 'No registrations match that college.'}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} title="Select all" />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Participant Type</th>
                <th>College</th>
                <th>Team</th>
                <th>SRC ID</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRegs.map((r) => (
                <RegRow
                  key={r._id}
                  reg={r}
                  onRefresh={load}
                  selected={selectedIds.has(r._id)}
                  onToggle={toggleOne}
                />
              ))}
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
  fileUploadRequired: false, pdfUploadMode: 'none', maxFileSizeMB: 10,
  minTeamSize: 2, maxTeamSize: 4, registrationEnabled: true,
  allowInternal: true, allowExternal: true,
  whatsappGroupLink: '',
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
    pdfUploadMode: event.pdfUploadMode || (event.fileUploadRequired ? 'single' : 'none'),
    maxFileSizeMB: event.maxFileSizeMB || 10,
    minTeamSize: event.minTeamSize || 2,
    maxTeamSize: event.maxTeamSize || 4,
    registrationEnabled: event.registrationEnabled !== false,
    allowInternal: event.allowInternal !== false,
    allowExternal: event.allowExternal !== false,
    whatsappGroupLink: event.whatsappGroupLink || '',
  } : EMPTY_EVENT_FORM);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: type === 'checkbox' ? checked : value };
      if (name === 'pdfUploadMode') {
        next.fileUploadRequired = value !== 'none';
      }
      return next;
    });
  };

  const submit = async () => {
    if (!form.name.trim()) { setError('Event name is required.'); return; }
    if (!form.registrationDeadline) { setError('Registration deadline is required.'); return; }
    if (!form.allowInternal && !form.allowExternal) { setError('Allow internal, external, or both participant types.'); return; }

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
        fileUploadRequired: form.pdfUploadMode !== 'none',
        pdfUploadMode: form.pdfUploadMode,
        maxFileSizeMB: Number(form.maxFileSizeMB) || 10,
        registrationEnabled: form.registrationEnabled,
        allowInternal: form.allowInternal,
        allowExternal: form.allowExternal,
        whatsappGroupLink: form.whatsappGroupLink.trim(),
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
    <div className="admin-modal-bg" onClick={onClose} data-lenis-prevent>
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? 'Edit Event' : 'Create Event'}</h3>
        {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}

        <div className="ef-grid">
          <div className="ef-row">
            <div className="ef-field">
              <label className="auth-label">Event Name</label>
              <input className="admin-modal-input" name="name" placeholder="Event name" value={form.name} onChange={handle} autoFocus />
            </div>
            <div className="ef-field">
              <label className="auth-label">Slug</label>
              <input className="admin-modal-input" name="slug" placeholder="Auto-generated if blank" value={form.slug} onChange={handle} />
            </div>
          </div>

          <div className="ef-row">
            <div className="ef-field ef-field-full">
              <label className="auth-label">Description</label>
              <textarea className="admin-modal-input" name="description" placeholder="Description" value={form.description} onChange={handle} rows={2} />
            </div>
          </div>

          <div className="ef-row">
            <div className="ef-field ef-field-full">
              <label className="auth-label">WhatsApp Group Link</label>
              <input className="admin-modal-input" name="whatsappGroupLink" placeholder="WhatsApp Group invite URL" value={form.whatsappGroupLink} onChange={handle} />
            </div>
          </div>

          <div className="ef-row">
            <div className="ef-field">
              <label className="auth-label">Type</label>
              <select className="admin-modal-input" name="type" value={form.type} onChange={handle}>
                <option value="solo">Solo</option>
                <option value="team">Team</option>
              </select>
            </div>
            <div className="ef-field">
              <label className="auth-label">Registration Deadline</label>
              <input className="admin-modal-input" type="datetime-local" name="registrationDeadline" value={form.registrationDeadline} onChange={handle} />
            </div>
            <div className="ef-field">
              <label className="auth-label">Submission Deadline (optional)</label>
              <input className="admin-modal-input" type="datetime-local" name="submissionDeadline" value={form.submissionDeadline} onChange={handle} />
            </div>
          </div>

          <div className="ef-row">
            {form.type === 'team' && (
              <>
                <div className="ef-field">
                  <label className="auth-label">Min team size</label>
                  <input className="admin-modal-input" type="number" min="1" name="minTeamSize" value={form.minTeamSize} onChange={handle} />
                </div>
                <div className="ef-field">
                  <label className="auth-label">Max team size</label>
                  <input className="admin-modal-input" type="number" min="1" name="maxTeamSize" value={form.maxTeamSize} onChange={handle} />
                </div>
              </>
            )}

            <div className="ef-field">
              <label className="auth-label">File Submission Option</label>
              <select className="admin-modal-input" name="pdfUploadMode" value={form.pdfUploadMode} onChange={handle}>
                <option value="none">No File Required</option>
                <option value="single">Single PDF</option>
                <option value="multiple">Multiple PDFs</option>
              </select>
            </div>

            {form.pdfUploadMode !== 'none' && (
              <div className="ef-field">
                <label className="auth-label">Max file size (MB)</label>
                <input className="admin-modal-input" type="number" min="1" max="100" name="maxFileSizeMB" value={form.maxFileSizeMB} onChange={handle} />
              </div>
            )}

            <div className="ef-field ef-checkboxes" style={{ alignSelf: 'center', marginTop: '20px' }}>
              <label>
                <input type="checkbox" name="registrationEnabled" checked={form.registrationEnabled} onChange={handle} />
                Registrations open
              </label>
            </div>
            <div className="ef-field ef-checkboxes">
              <span className="auth-label">Participant access</span>
              <label>
                <input type="checkbox" name="allowInternal" checked={form.allowInternal} onChange={handle} />
                Internal (@rgipt.ac.in)
              </label>
              <label>
                <input type="checkbox" name="allowExternal" checked={form.allowExternal} onChange={handle} />
                External
              </label>
            </div>
          </div>
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
                <th>Participants</th>
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
                  <td style={{ textTransform: 'capitalize' }}>
                    {[evt.allowInternal !== false && 'Internal', evt.allowExternal !== false && 'External'].filter(Boolean).join(' + ')}
                  </td>
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
    <div className="admin-modal-bg" onClick={onClose} data-lenis-prevent>
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
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(() => {
    if (!isOpen) return;
    setLoading(true);
    setLoadError('');
    const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}&limit=100` : '?limit=100';
    api.get(`/admin/users${qs}`)
      .then((res) => setUsers(res.data?.docs || []))
      .catch(() => { setUsers([]); setLoadError('Failed to load users.'); })
      .finally(() => setLoading(false));
  }, [search, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
  }, [load, isOpen]);

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
    <div className="admin-event-section" style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '24px', background: '#ffffff' }}>
      <div 
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          userSelect: 'none'
        }} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="admin-event-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', 
            display: 'inline-block',
            fontSize: '0.9rem',
            color: 'var(--text-muted)'
          }}>▶</span>
          User Management
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isOpen && (
            <button 
              className="tbl-btn approve" 
              onClick={(e) => { e.stopPropagation(); setShowCreate(true); }}
              style={{ height: '32px', padding: '0 16px', fontSize: '0.72rem' }}
            >
              + Add User
            </button>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isOpen ? 'Collapse' : 'Expand'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
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

/* ══════════════════════════════════════ ANNOUNCEMENT MANAGEMENT COMPONENTS */

const EMPTY_ANNOUNCEMENT_FORM = { title: '', content: '', url: '', urlLabel: '' };

function announcementTimeAgo(dateString) {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(dateString).toLocaleDateString('en-IN');
}

/* ── Announcement create/edit modal ── */
function AnnouncementFormModal({ announcement, onClose, onDone }) {
  const isEdit = Boolean(announcement);
  const [form, setForm] = useState(() => announcement ? {
    title: announcement.title || '',
    content: announcement.content || '',
    url: announcement.url || '',
    urlLabel: announcement.urlLabel || '',
  } : EMPTY_ANNOUNCEMENT_FORM);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }

    setBusy(true);
    setError('');
    try {
      const body = {
        title:    form.title.trim(),
        content:  form.content.trim(),
        url:      form.url.trim() || undefined,
        urlLabel: form.urlLabel.trim() || undefined,
      };

      if (isEdit) {
        await api.put(`/admin/announcements/${announcement._id}`, body);
      } else {
        await api.post('/admin/announcements', body);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save announcement.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-bg" onClick={onClose} data-lenis-prevent>
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? 'Edit Announcement' : 'Publish Announcement'}</h3>
        {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}

        <div className="ef-grid">
          <div className="ef-row">
            <div className="ef-field ef-field-full">
              <label className="auth-label">Title</label>
              <input className="admin-modal-input" name="title" placeholder="Announcement title" value={form.title} onChange={handle} autoFocus maxLength={200} />
            </div>
          </div>

          <div className="ef-row">
            <div className="ef-field ef-field-full">
              <label className="auth-label">Content</label>
              <textarea className="admin-modal-input" name="content" placeholder="Announcement content" value={form.content} onChange={handle} rows={6} maxLength={5000} />
            </div>
          </div>

          <div className="ef-row">
            <div className="ef-field">
              <label className="auth-label">Attachment URL (Optional)</label>
              <input type="url" className="admin-modal-input" name="url" placeholder="https://example.com/details" value={form.url} onChange={handle} />
            </div>
            <div className="ef-field">
              <label className="auth-label">Link Label (Optional)</label>
              <input type="text" className="admin-modal-input" name="urlLabel" placeholder="e.g. Download Brochure" value={form.urlLabel} onChange={handle} maxLength={100} />
            </div>
          </div>
        </div>

        <div className="admin-modal-actions">
          <button className="tbl-btn" onClick={onClose}>Cancel</button>
          <button className="tbl-btn approve" onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Announcements Management Section ── */
function AnnouncementsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(() => {
    if (!isOpen) return;
    setLoading(true);
    setLoadError('');
    api.get('/announcements?limit=50')
      .then((res) => setItems(res.data?.docs || []))
      .catch(() => { setItems([]); setLoadError('Failed to load announcements.'); })
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => { load(); }, [load]);

  const deleteAnnouncement = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This action cannot be undone.`)) return;

    setDeletingId(a._id);
    try {
      await api.delete(`/admin/announcements/${a._id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-event-section" style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '24px', background: '#ffffff' }}>
      <div
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="admin-event-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block',
            fontSize: '0.9rem',
            color: 'var(--text-muted)'
          }}>▶</span>
          Announcements Management
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isOpen && (
            <button
              className="tbl-btn approve"
              onClick={(e) => { e.stopPropagation(); setShowCreate(true); }}
              style={{ height: '32px', padding: '0 16px', fontSize: '0.72rem' }}
            >
              + Publish Announcement
            </button>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isOpen ? 'Collapse' : 'Expand'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center' }}><div className="auth-spinner" style={{ margin: '0 auto' }} /></div>
          ) : loadError ? (
            <div className="admin-empty">{loadError}</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">No announcements yet. Publish one to get started.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a._id}>
                      <td className="name-cell">{a.title}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="tbl-btn" onClick={() => setEditingAnnouncement(a)}>Edit</button>
                          <button
                            className="tbl-btn reject"
                            onClick={() => deleteAnnouncement(a)}
                            disabled={deletingId === a._id}
                          >
                            {deletingId === a._id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <AnnouncementFormModal
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); load(); }}
        />
      )}
      {editingAnnouncement && (
        <AnnouncementFormModal
          announcement={editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          onDone={() => { setEditingAnnouncement(null); load(); }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1600px', margin: '0 auto' }}>
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

            {/* Announcements management (publish / edit / delete) */}
            <AnnouncementsSection />

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
