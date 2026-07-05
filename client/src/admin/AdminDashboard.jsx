import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
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

/* ── Conf Reg: Row in table ── */
function ConfRegRow({ confReg, onRefresh }) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject]   = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  const viewScreenshot = async () => {
    if (screenshotUrl) { window.open(screenshotUrl, '_blank'); return; }
    try {
      const res = await api.get(`/admin/conference-registrations/${confReg._id}/screenshot`);
      setScreenshotUrl(res.data?.signedUrl);
      window.open(res.data?.signedUrl, '_blank');
    } catch {
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
        <td>{new Date(confReg.createdAt).toLocaleDateString('en-IN')}</td>
        <td>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

  const CONF_TABS = [
    { id: 'pending',  label: 'Pending',  count: counts?.pending  || 0 },
    { id: 'approved', label: 'Approved', count: counts?.approved || 0 },
    { id: 'rejected', label: 'Rejected', count: counts?.rejected || 0 },
  ];

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/conference-registrations?status=${activeTab}&limit=100`)
      .then((res) => setRows(res.data?.docs || []))
      .catch(() => setRows([]))
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

/* ── Submission download cell ── */
function SubmissionCell({ registrationId }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (url) { window.open(url, '_blank'); return; }
    setLoading(true);
    try {
      const subRes = await api.get(`/admin/registrations/${registrationId}/submission-file`);
      setUrl(subRes.data?.signedUrl);
      window.open(subRes.data?.signedUrl, '_blank');
    } catch {
      alert('Could not load submission file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="tbl-btn" onClick={load} disabled={loading}>
      {loading ? '…' : 'Download'}
    </button>
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
            {reg.status === 'submitted' && <SubmissionCell registrationId={reg._id} />}
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

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/events/${evt.event._id}/registrations?status=${activeTab}&limit=100`)
      .then((res) => setRegs(res.data?.docs || []))
      .catch(() => setRegs([]))
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
          href={`/api/v1/admin/events/${evt.event._id}/export/csv?status=${activeTab}`}
          className="export-btn"
          target="_blank"
          rel="noreferrer"
        >
          ↓ CSV
        </a>
        <a
          href={`/api/v1/admin/events/${evt.event._id}/export/excel?status=${activeTab}`}
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

/* ═══════════════════════════════════════════════════════════ ADMIN ROOT */
export default function AdminDashboard() {
  const { logout } = useAuth();
  const [data, setData]       = useState({ conferenceRegistrations: null, events: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then((res) => setData(res.data || { conferenceRegistrations: null, events: [] }))
      .finally(() => setLoading(false));
  }, []);

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

            {/* Conference registrations management section */}
            <ConfRegSection counts={confCounts} />

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
