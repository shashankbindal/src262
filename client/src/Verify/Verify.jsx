import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api.js';
import { useDocumentTitle } from '../shared/useDocumentTitle.js';
import './Verify.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function Verify() {
  const { srcId } = useParams();
  useDocumentTitle(`Verify ${srcId || 'Pass'} | VIPLAV 2026 — AIChE India SRC`);

  const [state, setState] = useState('loading'); // loading | valid | invalid
  const [data, setData]   = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api.get(`/conference-registration/verify/${encodeURIComponent(srcId)}`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setState('valid');
      })
      .catch((err) => {
        if (cancelled) return;
        setMessage(err instanceof ApiError ? err.message : 'Unable to verify this pass right now.');
        setState('invalid');
      });
    return () => { cancelled = true; };
  }, [srcId]);

  return (
    <div className="vf-page">
      <div className="vf-card">
        <div className="vf-brand">
          <span className="vf-brand-org">AIChE India SRC 2026</span>
          <span className="vf-brand-event">VIPLAV '26 — Conference Pass Verification</span>
        </div>

        {state === 'loading' && (
          <div className="vf-loading">
            <div className="auth-spinner" />
            <p>Verifying pass…</p>
          </div>
        )}

        {state === 'invalid' && (
          <div className="vf-result vf-invalid">
            <div className="vf-badge vf-badge-bad">✕</div>
            <h1 className="vf-title">Not Verified</h1>
            <p className="vf-sub">{message}</p>
            <div className="vf-srcid-chip">SRC ID: {srcId}</div>
            <p className="vf-note">
              This pass could not be matched to an approved conference registration.
              If you believe this is an error, please contact the organising committee.
            </p>
          </div>
        )}

        {state === 'valid' && data && (
          <div className="vf-result vf-valid">
            <div className="vf-badge vf-badge-good">✓</div>
            <h1 className="vf-title">Verified</h1>
            <p className="vf-sub">This is a genuine, approved conference registration.</p>

            {data.photoUrl && (
              <img className="vf-photo" src={data.photoUrl} alt={data.name || 'Participant'} />
            )}

            <div className="vf-name">{data.name}</div>
            <div className="vf-srcid-chip">SRC ID: {data.srcId}</div>

            <div className="vf-details">
              <div className="vf-row">
                <span>Institute</span>
                <strong>{data.institute || '—'}</strong>
              </div>
              <div className="vf-row">
                <span>Registration</span>
                <strong>{data.registrationType || '—'}</strong>
              </div>
              <div className="vf-row">
                <span>Approved On</span>
                <strong>{formatDate(data.approvedOn)}</strong>
              </div>
            </div>
          </div>
        )}

        <Link to="/" className="vf-home-link">← Back to viplavsrc.com</Link>
      </div>
    </div>
  );
}
