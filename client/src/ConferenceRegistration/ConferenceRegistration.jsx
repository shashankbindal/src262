import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import './ConferenceRegistration.css';

/* ── Constants ── */
const STAGES = [
  { key: 'form', label: 'Fill Details', step: 1 },
  { key: 'preview', label: 'Review', step: 2 },
  { key: 'payment', label: 'Payment', step: 3 },
  { key: 'declaration', label: 'Declaration', step: 4 },
];

/* India first (most attendees), then the rest alphabetically. */
const COUNTRIES = [
  'India',
  'Afghanistan', 'Australia', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brazil',
  'Canada', 'China', 'Egypt', 'France', 'Germany', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Italy', 'Japan', 'Kenya', 'Kuwait', 'Malaysia',
  'Maldives', 'Mauritius', 'Mexico', 'Myanmar', 'Nepal', 'Netherlands',
  'New Zealand', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Philippines',
  'Qatar', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand',
  'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Vietnam', 'Other',
];

/* ── Helpers ── */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function maskAadhaar(num) {
  if (!num || num.length < 4) return num;
  return `XXXX XXXX ${num.slice(-4)}`;
}

function FileThumbnail({ file, url }) {
  const src = url || (file ? URL.createObjectURL(file) : null);
  if (!src) return null;
  const isPdf = file?.type === 'application/pdf' || (typeof src === 'string' && src.includes('.pdf'));
  if (isPdf) {
    return (
      <div className="cr-file-thumb cr-file-thumb-pdf">
        <span className="cr-pdf-icon">PDF</span>
        <span className="cr-file-name">{file?.name || 'document.pdf'}</span>
      </div>
    );
  }
  return <img className="cr-file-thumb" src={src} alt="Preview" />;
}

