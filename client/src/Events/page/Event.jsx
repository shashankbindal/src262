'use strict';
import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import '../../Home/animations.css';
import './Event.css';

const PAD = (n) => String(n + 1).padStart(2, '0');
const TOTAL = 5;

const EVENTS = [
  {
    id: 1,
    tag: 'Chemical Energy · Design',
    heroTitle: ['CHEM-E-CAR', 'COMPETITION'],
    shortDesc:
      'Design and build a vehicle powered entirely by chemical reactions — combining innovation, precision engineering, and creative problem-solving.',
    title: 'Chem-E-Car Competition',
    description:
      'A flagship AIChE event that challenges students to design and build a small vehicle powered and controlled entirely by chemical reactions. Combining innovation, engineering design, and problem-solving, the competition showcases the practical application of chemical engineering principles in a fun and competitive environment.Participants apply technical knowledge, creativity, and teamwork to solve real-world engineering problems.',
    image:
      'https://www.aiche.org/sites/default/files/images/conference/event/23370477461_f16f1dd228_z.jpg',
    rulebookLink: '#',
    chairs: [
      { role: 'Chair (External)', name: 'Divisha Tiwari' },
      { role: 'Chair (Internal)', name: 'Tapesh Kumar' },
    ],
    coordinators: [{ role: 'Coordinator', name: 'Ananya Priyam Mishra' }],
  },
  {
    id: 2,
    tag: 'STEM Outreach · Education',
    heroTitle: ['K-12 STEM', 'COMPETITION'],
    shortDesc:
      'Undergraduate teams design interactive STEM experiences for young minds — inspiring curiosity from kindergarten through grade 12.',
    title: 'K-12 Competition',
    description: (
      <>
        <p>
          The AIChE K-12 competition invites undergraduate chemical engineering innovators to design and present interactive, high-impact STEM projects tailored for young minds. Aimed at age groups ranging from kindergarten to grade 12, teams will demonstrate complex scientific principles through engaging working models, live demonstrations, or creative posters. Teams will demonstrate complex scientific principles through engaging working models, live demonstrations, or creative posters across four specific student categories:
        </p>
        <ul style={{ margin: '12px 0', paddingLeft: '24px' }}>
          <li><strong>Curious Minds</strong> (KG–Grade 2)</li>
          <li><strong>Emerging Sparks</strong> (Grade 3–Grade 5)</li>
          <li><strong>Critical Thinkers</strong> (Grade 6–Grade 8)</li>
          <li><strong>Future Engineers</strong> (Grade 9–Grade 12)</li>
        </ul>
        <p>
          The event challenges future engineers to translate real-world problem-solving into safe, student-friendly, and educational experiences that cultivate a lifelong curiosity for science and technology.
        </p>
      </>
    ),
    image:
      'https://learningliftoff.com/wp-content/uploads/2023/01/pexels-artem-podrez-6941450-1536x864.jpg.webp',
    rulebookLink: '#',
    chairs: [{ role: 'Chair', name: 'Kartik Gogia' }],
    coordinators: [
      { role: 'Coordinator', name: 'Prashant Vishwakarma' },
      { role: 'Coordinator', name: 'Deepti Tomar' },
    ],
  },
  {
    id: 3,
    tag: 'Visual Communication · Research',
    heroTitle: ['POSTER', 'PRESENTATION'],
    shortDesc:
      'Transform complex research into compelling visual narratives — communicate science with precision, creativity, and lasting impact.',
    title: 'Poster Presentation Competition',
    description:
      'The Poster Presentation Competition transforms complex ideas into compelling visual narratives. Participants communicate their research, projects, and innovative concepts through concise and impactful poster designs, engaging both judges and peers. The event promotes effective scientific communication, creativity, and interdisciplinary collaboration while highlighting emerging trends and innovations in engineering and technology.',
    image:
      'https://images.unsplash.com/photo-1771344488060-f6b32a503b34?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0',
    rulebookLink: '#',
    chairs: [],
    coordinators: [],
  },
  {
    id: 4,
    tag: 'Research · Engineering Discourse',
    heroTitle: ['TECHNICAL PAPER', 'PRESENTATION'],
    shortDesc:
      'Present original research before expert panels — fostering scientific dialogue, critical thinking, and engineering excellence.',
    title: 'Technical Paper Presentation Competition',
    description:
      'The Technical Paper Presentation provides a platform for students to showcase original research, innovative methodologies, and cutting-edge developments in chemical engineering and allied disciplines. Participants present their work before a panel of experts, fostering scientific dialogue, critical thinking, and knowledge exchange. The competition celebrates research excellence while encouraging students to address real-world challenges through engineering solutions.',
    image:
      'https://images.unsplash.com/photo-1515603403036-f3d35f75ca52?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0',
    rulebookLink: '#',
    chairs: [{ role: 'Chair', name: 'Omika Singh' }],
    coordinators: [
      { role: 'Coordinator', name: 'Aditya Raj' },
      { role: 'Coordinator', name: 'Anshu Kumari' },
    ],
  },
  {
    id: 5,
    tag: 'Trivia · Strategy · Speed',
    heroTitle: ['CHEM-E', 'JEOPARDY'],
    shortDesc:
      'Fast-paced academic trivia — think critically, respond instantly, and outperform your peers in this Jeopardy-style battle.',
    title: 'Chem-E-Jeopardy Competition',
    description:
      'ChemE Jeopardy is a fast-paced academic competition that challenges participants to think critically, respond quickly, and apply their knowledge in a fun and engaging format. Inspired by the popular Jeopardy-style game, teams compete by identifying the correct questions to given answers while demonstrating teamwork, strategy, and problem-solving skills. The event provides a platform for students to showcase their abilities and learn from their peers.',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5jUsij8b-x-PBqn3yMZbAYUwfyACiF3GPAw&s',
    rulebookLink: '#',
    chairs: [{ role: 'Chair', name: 'Shreeyanshi Tripathi' }],
    coordinators: [{ role: 'Coordinator', name: 'Haritha Sree Vakati' }],
  },
];

