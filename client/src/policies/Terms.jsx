import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../shared/useDocumentTitle.js';
import './policies.css';

const LAST_UPDATED = 'July 9, 2026';

const SECTIONS = [
  ['acceptance', 'Acceptance of Terms'],
  ['eligibility', 'Eligibility'],
  ['accounts', 'Account Registration'],
  ['registration-fees', 'Conference Registration & Fees'],
  ['cancellation-refunds', 'Cancellation & Refund Policy'],
  ['accommodation', 'Accommodation'],
  ['events-conduct', 'Event Participation & Code of Conduct'],
  ['submissions-ip', 'Submissions & Intellectual Property'],
  ['media-consent', 'Photography & Media Consent'],
  ['merchandise', 'Merchandise'],
  ['disclaimers', 'Disclaimers & Limitation of Liability'],
  ['suspension', 'Suspension & Termination'],
  ['site-ip', 'Website Intellectual Property'],
  ['governing-law', 'Governing Law & Jurisdiction'],
  ['changes', 'Changes to These Terms'],
  ['contact', 'Contact Us'],
];

export default function TermsConditions() {
  useDocumentTitle('Terms & Conditions | VIPLAV 2026 — AIChE India SRC');

  return (
    <div className="legal-page">
      <span className="legal-eyebrow">Legal</span>
      <h1 className="legal-title">Terms &amp; Conditions</h1>
      <p className="legal-updated">Last updated: {LAST_UPDATED} · Applies to www.viplavsrc.com</p>

      <div className="legal-intro">
        <p>
          These Terms &amp; Conditions ("Terms") govern your access to and use of{' '}
          <strong>viplavsrc.com</strong> and your registration for and participation in{' '}
          <strong>VIPLAV 2026 — AIChE India's Student Regional Conference</strong>, hosted by the AIChE
          RGIPT Student Chapter at Rajiv Gandhi Institute of Petroleum Technology (RGIPT), Jais, Amethi,
          Uttar Pradesh, from 21–23 August 2026 ("the Conference").
        </p>
        <p>
          Please also read our <Link to="/privacy-policy">Privacy Policy</Link>, which explains how we
          handle your personal data and forms part of these Terms by reference.
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

      <section id="acceptance" className="legal-section">
        <h2><span className="legal-num">01</span> Acceptance of Terms</h2>
        <p>
          By creating an account, registering for the Conference, registering for an individual event, or
          otherwise using this website, you agree to be bound by these Terms. If you do not agree, please
          do not use the site or register for the Conference.
        </p>
      </section>

      <section id="eligibility" className="legal-section">
        <h2><span className="legal-num">02</span> Eligibility</h2>
        <p>
          The Conference is primarily open to undergraduate and postgraduate students of chemical
          engineering and allied fields. Some competitions and outreach activities (such as our K-12 STEM
          outreach) have their own eligibility criteria, described on the relevant Events page — those
          criteria control where they differ from this section. By registering, you confirm that the
          information you provide about your institution, programme, and year of study is accurate.
        </p>
      </section>

      <section id="accounts" className="legal-section">
        <h2><span className="legal-num">03</span> Account Registration</h2>
        <ul>
          <li>You must create an account with accurate, current information to register for the Conference or individual events.</li>
          <li>You are responsible for maintaining the confidentiality of your password and for all activity under your account.</li>
          <li>One account per participant. Do not create multiple accounts or register on behalf of someone else without their authorization.</li>
          <li>Notify us promptly at <a href="mailto:aiche@rgipt.ac.in">aiche@rgipt.ac.in</a> if you suspect unauthorized access to your account.</li>
        </ul>
      </section>

      <section id="registration-fees" className="legal-section">
        <h2><span className="legal-num">04</span> Conference Registration &amp; Fees</h2>
        <p>
          The Conference registration fee (with or without the accommodation add-on) is displayed to you
          on the Conference Registration page before you pay, and covers your participation in all
          Conference events unless stated otherwise.
        </p>
        <ul>
          <li>We do not process card payments. Fees are payable only via the UPI ID or bank transfer (NEFT/RTGS/IMPS) details shown on the Conference Registration page — never send payment to any other account or individual.</li>
          <li>After paying, you must upload a clear screenshot of the payment confirmation and enter the transaction/UTR reference number so an organizer can verify it.</li>
          <li>Your registration remains in <strong>pending</strong> status until an organizer manually reviews and approves it. We may request corrections if the payment proof or submitted details are unclear or inconsistent.</li>
          <li>Providing false information on your registration may result in rejection or cancellation of your registration.</li>
          <li>Once approved, your registration and payment details are locked and cannot be edited; your SRC ID and delegate QR card are issued after approval.</li>
        </ul>
      </section>

      <section id="cancellation-refunds" className="legal-section">
        <h2><span className="legal-num">05</span> Cancellation &amp; Refund Policy</h2>
        <div className="legal-callout">
          <p>
            <strong>All Conference registrations are non-cancellable, and registration fees are
            non-refundable under any circumstances</strong>, including voluntary withdrawal, inability to
            attend, travel disruption, or visa/travel document issues. This applies regardless of whether
            your registration has been approved.
          </p>
        </div>
        <p>
          If your registration is rejected due to a submission error (for example, an unclear payment
          screenshot or incorrect details), you will be asked to correct and resubmit it — this is not a
          cancellation, and no new payment is required unless the original payment itself cannot be
          verified.
        </p>
      </section>

      <section id="accommodation" className="legal-section">
        <h2><span className="legal-num">06</span> Accommodation</h2>
        <p>
          Accommodation is an optional add-on selected at the time of Conference registration and is
          subject to availability. Details of accommodation arrangements will be communicated to
          registered delegates closer to the event. The accommodation fee is included in your total
          registration fee and is likewise non-refundable, as described in{' '}
          <a href="#cancellation-refunds">Section 5</a>.
        </p>
      </section>

      <section id="events-conduct" className="legal-section">
        <h2><span className="legal-num">07</span> Event Participation &amp; Code of Conduct</h2>
        <p>
          Specific rules, formats, team-size limits, and deadlines for each competition (Chem-E-Car,
          Chem-E-Jeopardy, paper and poster presentations, and other events) are published on the Events
          page and may be updated by the organizing team from time to time; participants are responsible
          for reviewing the current rules for the events they register for.
        </p>
        <p>By participating in the Conference and its events, you agree to:</p>
        <ul>
          <li>Treat fellow participants, organizers, volunteers, judges, and sponsors with courtesy and respect.</li>
          <li>Not engage in harassment, discrimination, unsafe conduct, cheating, or plagiarism.</li>
          <li>Follow venue rules, safety instructions, and instructions from organizers at all times, including during technical competitions involving equipment (e.g., Chem-E-Car).</li>
          <li>Comply with any additional guidelines issued for K-12 outreach sessions when interacting with school participants.</li>
        </ul>
        <p>
          We reserve the right to disqualify a participant or team, or remove any person from the venue,
          for violating this Code of Conduct, without refund.
        </p>
      </section>

      <section id="submissions-ip" className="legal-section">
        <h2><span className="legal-num">08</span> Submissions &amp; Intellectual Property</h2>
        <p>
          You retain ownership of papers, posters, presentations, and other materials you submit for
          competitions ("Submissions"). By submitting, you confirm the Submission is your own original
          work (or your team's), does not infringe any third party's rights, and you grant the organizing
          committee a non-exclusive, royalty-free license to review, judge, display, and archive your
          Submission for purposes connected to the Conference, including publishing results, excerpts, or
          winning entries for promotional and academic purposes with appropriate credit.
        </p>
      </section>

      <section id="media-consent" className="legal-section">
        <h2><span className="legal-num">09</span> Photography &amp; Media Consent</h2>
        <p>
          Photographs and videos may be taken during Conference sessions and events for documentation,
          reporting, and promotional purposes (including on our website and social media). By attending,
          you consent to the organizing committee capturing and using such media featuring you in this
          way. If you'd prefer not to be featured, please inform an organizer on-site.
        </p>
      </section>

      <section id="merchandise" className="legal-section">
        <h2><span className="legal-num">10</span> Merchandise</h2>
        <p>
          Merchandise size selections made during registration are final at the time production begins.
          Merchandise is distributed on-site to approved, checked-in delegates; we are not responsible for
          items unclaimed after the Conference concludes.
        </p>
      </section>

      <section id="disclaimers" className="legal-section">
        <h2><span className="legal-num">11</span> Disclaimers &amp; Limitation of Liability</h2>
        <p>
          The website and Conference are provided on an "as is" and "as available" basis. While we take
          reasonable care to keep information accurate and the website secure, we do not guarantee
          uninterrupted or error-free operation, and schedules, venues, or event formats may change.
        </p>
        <p>
          To the maximum extent permitted by law, the AIChE RGIPT Student Chapter, its organizers, and
          volunteers are not liable for indirect, incidental, or consequential loss (including travel,
          accommodation, or opportunity costs) arising from your use of this website or participation in
          the Conference, except where such liability cannot be excluded by law. Participants are advised
          to arrange their own travel and personal insurance.
        </p>
      </section>

      <section id="suspension" className="legal-section">
        <h2><span className="legal-num">12</span> Suspension &amp; Termination</h2>
        <p>
          We may suspend or terminate your account or Conference registration, without refund, if you
          violate these Terms, provide false information, or engage in conduct that endangers or disrupts
          other participants or the event.
        </p>
      </section>

      <section id="site-ip" className="legal-section">
        <h2><span className="legal-num">13</span> Website Intellectual Property</h2>
        <p>
          The VIPLAV name and logo, site design, and original content on this website belong to the AIChE
          RGIPT Student Chapter unless otherwise credited (for example, sponsor logos, which remain the
          property of their respective owners). You may not reproduce or repurpose this content for
          commercial use without our written permission.
        </p>
      </section>

      <section id="governing-law" className="legal-section">
        <h2><span className="legal-num">14</span> Governing Law &amp; Jurisdiction</h2>
        <p>
          These Terms are governed by the laws of India. Any disputes arising out of or relating to these
          Terms, the website, or the Conference shall be subject to the exclusive jurisdiction of the
          courts having jurisdiction over Amethi/Rae Bareli, Uttar Pradesh, India.
        </p>
      </section>

      <section id="changes" className="legal-section">
        <h2><span className="legal-num">15</span> Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time, including to reflect changes in event logistics or
          fees. We will update the "Last updated" date above when we do. Continued use of the site or
          participation in the Conference after changes are posted constitutes acceptance of the revised
          Terms.
        </p>
      </section>

      <div className="legal-crosslink">
        See also our <Link to="/privacy-policy">Privacy Policy</Link>, which explains how we collect and
        use your personal data.
      </div>

      <div id="contact" className="legal-contact">
        <h2>Contact Us</h2>
        <p>
          For questions about these Terms, registration, or the Conference, reach out to the SRC 2026
          Organizing Secretariat, AIChE RGIPT Student Chapter:
        </p>
        <a className="legal-contact-link" href="mailto:aiche@rgipt.ac.in">aiche@rgipt.ac.in ↗</a>
        <p className="legal-contact-meta">
          Rajiv Gandhi Institute of Petroleum Technology (RGIPT), Jais, Amethi, Uttar Pradesh, India
        </p>
      </div>
    </div>
  );
}