/* ══════════════════════════════════ PROGRESS BAR */
function ProgressBar({ stage }) {
  const active = STAGES.findIndex((s) => s.key === stage);
  return (
    <div className="cr-progress" role="navigation" aria-label="Registration steps">
      {STAGES.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`cr-prog-step ${i <= active ? 'done' : ''} ${i === active ? 'current' : ''}`}>
            <div className="cr-prog-circle">
              {i < active ? <span className="cr-prog-check">✓</span> : <span>{i + 1}</span>}
            </div>
            <span className="cr-prog-label">{s.label}</span>
          </div>
          {i < STAGES.length - 1 && (
            <div className={`cr-prog-line ${i < active ? 'done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ══════════════════════════════════ SECTION CARD */
function Section({ number, title, children }) {
  return (
    <div className="cr-section">
      <div className="cr-section-head">
        <span className="cr-section-num">{number}</span>
        <h2 className="cr-section-title">{title}</h2>
      </div>
      <div className="cr-section-body">{children}</div>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, required, error, children, hint }) {
  return (
    <div className={`cr-field${error ? ' cr-field-error' : ''}`}>
      <label className="cr-label">
        {label}{required && <span className="cr-required" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <span className="cr-hint">{hint}</span>}
      {error && <span className="cr-error-msg" role="alert">{error}</span>}
    </div>
  );
}

/* ══════════════════════════════════ FORM STAGE */
function FormStage({ form, setForm, errors, setErrors, idCardFile, setIdCardFile, onNext, confReg, existingIdCard }) {
  const fileRef = useRef(null);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleIdCard = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdCardFile(file);
    if (errors.universityIdCard) setErrors((er) => ({ ...er, universityIdCard: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    else if (!/^[A-Za-z\s]+$/.test(form.name.trim())) e.name = 'Name must contain only letters and spaces';
    if (!form.phone.trim()) e.phone = 'Contact number is required';
    else if (!/^[0-9]{10}$/.test(form.phone.trim())) e.phone = 'Must be exactly 10 digits';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    else if (new Date(form.dateOfBirth) > new Date()) e.dateOfBirth = 'Cannot be in the future';
    if (!form.gender) e.gender = 'Please select a gender';
    if (!form.institute.trim()) e.institute = 'Institute name is required';
    if (!form.course.trim()) e.course = 'Course / programme name is required';
    if (!form.yearOfStudy) e.yearOfStudy = 'Please select year of study';
    if (!form.aadhaarNumber.trim()) e.aadhaarNumber = 'Aadhaar number is required';
    else if (!/^[0-9]{12}$/.test(form.aadhaarNumber.replace(/\s/g, '')))
      e.aadhaarNumber = 'Must be exactly 12 digits';
    if (!form.aicheId.trim()) e.aicheId = 'AIChE membership ID is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!form.country.trim()) e.country = 'Country is required';
    if (!idCardFile && !existingIdCard) e.universityIdCard = 'University ID card is required';
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      const first = document.querySelector('.cr-field-error');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onNext();
  };

  return (
    <div className="cr-stage-body">
      {confReg?.status === 'rejected' && (
        <div className="cr-alert cr-alert-warn">
          <strong>Previous submission was rejected.</strong>{' '}
          {confReg.rejectionReason && <span>Reason: {confReg.rejectionReason}</span>}
          <br />Please review and correct your details before re-submitting.
        </div>
      )}

      {/* Section 1 — Personal Information */}
      <Section number="01" title="Personal Information">
        <div className="cr-grid-2">
          <Field label="Full Name" required error={errors.name}>
            <input className="cr-input" type="text" value={form.name}
              onChange={set('name')} placeholder="As on identity document" autoComplete="name" />
          </Field>
          <Field label="Email Address" required>
            <input className="cr-input" type="email" value={form.email} disabled
              style={{ background: 'var(--cr-disabled-bg)', cursor: 'not-allowed' }} />
            <span className="cr-hint">Email is linked to your account and cannot be changed here.</span>
          </Field>
          <Field label="Contact Number" required error={errors.phone}
            hint="10-digit mobile number without country code">
            <input className="cr-input" type="tel" value={form.phone}
              onChange={set('phone')} placeholder="9876543210" maxLength={10} />
          </Field>
          <Field label="Date of Birth" required error={errors.dateOfBirth}>
            <input className="cr-input" type="date" value={form.dateOfBirth}
              onChange={set('dateOfBirth')} max={new Date().toISOString().split('T')[0]} />
          </Field>
          <Field label="Gender" required error={errors.gender}>
            <select className="cr-select" value={form.gender} onChange={set('gender')}>
              <option value="">— Select —</option>
              {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Section 2 — Academic Information */}
      <Section number="02" title="Academic Information">
        <div className="cr-grid-2">
          <Field label="Institute / University Name" required error={errors.institute}>
            <input className="cr-input" type="text" value={form.institute}
              onChange={set('institute')} placeholder="Full name of your institution" />
          </Field>
          <Field label="Course / Programme Name" required error={errors.course}>
            <input className="cr-input" type="text" value={form.course}
              onChange={set('course')} placeholder="e.g. B.Tech Chemical Engineering" />
          </Field>
          <Field label="Year of Study" required error={errors.yearOfStudy}>
            <select className="cr-select" value={form.yearOfStudy} onChange={set('yearOfStudy')}>
              <option value="">— Select —</option>
              {['First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Section 3 — Identity Verification */}
      <Section number="03" title="Identity Verification">
        <div className="cr-grid-2">
          <Field label="University / Institute ID Card" required error={errors.universityIdCard}>
            <div className="cr-upload-box" onClick={() => fileRef.current?.click()}
              role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleIdCard} style={{ display: 'none' }} />
              {idCardFile ? (
                <FileThumbnail file={idCardFile} />
              ) : existingIdCard ? (
                <div className="cr-upload-existing">
                  <span className="cr-upload-icon">📄</span>
                  <span>Previously uploaded — click to replace</span>
                </div>
              ) : (
                <div className="cr-upload-placeholder">
                  <span className="cr-upload-icon">⬆</span>
                  <span>Click to upload (JPG, PNG, PDF — max 5 MB)</span>
                </div>
              )}
            </div>
          </Field>

          <div>
            <Field label="Aadhaar Number" required error={errors.aadhaarNumber}
              hint="12-digit number. Stored securely and never displayed publicly.">
              <input className="cr-input" type="text" value={form.aadhaarNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setForm((f) => ({ ...f, aadhaarNumber: val }));
                  if (errors.aadhaarNumber) setErrors((er) => ({ ...er, aadhaarNumber: '' }));
                }}
                placeholder="Enter 12-digit Aadhaar number"
                maxLength={12} inputMode="numeric" />
            </Field>

            <Field label="AIChE Student Membership ID" required error={errors.aicheId}>
              <input className="cr-input" type="text" value={form.aicheId}
                onChange={set('aicheId')} placeholder="e.g. 00990594XXXX" />
            </Field>
          </div>
        </div>
      </Section>

      {/* Section 4 — Address */}
      <Section number="04" title="Address">
        <div className="cr-grid-3">
          <Field label="City" required error={errors.city}>
            <input className="cr-input" type="text" value={form.city}
              onChange={set('city')} placeholder="Current city of residence" />
          </Field>
          <Field label="State / Province" required error={errors.state}>
            <input className="cr-input" type="text" value={form.state}
              onChange={set('state')} placeholder="e.g. Maharashtra" />
          </Field>
          <Field label="Country" required error={errors.country}>
            <select className="cr-select" value={form.country} onChange={set('country')}>
              <option value="">— Select —</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>



      {/* Navigation */}
      <div className="cr-nav cr-nav-right">
        <button className="cr-btn cr-btn-primary" onClick={handleNext}>
          Review Application →
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════ PREVIEW STAGE */
function PreviewRow({ label, value }) {
  return (
    <tr>
      <td className="cr-preview-label">{label}</td>
      <td className="cr-preview-value">{value || '—'}</td>
    </tr>
  );
}

function PreviewStage({ form, idCardFile, existingIdCard, onBack, onNext }) {
  return (
    <div className="cr-stage-body">
      <div className="cr-preview-header">
        <h2 className="cr-preview-title">Review Your Application</h2>
        <p className="cr-preview-sub">
          Please carefully verify all details before proceeding to payment.
          Click <strong>Edit</strong> to make corrections.
        </p>
      </div>

      <div className="cr-preview-card">
        <div className="cr-preview-section-head">
          <span>01</span> Personal Information
          <button className="cr-edit-btn" onClick={onBack}>Edit</button>
        </div>
        <table className="cr-preview-table">
          <tbody>
            <PreviewRow label="Full Name" value={form.name} />
            <PreviewRow label="Email Address" value={form.email} />
            <PreviewRow label="Contact Number" value={form.phone} />
            <PreviewRow label="Date of Birth" value={formatDate(form.dateOfBirth)} />
            <PreviewRow label="Gender" value={form.gender} />
          </tbody>
        </table>
      </div>

      <div className="cr-preview-card">
        <div className="cr-preview-section-head">
          <span>02</span> Academic Information
          <button className="cr-edit-btn" onClick={onBack}>Edit</button>
        </div>
        <table className="cr-preview-table">
          <tbody>
            <PreviewRow label="Institute Name" value={form.institute} />
            <PreviewRow label="Course / Programme" value={form.course} />
            <PreviewRow label="Year of Study" value={form.yearOfStudy} />
          </tbody>
        </table>
      </div>

      <div className="cr-preview-card">
        <div className="cr-preview-section-head">
          <span>03</span> Identity Verification
          <button className="cr-edit-btn" onClick={onBack}>Edit</button>
        </div>
        <table className="cr-preview-table">
          <tbody>
            <tr>
              <td className="cr-preview-label">University ID Card</td>
              <td className="cr-preview-value">
                {idCardFile
                  ? <FileThumbnail file={idCardFile} />
                  : existingIdCard
                    ? <span className="cr-tag-uploaded">Previously uploaded</span>
                    : '—'}
              </td>
            </tr>
            <PreviewRow label="Aadhaar Number" value={maskAadhaar(form.aadhaarNumber)} />
            <PreviewRow label="AIChE Membership ID" value={form.aicheId || 'Not provided'} />
          </tbody>
        </table>
      </div>

      <div className="cr-preview-card">
        <div className="cr-preview-section-head">
          <span>04</span> Address
          <button className="cr-edit-btn" onClick={onBack}>Edit</button>
        </div>
        <table className="cr-preview-table">
          <tbody>
            <PreviewRow label="City" value={form.city} />
            <PreviewRow label="State / Province" value={form.state} />
            <PreviewRow label="Country" value={form.country} />
          </tbody>
        </table>
      </div>



      <div className="cr-alert cr-alert-info">
        If all details are correct, proceed to payment. Once payment is submitted, details will be locked for review.
      </div>

      <div className="cr-nav cr-nav-between">
        <button className="cr-btn cr-btn-ghost" onClick={onBack}>← Back to Edit</button>
        <button className="cr-btn cr-btn-primary" onClick={onNext}>Proceed to Payment →</button>
      </div>
    </div>
  );
}

/* ── Bank transfer detail row (with optional copy-to-clipboard) ── */
function BankRow({ label, value, copyable }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="cr-bank-row">
      <span className="cr-bank-label">{label}</span>
      <span className="cr-bank-value">{value}</span>
      {copyable && (
        <button className="cr-copy-btn" onClick={copy} type="button">
          {copied ? '✓' : 'Copy'}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════ PAYMENT STAGE */
function PaymentStage({ config, transactionId, setTransactionId, screenshotFile, setScreenshotFile, errors, setErrors, onBack, onNext }) {
  const shotRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const copyUpi = () => {
    navigator.clipboard.writeText(config?.upiId || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshotFile(file);
    if (errors.screenshot) setErrors((er) => ({ ...er, screenshot: '' }));
  };

  const handleNext = () => {
    const e = {};
    if (!transactionId.trim()) e.transactionId = 'Transaction ID is required';
    else if (transactionId.trim().length < 6) e.transactionId = 'Must be at least 6 characters';
    else if (!/^[A-Za-z0-9\-_/]+$/.test(transactionId.trim()))
      e.transactionId = 'Only letters, digits, hyphens allowed';
    if (!screenshotFile) e.screenshot = 'Payment screenshot is required';
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onNext();
  };

  return (
    <div className="cr-stage-body">
      <div className="cr-preview-header">
        <h2 className="cr-preview-title">Payment Details</h2>
        <p className="cr-preview-sub">
          Pay the conference registration fee and upload proof of payment below.
        </p>
      </div>

      {/* Fee summary */}
      <div className="cr-fee-card">
        <div className="cr-fee-row">
          <span className="cr-fee-label">Conference Registration Fee</span>
          <span className="cr-fee-amount">₹{config?.fee ?? '—'}</span>
        </div>
        <div className="cr-fee-note">
          This fee covers your participation in all conference events. No additional event-level fees apply.
        </div>
      </div>

      {/* QR + UPI */}
      <div className="cr-payment-box">
        <div className="cr-qr-column">
          <p className="cr-qr-label">Scan to pay via any UPI app</p>
          <div className="cr-qr-frame">
            <img src="/qr-code.png" alt="Payment QR Code" className="cr-qr-image" />
          </div>
        </div>
        <div className="cr-upi-column">
          <p className="cr-upi-head">Or pay directly to UPI ID</p>
          <div className="cr-upi-box">
            <span className="cr-upi-id">{config?.upiId || 'loading…'}</span>
            <button className="cr-copy-btn" onClick={copyUpi} type="button">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className="cr-upi-note">
            After payment, note the <strong>Transaction / UTR reference number</strong> from your UPI app.
          </p>
        </div>
      </div>

      {/* Bank transfer (NEFT/RTGS/IMPS) */}
      <div className="cr-bank-box">
        <p className="cr-upi-head">Or pay via bank transfer (NEFT / RTGS / IMPS)</p>
        <div className="cr-bank-grid">
          <BankRow label="Account Name" value="IIChE Amethi Regional Centre" />
          <BankRow label="Account Number" value="41034315495" copyable />
          <BankRow label="IFSC Code" value="SBIN0004042" copyable />
          <BankRow label="MICR Code" value="227002251" />
          <BankRow label="Bank Name" value="State Bank of India" />
          <BankRow label="Branch" value="Jais" />
          <BankRow label="District" value="Rae Bareli" />
          <BankRow label="Address" value="RGIPT, Jais, Amethi" />
        </div>
        <p className="cr-upi-note">
          After transfer, note the <strong>Transaction / UTR reference number</strong> from your bank.
        </p>
      </div>

      {/* Upload form */}
      <div className="cr-section">
        <div className="cr-section-head">
          <span className="cr-section-num">05</span>
          <h2 className="cr-section-title">Upload Payment Proof</h2>
        </div>
        <div className="cr-section-body">
          <div className="cr-grid-2">
            <Field label="Transaction ID / UTR Number" required error={errors.transactionId}
              hint="Alphanumeric reference number shown in your UPI app (min 6 characters)">
              <input className="cr-input" type="text" value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  if (errors.transactionId) setErrors((er) => ({ ...er, transactionId: '' }));
                }}
                placeholder="e.g. 407614823745 or T2502181234" />
            </Field>

            <Field label="Payment Screenshot" required error={errors.screenshot}
              hint="JPG, PNG or PDF — max 5 MB">
              <div className="cr-upload-box" onClick={() => shotRef.current?.click()}
                role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && shotRef.current?.click()}>
                <input ref={shotRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleShot} style={{ display: 'none' }} />
                {screenshotFile ? (
                  <FileThumbnail file={screenshotFile} />
                ) : (
                  <div className="cr-upload-placeholder">
                    <span className="cr-upload-icon">⬆</span>
                    <span>Click to upload payment screenshot</span>
                  </div>
                )}
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div className="cr-alert cr-alert-warn">
        Ensure the screenshot clearly shows the transaction amount, date, and reference number.
        Unclear screenshots may result in rejection.
      </div>

      <div className="cr-nav cr-nav-between">
        <button className="cr-btn cr-btn-ghost" onClick={onBack}>← Back to Review</button>
        <button className="cr-btn cr-btn-primary" onClick={handleNext}>Proceed to Declaration →</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════ DECLARATION STAGE */
function DeclarationStage({ onBack, onSubmit, submitting, submitError }) {
  const [d1, setD1] = useState(false);
  const [d2, setD2] = useState(false);
  const canSubmit = d1 && d2 && !submitting;

  return (
    <div className="cr-stage-body">
      <div className="cr-preview-header">
        <h2 className="cr-preview-title">Declaration</h2>
        <p className="cr-preview-sub">
          Read and accept both declarations before submitting your registration.
        </p>
      </div>

      <div className="cr-decl-card">
        <label className="cr-decl-row">
          <input type="checkbox" className="cr-decl-check" checked={d1}
            onChange={(e) => setD1(e.target.checked)} />
          <span className="cr-decl-text">
            I hereby declare that the information provided by me is true and correct to the best of my
            knowledge. I understand that providing false information may result in cancellation of my
            registration without refund.
          </span>
        </label>
      </div>

      <div className="cr-decl-card">
        <label className="cr-decl-row">
          <input type="checkbox" className="cr-decl-check" checked={d2}
            onChange={(e) => setD2(e.target.checked)} />
          <span className="cr-decl-text">
            I acknowledge that my conference registration is non-cancellable and the registration fee
            is non-refundable under any circumstances, including withdrawal of participation.
          </span>
        </label>
      </div>

      {submitError && (
        <div className="cr-alert cr-alert-error">{submitError}</div>
      )}

      <div className="cr-nav cr-nav-between">
        <button className="cr-btn cr-btn-ghost" onClick={onBack} disabled={submitting}>
          ← Back to Payment
        </button>
        <button className="cr-btn cr-btn-submit" onClick={() => onSubmit(d1, d2)}
          disabled={!canSubmit}>
          {submitting
            ? <><span className="cr-spinner" /> Submitting…</>
            : 'Submit Registration'}
        </button>
      </div>

      {(!d1 || !d2) && (
        <p className="cr-decl-hint">Both declarations must be accepted to submit.</p>
      )}
    </div>
  );
}

/* ══════════════════════════════════ SUCCESS SCREEN */
function SuccessScreen({ confReg }) {
  return (
    <div className="cr-success">
      <div className="cr-success-icon">✓</div>
      <h1 className="cr-success-title">Conference Registration Submitted Successfully</h1>
      <div className="cr-success-status">
        Status: <strong>Pending Verification</strong>
      </div>

      <div className="cr-success-ref">
        <span className="cr-ref-label">Reference Number</span>
        <span className="cr-ref-value">{confReg?.referenceNumber || '—'}</span>
      </div>

      <div className="cr-success-msg">
        Your conference registration has been successfully submitted and is currently awaiting
        manual verification by the organizing committee.
        <br /><br />
        Once your payment has been verified, an administrator will assign your SRC ID.
        You will be able to register for conference events only after your Conference Registration
        has been approved.
      </div>

      <div className="cr-success-note">
        Do <strong>not</strong> share your reference number or Aadhaar details with anyone.
        The organizing team will never ask for your password.
      </div>

      <Link to="/dashboard" className="cr-btn cr-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '8px' }}>
        Go to Dashboard
      </Link>
    </div>
  );
}

/* ══════════════════════════════════ STATUS SCREENS */
function PendingScreen({ confReg }) {
  return (
    <div className="cr-status-screen cr-status-pending">
      <div className="cr-status-icon">⏳</div>
      <h2 className="cr-status-title">Your Registration is Under Review</h2>
      <p className="cr-status-sub">
        Your conference registration payment has been submitted and is being reviewed by
        the organizing committee. This usually takes 1–2 business days.
      </p>
      <div className="cr-status-details">
        <div className="cr-status-row">
          <span>Reference Number</span>
          <strong className="cr-mono">{confReg.referenceNumber || '—'}</strong>
        </div>
        <div className="cr-status-row">
          <span>Transaction ID</span>
          <strong className="cr-mono">{confReg.transactionId || '—'}</strong>
        </div>

        <div className="cr-status-row">
          <span>Registration Fee</span>
          <strong>₹{confReg.registrationFee ?? '—'}</strong>
        </div>
        <div className="cr-status-row">
          <span>Submitted</span>
          <strong>{confReg.paymentTimestamp ? formatDate(confReg.paymentTimestamp) : '—'}</strong>
        </div>
      </div>
      <Link to="/dashboard" className="cr-btn cr-btn-ghost" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}>
        Return to Dashboard
      </Link>
    </div>
  );
}

function ApprovedScreen({ confReg }) {
  return (
    <div className="cr-status-screen cr-status-approved">
      <div className="cr-status-icon cr-icon-approved">✓</div>
      <h2 className="cr-status-title">Registration Approved</h2>
      <p className="cr-status-sub">Your conference registration has been verified. You may now register for events.</p>
      <div className="cr-srcid-display">
        <span className="cr-srcid-label">Your SRC ID</span>
        <span className="cr-srcid-value">{confReg.srcId}</span>
      </div>
      <div className="cr-status-details">
        <div className="cr-status-row">
          <span>Reference Number</span>
          <strong className="cr-mono">{confReg.referenceNumber || '—'}</strong>
        </div>

        <div className="cr-status-row">
          <span>Approved On</span>
          <strong>{confReg.approvalTimestamp ? formatDate(confReg.approvalTimestamp) : '—'}</strong>
        </div>
      </div>
      <Link to="/register" className="cr-btn cr-btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}>
        Register for Events →
      </Link>
    </div>
  );
}

/* ══════════════════════════════════ ROOT COMPONENT */
export default function ConferenceRegistration() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [confReg, setConfReg] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stage, setStage] = useState(() => sessionStorage.getItem('cr_stage') || 'form');
  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem('cr_form');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: '', email: '', phone: '', dateOfBirth: '', gender: '',
      institute: '', course: '', yearOfStudy: '',
      aadhaarNumber: '', aicheId: '',
      city: '', state: '', country: 'India',
    };
  });
  const [errors, setErrors] = useState({});
  const [idCardFile, setIdCardFile] = useState(null);
  const [transactionId, setTxId] = useState(() => sessionStorage.getItem('cr_txId') || '');
  const [screenshotFile, setShot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitErr] = useState('');

  /* Load config + existing reg */
  useEffect(() => {
    setLoading(true);
    const fetchConfig = api.get('/conference-registration/config').catch(() => ({ data: {} }));
    const fetchReg = isAuthenticated
      ? api.get('/conference-registration').catch(() => ({ data: null }))
      : Promise.resolve({ data: null });

    Promise.all([fetchConfig, fetchReg])
      .then(([cfgRes, regRes]) => {
        setConfig(cfgRes.data || {});
        const reg = regRes.data || null;
        setConfReg(reg);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  /* Pre-fill form with existing user profile */
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name || '',
      email: f.email || user.email || '',
      phone: f.phone || user.phone || '',
      dateOfBirth: f.dateOfBirth || (user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''),
      gender: f.gender || user.gender || '',
      institute: f.institute || user.college || '',
      course: f.course || user.course || '',
      yearOfStudy: f.yearOfStudy || user.yearOfStudy || '',
      aicheId: f.aicheId || user.aicheId || '',
      city: f.city || user.city || '',
      state: f.state || user.state || '',
      country: f.country || user.country || 'India',
    }));
  }, [user]);

  /* Persist state to session storage */
  useEffect(() => {
    sessionStorage.setItem('cr_stage', stage);
  }, [stage]);

  useEffect(() => {
    sessionStorage.setItem('cr_form', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    sessionStorage.setItem('cr_txId', transactionId);
  }, [transactionId]);

  /* Scroll to top on stage change */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage]);

  if (authLoading || loading) {
    return (
      <div className="cr-page">
        <div className="cr-loader"><div className="auth-spinner" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="cr-page">
        <div className="cr-gate">
          <h1>Sign in to continue</h1>
          <p>You need an account to register for the conference.</p>
          <div className="cr-gate-btns">
            <Link to="/login" className="cr-btn cr-btn-primary" style={{ textDecoration: 'none' }}>Sign In</Link>
            <Link to="/signup" className="cr-btn cr-btn-ghost" style={{ textDecoration: 'none' }}>Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isEmailVerified) {
    return (
      <div className="cr-page">
        <div className="cr-gate">
          <h1>Verify your email first</h1>
          <p>Please verify your email address before registering for the conference.</p>
          <Link to="/dashboard" className="cr-btn cr-btn-primary" style={{ textDecoration: 'none' }}>Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  /* Status screens */
  if (confReg?.status === 'approved') return <div className="cr-page"><ApprovedScreen confReg={confReg} /></div>;
  if (confReg?.status === 'pending') return <div className="cr-page"><PendingScreen confReg={confReg} /></div>;

  /* Success screen after submission */
  if (stage === 'success') return <div className="cr-page"><SuccessScreen confReg={confReg} /></div>;

  const existingIdCard = user?.universityIdCardKey || '';

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitErr('');
    try {
      const fd = new FormData();
      /* Profile fields */
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      fd.append('dateOfBirth', form.dateOfBirth);
      fd.append('gender', form.gender);
      fd.append('institute', form.institute);
      fd.append('course', form.course);
      fd.append('yearOfStudy', form.yearOfStudy);
      fd.append('aadhaarNumber', form.aadhaarNumber.replace(/\s/g, ''));
      fd.append('aicheId', form.aicheId || '');
      fd.append('city', form.city);
      fd.append('state', form.state);
      fd.append('country', form.country);
      /* Payment */
      fd.append('transactionId', transactionId.trim());
      fd.append('screenshot', screenshotFile);
      /* ID card (optional on re-submission) */
      if (idCardFile) fd.append('universityIdCard', idCardFile);

      const res = await api.upload('/conference-registration', fd);
      sessionStorage.removeItem('cr_stage');
      sessionStorage.removeItem('cr_form');
      sessionStorage.removeItem('cr_txId');
      setConfReg(res.data);
      setStage('success');
    } catch (err) {
      setSubmitErr(err instanceof ApiError ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cr-page">
      {/* Page header */}
      <div className="cr-header">
        <div className="cr-header-inner">
          <div className="cr-header-org">AIChE India SRC 2026</div>
          <h1 className="cr-header-title">Conference Registration</h1>
          <p className="cr-header-sub">VIPLAV '26 — Student Regional Conference</p>
        </div>
      </div>

      {/* Sticky progress */}
      <div className="cr-progress-wrap">
        <div className="cr-progress-inner">
          <ProgressBar stage={stage} />
        </div>
      </div>

      {/* Main content */}
      <div className="cr-content">
        {stage === 'form' && (
          <FormStage
            form={form} setForm={setForm}
            errors={errors} setErrors={setErrors}
            idCardFile={idCardFile} setIdCardFile={setIdCardFile}
            existingIdCard={existingIdCard}
            confReg={confReg}
            onNext={() => setStage('preview')}
          />
        )}
        {stage === 'preview' && (
          <PreviewStage
            form={form}
            idCardFile={idCardFile}
            existingIdCard={existingIdCard}
            onBack={() => setStage('form')}
            onNext={() => setStage('payment')}
          />
        )}
        {stage === 'payment' && (
          <PaymentStage
            config={config}
            transactionId={transactionId} setTransactionId={setTxId}
            screenshotFile={screenshotFile} setScreenshotFile={setShot}
            errors={errors} setErrors={setErrors}
            onBack={() => setStage('preview')}
            onNext={() => setStage('declaration')}
          />
        )}
        {stage === 'declaration' && (
          <DeclarationStage
            onBack={() => setStage('payment')}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </div>
    </div>
  );
}