export default function Event() {
  const [active, setActive]       = useState(0);
  const [animating, setAnimating] = useState(false);

  /* Background layers */
  const bgCurrRef = useRef(null);
  const bgNextRef = useRef(null);
  /* Card-expand overlay (fixed, full-viewport) */
  const expandRef = useRef(null);
  /* Left-content text elements */
  const titleRef  = useRef(null);
  const descRef   = useRef(null);
  const btnRef    = useRef(null);
  /* Card stack */
  const stackRef  = useRef(null);
  /* Per-card refs for bounding rect */
  const cardRefs  = useRef([]);

  /* ── Enter animation (runs after active changes & DOM commits) ─────────── */
  useEffect(() => {
    const textEls = [titleRef.current, descRef.current, btnRef.current].filter(Boolean);

    gsap.fromTo(
      textEls,
      { y: 55, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.72, stagger: 0.1, ease: 'power3.out' }
    );

    if (stackRef.current && stackRef.current.children.length) {
      gsap.fromTo(
        Array.from(stackRef.current.children),
        { x: 45, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.09, ease: 'power3.out', delay: 0.12 }
      );
    }
  }, [active]);

  /* ── Navigate to a new index ───────────────────────────────────────────── */
  const goto = (nextIdx, cardEl = null) => {
    if (animating || nextIdx === active) return;
    setAnimating(true);

    const nextEvent = EVENTS[nextIdx];

    /* Exit current text */
    gsap.to(
      [titleRef.current, descRef.current, btnRef.current].filter(Boolean),
      { y: -38, opacity: 0, duration: 0.3, stagger: 0.05, ease: 'power2.in' }
    );

    /* Called when the transition is fully complete */
    const finish = () => {
      if (bgCurrRef.current) {
        bgCurrRef.current.style.backgroundImage = `url(${nextEvent.image})`;
        gsap.set(bgCurrRef.current, { opacity: 1, scale: 1 });
      }
      if (bgNextRef.current) gsap.set(bgNextRef.current, { opacity: 0 });
      if (expandRef.current) gsap.set(expandRef.current, { display: 'none', opacity: 0 });
      setActive(nextIdx);
      setAnimating(false);
    };

    if (cardEl) {
      /* ── Card-expands-to-background ───────────────────────────────── */
      const rect = cardEl.getBoundingClientRect();
      const vw   = window.innerWidth;
      const vh   = window.innerHeight;
      const sx   = rect.width  / vw;
      const sy   = rect.height / vh;
      const tx   = rect.left + rect.width  / 2 - vw / 2;
      const ty   = rect.top  + rect.height / 2 - vh / 2;

      gsap.set(expandRef.current, {
        display: 'block',
        opacity: 1,
        backgroundImage: `url(${nextEvent.image})`,
        scaleX: sx,
        scaleY: sy,
        x: tx,
        y: ty,
        borderRadius: 16,
      });

      const tl = gsap.timeline({ onComplete: finish });

      /* 1. Card flies to fullscreen */
      tl.to(expandRef.current, {
        scaleX: 1, scaleY: 1,
        x: 0, y: 0,
        borderRadius: 0,
        duration: 0.88,
        ease: 'power3.inOut',
      }, 0);

      /* 2. Fade expand overlay out once it fills screen */
      tl.to(expandRef.current, { opacity: 0, duration: 0.28 }, 0.72);

      /* 3. Bring the real bg layer up behind the overlay */
      if (bgNextRef.current) {
        bgNextRef.current.style.backgroundImage = `url(${nextEvent.image})`;
        tl.fromTo(bgNextRef.current, { opacity: 0 }, { opacity: 1, duration: 0.32 }, 0.62);
      }
    } else {
      /* ── Arrow: smooth crossfade ──────────────────────────────────── */
      if (bgNextRef.current) {
        bgNextRef.current.style.backgroundImage = `url(${nextEvent.image})`;
      }
      const tl = gsap.timeline({ onComplete: finish });
      tl.fromTo(
        bgNextRef.current,
        { opacity: 0, scale: 1.06 },
        { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.inOut' },
        0
      );
      tl.to(bgCurrRef.current, { opacity: 0, duration: 0.55 }, 0.18);
    }
  };

  const prev = () => goto((active - 1 + TOTAL) % TOTAL);
  const next = () => goto((active + 1) % TOTAL);

  /* Stack shows next 4 events after active (wrapping) */
  const stackItems = [1, 2, 3, 4].map((offset) => ({
    ev:  EVENTS[(active + offset) % TOTAL],
    idx: (active + offset) % TOTAL,
  }));

  const ev = EVENTS[active];

  return (
    <>
      {/* ─── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="ev-hero" aria-label={`${ev.title} hero`}>

        {/* Background layers */}
        <div
          className="ev-bg"
          ref={bgCurrRef}
          style={{ backgroundImage: `url(${ev.image})` }}
          aria-hidden="true"
        />
        <div className="ev-bg ev-bg--next" ref={bgNextRef} aria-hidden="true" />

        {/* Card-expand overlay (fixed) */}
        <div className="ev-expand" ref={expandRef} aria-hidden="true" />

        {/* Dark gradient overlay for readability */}
        <div className="ev-overlay" aria-hidden="true" />

        {/* ── Left: event info ── */}
        <div className="ev-content">
          <h1 className="ev-title" ref={titleRef}>
            {ev.heroTitle.map((line, i) => (
              <span key={i} className="ev-title-line">{line}</span>
            ))}
          </h1>

          <div className="ev-desc" ref={descRef}>
            <div className="ev-full-desc">
              {typeof ev.description === 'string' ? <p>{ev.description}</p> : ev.description}
            </div>

            {(() => {
              const team = [...(ev.chairs || []), ...(ev.coordinators || [])];
              if (team.length === 0) return null;
              return (
                <div className="ev-team">
                  {team.map((member, i) => (
                    <span key={`${member.name}-${i}`} className="ev-team-pill">
                      <span className="ev-team-role">{member.role}</span>
                      <span className="ev-team-name">{member.name}</span>
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="ev-actions" ref={btnRef}>
            <a href="/register" className="ev-cta" data-magnetic>
              <span className="ev-cta-dot" aria-hidden="true" />
              Register Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            
            <a href={ev.rulebookLink || "#"} className="ev-cta ev-cta--rulebook" target="_blank" rel="noreferrer" data-magnetic>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Rulebook
            </a>
          </div>
        </div>

        {/* ── Right: card stack ── */}
        <div className="ev-stack" ref={stackRef} aria-label="Other events">
          {stackItems.map(({ ev: sev, idx }, pos) => (
            <button
              key={sev.id}
              className={`ev-scard ev-scard--${pos}`}
              ref={(el) => (cardRefs.current[pos] = el)}
              onClick={() => goto(idx, cardRefs.current[pos])}
              aria-label={`Go to ${sev.title}`}
            >
              <img src={sev.image} alt="" loading="lazy" decoding="async" />
              <div className="ev-scard-info" aria-hidden="true">
                <span className="ev-scard-sup">{sev.heroTitle[0]}</span>
                <p className="ev-scard-name">{sev.heroTitle[1] ?? sev.heroTitle[0]}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Bottom: navigation ── */}
        <nav className="ev-nav" aria-label="Event navigation">
          <div className="ev-arrows">
            <button
              className="ev-arr"
              onClick={prev}
              disabled={animating}
              aria-label="Previous event"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="ev-arr"
              onClick={next}
              disabled={animating}
              aria-label="Next event"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="ev-counter" aria-live="polite" aria-atomic="true">
            <span className="ev-counter-curr">{PAD(active)}</span>
            <span className="ev-counter-sep" aria-hidden="true"> / </span>
            <span className="ev-counter-total">{PAD(TOTAL - 1)}</span>
          </div>
        </nav>
      </section>
    </>
  );
}