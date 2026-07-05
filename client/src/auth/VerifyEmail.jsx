import React from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

export default function VerifyEmail() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <span className="auth-eyebrow">AIChE India SRC 2026</span>
        <h1 className="auth-title">Email verification</h1>
        <p className="auth-subtitle">
          Email verification now happens during sign-up via a one-time code sent to your inbox.
          If you already have an account, please sign in below.
        </p>
        <Link to="/login" className="auth-btn" style={{ display: 'block', textDecoration: 'none' }}>
          Sign In
        </Link>
        <p className="auth-footer" style={{ marginTop: '20px' }}>
          No account yet? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
