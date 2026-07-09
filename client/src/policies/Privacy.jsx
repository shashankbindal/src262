import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../shared/useDocumentTitle.js';
import './policies.css';

const LAST_UPDATED = 'July 9, 2026';

const SECTIONS = [
  ['who-we-are', 'Who We Are'],
  ['information-we-collect', 'Information We Collect'],
  ['how-we-use-information', 'How We Use Your Information'],
  ['sensitive-personal-data', 'Sensitive Personal Data'],
  ['cookies', 'Cookies & Similar Technologies'],
  ['how-we-share', 'How We Share Information'],
  ['data-storage', 'Data Storage & Transfers'],
  ['data-retention', 'Data Retention'],
  ['data-security', 'Data Security'],
  ['your-rights', 'Your Rights & Choices'],
  ['childrens-privacy', "Children's Privacy"],
  ['third-party-links', 'Third-Party Links'],
  ['changes', 'Changes to This Policy'],
  ['contact', 'Grievance Officer & Contact'],
];

export default function PrivacyPolicy() {
  useDocumentTitle('Privacy Policy | VIPLAV 2026 — AIChE India SRC');

  return (
    <div className="legal-page">
      <span className="legal-eyebrow">Legal</span>
      <h1 className="legal-title">Privacy Policy</h1>
      <p className="legal-updated">Last updated: {LAST_UPDATED} · Applies to www.viplavsrc.com</p>

      <div className="legal-intro">
        <p>
          This Privacy Policy explains how the <strong>AIChE RGIPT Student Chapter</strong> ("VIPLAV
          2026", "SRC 2026", "we", "us", "our") collects, uses, stores, and shares information when you
          visit <strong>viplavsrc.com</strong>, create an account, register for AIChE India's Student
          Regional Conference 2026 ("the Conference"), register for individual events, submit competition
          entries, or otherwise interact with us.
        </p>
        <p>
          By using this website you agree to the collection and use of information as described here. If
          you do not agree, please do not use the site. This Policy should be read alongside our{' '}
          <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>.
        </p>
      </div>

      <nav className="legal-toc" aria-label="Table of contents">
        <h2>On this page</h2>
        <ol>
          {SECTIONS.map(([id, label]) => (
            <li key={id}><a href={`#${id}`}>{label}</a></li>
          ))}
        </ol>
      </nav>

      <section id="who-we-are" className="legal-section">
        <h2><span className="legal-num">01</span> Who We Are</h2>
        <p>
          VIPLAV 2026 is organized by the <strong>AIChE RGIPT Student Chapter</strong> at the Rajiv Gandhi
          Institute of Petroleum Technology (RGIPT), Jais, Amethi, Uttar Pradesh, India. For the purposes
          of applicable data protection law, the organizing chapter acts as the data fiduciary/controller
          for personal data collected through this website. Registration payments are processed manually
          against a bank/UPI account held on behalf of the organizing committee, as displayed on the
          Conference Registration page at the time of payment.
        </p>
      </section>

      <section id="information-we-collect" className="legal-section">
        <h2><span className="legal-num">02</span> Information We Collect</h2>
        <p>We collect information you provide directly, and a limited amount of information automatically.</p>

        <h3>Account information</h3>
        <ul>
          <li>Name, email address, and password (stored as a salted hash — we never store your plain-text password).</li>
          <li>If you use "Sign in with Google", your Google account identifier and the profile details Google shares with us.</li>
          <li>Profile picture, phone number, college/institute, and department, if you choose to add them.</li>
        </ul>

        <h3>Conference registration information</h3>
        <p>To register for the Conference and generate your delegate ID card, we collect:</p>
        <ul>
          <li>Date of birth, gender, programme/course, and year of study.</li>
          <li>Student chapter name and your faculty advisor's name and email.</li>
          <li>Your AIChE membership ID (where applicable) and city/state/country.</li>
          <li>A passport-style photograph, used solely to generate your conference ID card.</li>
          <li>A scan/photo of your university ID card, used to verify your student status.</li>
          <li>Government identity type and number (Aadhaar or Passport) — see <a href="#sensitive-personal-data">Section 4</a> below.</li>
          <li>Merchandise size, and whether you have opted into the accommodation add-on.</li>
        </ul>

        <h3>Payment information</h3>
        <p>
          We do <strong>not</strong> collect or store card, UPI PIN, or net-banking credentials. Registration
          fees are paid directly by you via UPI or bank transfer to the account shown on the Conference
          Registration page. We ask you to upload a screenshot of the payment confirmation and enter the
          transaction/UTR reference number so an organizer can manually verify it.
        </p>

        <h3>Event registrations, teams &amp; submissions</h3>
        <ul>
          <li>The events you register for, and — for team-based events such as Chem-E-Car or Chem-E-Jeopardy — your teammates' details.</li>
          <li>Files you upload for paper/poster/competition submissions (file name, type, size, and content).</li>
        </ul>

        <h3>Contact form</h3>
        <p>If you write to us through the Contact page, we collect your name, email address, and message.</p>

        <h3>Automatically collected information</h3>
        <p>
          We use essential cookies to keep you signed in (see <a href="#cookies">Section 5</a>), and
          privacy-preserving website analytics (Vercel Web Analytics) to understand aggregate traffic
          patterns. Our servers also log standard technical data such as IP address, browser type, and
          request timestamps for security and troubleshooting.
        </p>
      </section>

      <section id="how-we-use-information" className="legal-section">
        <h2><span className="legal-num">03</span> How We Use Your Information</h2>
        <ul>
          <li>Create and secure your account, and authenticate you when you sign in.</li>
          <li>Process, review, and approve or reject your Conference registration and generate your SRC ID / QR delegate card.</li>
          <li>Register you for individual events and competitions, form and manage team rosters, and accept your submissions.</li>
          <li>Verify your payment and, where selected, arrange accommodation.</li>
          <li>Send transactional emails — OTP verification, password resets, and registration approval/rejection notices.</li>
          <li>Verify your identity and student status for venue security and to prevent fraudulent registrations.</li>
          <li>Respond to enquiries submitted through the Contact page.</li>
          <li>Maintain records required for the Conference's financial, safety, and administrative purposes.</li>
          <li>Understand aggregate site usage so we can improve the website.</li>
        </ul>
        <p>We do not use your information for automated decision-making that produces legal effects, and we do not sell your personal data.</p>
      </section>

      <section id="sensitive-personal-data" className="legal-section">
        <h2><span className="legal-num">04</span> Sensitive Personal Data</h2>
        <div className="legal-callout">
          <p>
            Your government ID number (Aadhaar or Passport) is treated as sensitive personal data. It is
            collected solely to verify your identity for delegate check-in and venue security, is never
            returned by our systems in any account or admin view by default, and is accessible only to a
            limited set of authorized organizers who handle registration approvals.
          </p>
        </div>
        <p>
          You may decline to provide a government ID number, but doing so may prevent us from approving
          your Conference registration or issuing a delegate ID card. Do not upload identity documents
          containing information about anyone other than yourself without their consent.
        </p>
      </section>

      <section id="cookies" className="legal-section">
        <h2><span className="legal-num">05</span> Cookies &amp; Similar Technologies</h2>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
            </thead>
            <tbody>
              <tr><td>accessToken</td><td>Keeps you signed in to your account (HTTP-only, secure).</td><td>15 minutes</td></tr>
              <tr><td>refreshToken</td><td>Renews your session without asking you to log in again (HTTP-only, secure).</td><td>7 days</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          These authentication cookies are strictly necessary for the site to function and are not used
          for advertising or cross-site tracking. We also use Vercel Web Analytics, a cookieless,
          aggregate analytics service, to understand overall traffic — it does not build an individual
          profile of you. We do not run third-party advertising trackers on this site.
        </p>
      </section>

      <section id="how-we-share" className="legal-section">
        <h2><span className="legal-num">06</span> How We Share Information</h2>
        <p>We do not sell your personal data. We share it only in the following circumstances:</p>
        <ul>
          <li><strong>Organizing team:</strong> Volunteer organizers and admins of AIChE RGIPT Student Chapter access registration data as needed to review, approve, or reject registrations and to run the Conference.</li>
          <li><strong>Service providers</strong> who process data on our behalf, under confidentiality obligations:
            <ul>
              <li>Cloudinary — stores uploaded photos, ID documents, payment screenshots, and submission files.</li>
              <li>Resend — delivers transactional emails (OTP, password reset, approval/rejection notices).</li>
              <li>Google — provides "Sign in with Google" authentication, if you choose to use it.</li>
              <li>MongoDB Atlas — hosts our application database.</li>
              <li>Vercel and Render — host the website frontend and backend, and provide website analytics.</li>
            </ul>
          </li>
          <li><strong>Legal requirements:</strong> We may disclose information if required by law, regulation, legal process, or a governmental request, or to protect the rights, property, or safety of participants, organizers, or the public.</li>
          <li><strong>With your direction:</strong> For example, your name and college may appear on public leaderboards, participant lists, or certificates as part of standard conference operations, unless you ask us not to.</li>
        </ul>
      </section>

      <section id="data-storage" className="legal-section">
        <h2><span className="legal-num">07</span> Data Storage &amp; Transfers</h2>
        <p>
          Our service providers may store and process data on servers located outside India. Where this
          happens, we rely on the provider's own security and privacy commitments, and only work with
          providers who offer appropriate safeguards for the data we share with them.
        </p>
      </section>

      <section id="data-retention" className="legal-section">
        <h2><span className="legal-num">08</span> Data Retention</h2>
        <p>
          We retain your account and registration data for as long as your account is active and for a
          reasonable period after the Conference concludes, to handle disputes, certificates, and
          administrative or audit follow-ups. Payment records and related identity verification data may
          be retained longer where needed for financial record-keeping. When data is no longer needed for
          these purposes, we delete or anonymize it.
        </p>
      </section>

      <section id="data-security" className="legal-section">
        <h2><span className="legal-num">09</span> Data Security</h2>
        <p>
          We apply industry-standard safeguards, including encrypted connections (HTTPS), salted password
          hashing, HTTP-only session cookies, rate limiting, input sanitization, and restricted admin
          access to sensitive fields such as government ID numbers. No method of transmission or storage
          is 100% secure, so while we work hard to protect your data, we cannot guarantee absolute
          security.
        </p>
      </section>

      <section id="your-rights" className="legal-section">
        <h2><span className="legal-num">10</span> Your Rights &amp; Choices</h2>
        <ul>
          <li><strong>Access &amp; correction:</strong> You can review and update most profile and registration details from your Dashboard while your registration is not yet locked/approved.</li>
          <li><strong>Withdraw consent:</strong> You may withdraw consent for optional data (e.g., profile picture) at any time; this does not affect processing already carried out.</li>
          <li><strong>Deletion:</strong> You may request deletion of your account and associated data by emailing us, subject to records we are required to keep for financial, legal, or safety reasons (for example, approved registration and payment records for the current conference cycle).</li>
          <li><strong>Grievances:</strong> If you believe your data has been misused, contact our Grievance Officer below.</li>
        </ul>
      </section>

      <section id="childrens-privacy" className="legal-section">
        <h2><span className="legal-num">11</span> Children's Privacy</h2>
        <p>
          This website's account and Conference registration features are intended for undergraduate and
          postgraduate students and are not directed at children. Our K-12 STEM outreach activities are
          coordinated with schools and accompanying faculty/parents, and we do not knowingly collect
          personal data directly from children through this website outside of that supervised context.
          If you believe a child has provided us personal data without appropriate consent, please contact
          us and we will delete it.
        </p>
      </section>

      <section id="third-party-links" className="legal-section">
        <h2><span className="legal-num">12</span> Third-Party Links</h2>
        <p>
          Our website may link to third-party sites (for example, sponsor websites, WhatsApp groups, or
          social media). We are not responsible for the privacy practices of those third parties, and we
          encourage you to review their policies separately.
        </p>
      </section>

      <section id="changes" className="legal-section">
        <h2><span className="legal-num">13</span> Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or for
          legal reasons. We will update the "Last updated" date above when we do, and material changes
          will be highlighted on this page.
        </p>
      </section>

      <div className="legal-crosslink">
        See also our <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>, which govern your use
        of this website and participation in VIPLAV 2026.
      </div>

      <div id="contact" className="legal-contact">
        <h2>Grievance Officer &amp; Contact</h2>
        <p>
          For any privacy questions, data requests, or grievances, reach out to the SRC 2026 Organizing
          Secretariat, AIChE RGIPT Student Chapter:
        </p>
        <a className="legal-contact-link" href="mailto:aiche@rgipt.ac.in">aiche@rgipt.ac.in ↗</a>
        <p className="legal-contact-meta">
          Rajiv Gandhi Institute of Petroleum Technology (RGIPT), Jais, Amethi, Uttar Pradesh, India
        </p>
      </div>
    </div>
  );
}
