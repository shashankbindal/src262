import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import './AdminDashboard.css';

/* ── Status badge (reuse pattern) ── */
const STATUS_LABELS = {
  pending_payment:    'Pending Payment',
  payment_submitted:  'Payment Submitted',
  payment_approved:   'Approved',
  payment_rejected:   'Rejected',
  waiting_submission: 'Awaiting Submission',
  submitted:          'Submitted',
  completed:          'Completed',
};

/* Status tabs shown per event — groups that admin cares about */
const STATUS_TABS = [
  { id: 'payment_submitted',  label: 'Review Payments' },
  { id: 'payment_approved',   label: 'Approved' },
  { id: 'payment_rejected',   label: 'Rejected' },
  { id: 'waiting_submission', label: 'Awaiting Submission' },
  { id: 'submitted',          label: 'Submissions' },
  { id: 'completed',          label: 'Completed' },
];

/* ── Reject Modal ── */
function RejectModal({ regId, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');

  const submit = async () => {
    if (!reason.trim()) { setError('Please provide a rejection reason.'); return; }
    setBusy(true);
    try {
      await api.patch(`/admin/registrations/${regId}/payment-decision`, { action: 'reject', reason: reason.trim() });
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
        <h3>Reject Payment</h3>
        <p>Provide a clear reason. The participant will see this in their email and dashboard.</p>
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

/* ── Registration Row ── */
function RegRow({ reg, onRefresh }) {
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [showReject, setShowReject]         = useState(false);
  const [screenshotUrl, setScreenshotUrl]   = useState(null);

  const approve = async () => {
    if (!window.confirm('Approve this payment?')) return;
    setLoadingApprove(true);
    try {
      await api.patch(`/admin/registrations/${reg._id}/payment-decision`, { action: 'approve' });
      onRefresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Approval failed.');
    } finally {
      setLoadingApprove(false);
    }
  };

  const viewScreenshot = async () => {
    if (screenshotUrl) { window.open(screenshotUrl, '_blank'); return; }
    try {
      const res = await api.get(`/admin/registrations/${reg._id}/payment-screenshot`);
      const url = res.data?.signedUrl;
      setScreenshotUrl(url);
      window.open(url, '_blank');
    } catch {
      alert('Could not load screenshot.');
    }
  };

  const participant = reg.participantSnapshot || reg.userId || {};
  const team        = reg.teamId;

  return (
    <>
      <tr>
        <td className="name-cell">{participant.name || '—'}</td>
        <td>{participant.email || '—'}</td>
        <td>{participant.college || '—'}</td>
        <td>{team ? `${team.teamName} (${(team.members?.length || 0) + 1})` : '—'}</td>
        <td>{reg.transactionId || '—'}</td>
        <td>{new Date(reg.createdAt).toLocaleDateString('en-IN')}</td>
        <td>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {reg.paymentScreenshotUrl && (
              <button className="tbl-btn" onClick={viewScreenshot}>View Screenshot</button>
            )}
            {reg.status === 'payment_submitted' && (
              <>
                <button className="tbl-btn approve" onClick={approve} disabled={loadingApprove}>
                  {loadingApprove ? '…' : 'Approve'}
                </button>
                <button className="tbl-btn reject" onClick={() => setShowReject(true)}>Reject</button>
              </>
            )}
            {reg.status === 'submitted' && (
              <SubmissionCell registrationId={reg._id} />
            )}
          </div>
        </td>
      </tr>
      {showReject && (
        <RejectModal
          regId={reg._id}
          onClose={() => setShowReject(false)}
          onDone={() => { setShowReject(false); onRefresh(); }}
        />
      )}
    </>
  );
}

/* ── Submission download link in table row ── */
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

/* ── Event Section with tabs ── */
function EventSection({ evt }) {
  const [activeTab, setActiveTab] = useState('payment_submitted');
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

      {/* Export bar */}
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
        {STATUS_TABS.map((t) => (
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
                <th>Transaction ID</th>
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
  const [overview, setOverview] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then((res) => setOverview(res.data || []))
      .finally(() => setLoading(false));
  }, []);

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
              {overview.map(({ event, counts, total }) => (
                <div className="overview-card" key={event._id}>
                  <div className="overview-card-event">{event.name}</div>
                  <div className="overview-counts">
                    <div className="oc-item">
                      <span className="oc-label">Total</span>
                      <span className="oc-value">{total}</span>
                    </div>
                    <div className="oc-item">
                      <span className="oc-label">Review</span>
                      <span className="oc-value" style={{ color: '#60a5fa' }}>{counts.payment_submitted || 0}</span>
                    </div>
                    <div className="oc-item">
                      <span className="oc-label">Approved</span>
                      <span className="oc-value" style={{ color: 'var(--primary)' }}>{counts.payment_approved || 0}</span>
                    </div>
                    <div className="oc-item">
                      <span className="oc-label">Submitted</span>
                      <span className="oc-value" style={{ color: '#6ee7b7' }}>{counts.submitted || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Per-event sections */}
            {overview.map((item) => (
              <EventSection key={item.event._id} evt={item} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
