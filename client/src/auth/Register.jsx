import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import { useDocumentTitle } from '../shared/useDocumentTitle.js';
import './auth.css';

export default function Register() {
  useDocumentTitle('Create Account | VIPLAV 2026 — AIChE India SRC');
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, loading } = useAuth();

  const [step, setStep]       = useState(1); // 1 = form, 2 = otp
  const [registeredEmail, setRegisteredEmail] = useState('');

  /* Step 1 */
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);

  /* Step 2 */
  const [otp, setOtp]         = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg]   = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, loading, navigate]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.name.trim())  return 'Name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(form.password)) return 'Password must include at least one uppercase letter.';
    if (!/[0-9]/.test(form.password)) return 'Password must include at least one number.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return null;
  };

  const submitStep1 = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setBusy(true);
    setError('');
    try {
      await registerUser({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      await api.post('/auth/send-otp', { email: form.email.trim() });
      setRegisteredEmail(form.email.trim());
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpError('Please enter the 6-digit code.'); return; }
    setOtpBusy(true);
    setOtpError('');
    try {
      await api.post('/auth/verify-otp', { email: registeredEmail, otp: otp.trim() });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : 'Verification failed. Please try again.');
    } finally {
      setOtpBusy(false);
    }
  };

  const resendOTP = async () => {
    setResendBusy(true);
    setResendMsg('');
    setOtpError('');
    try {
      await api.post('/auth/send-otp', { email: registeredEmail });
      setResendMsg('A new code has been sent to your email.');
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : 'Could not resend. Try again shortly.');
    } finally {
      setResendBusy(false);
    }
  };

  /* ── Step 2: OTP verification ── */
  if (step === 2) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="auth-eyebrow">AIChE India SRC 2026</span>
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle">
            We sent a 6-digit code to <strong>{registeredEmail}</strong>. Enter it below to activate your account.
          </p>

          {otpError && <div className="auth-error">{otpError}</div>}
          {resendMsg && <div className="auth-success">{resendMsg}</div>}

          <form className="auth-form" onSubmit={submitOTP} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="otp">Verification Code</label>
              <input
                id="otp"
                className="auth-input otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </div>

            <button className="auth-btn" type="submit" disabled={otpBusy} data-magnetic>
              {otpBusy ? <><span className="btn-spinner" /> Verifying…</> : 'Verify Email'}
            </button>
          </form>

          <p className="auth-footer">
            Didn't get the code?{' '}
            <button
              className="auth-link-btn"
              onClick={resendOTP}
              disabled={resendBusy}
              type="button"
            >
              {resendBusy ? 'Sending…' : 'Resend'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ── Step 1: Registration form ── */
  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-eyebrow">AIChE India SRC 2026</span>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join VIPLAV '26 — AIChE India Student Regional Conference.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={submitStep1} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              className="auth-input"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handle}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="Min 8 chars, one uppercase, one number"
              value={form.password}
              onChange={handle}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              name="confirm"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={form.confirm}
              onChange={handle}
            />
          </div>

          <button className="auth-btn" type="submit" disabled={busy} data-magnetic>
            {busy ? <><span className="btn-spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
