import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './Banner.css';

/* ---- Constellation canvas ---- */
function ParticleCanvas() {
  const cvs = useRef(null)

  useEffect(() => {
    const canvas = cvs.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const N = 50
    const MAX = 130  // connection distance

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.45 + 0.1,
    }))

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      for (const p of pts) {
        p.x = (p.x + p.vx + W) % W
        p.y = (p.y + p.vy + H) % H
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245,223,179,${p.a})`
        ctx.fill()
      }

      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < MAX) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(245,223,179,${0.08 * (1 - d / MAX)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    let isVisible = true
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible) {
        if (!raf) raf = requestAnimationFrame(draw)
      } else {
        cancelAnimationFrame(raf)
        raf = null
      }
    }, { threshold: 0 })
    observer.observe(canvas)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      observer.disconnect()
      ro.disconnect()
    }
  }, [])

  return <canvas ref={cvs} className="banner-particles" />
}

/* ---- Cursor-driven parallax for the background layer ---- */
function useBgParallax(wrapRef, ready) {
  useEffect(() => {
    if (!ready) return
    const wrap = wrapRef.current
    if (!wrap) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (reduceMotion || !finePointer) return

    const container = wrap.closest('.banner-container')
    let raf = null

    const onMove = (e) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = null
        const rect = container.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width - 0.5 // -0.5 .. 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        /* Subtle depth shift — background drifts opposite the cursor */
        wrap.style.transform = `translate3d(${px * -22}px, ${py * -14}px, 0)`
      })
    }

    const onLeave = () => {
      wrap.style.transform = 'translate3d(0, 0, 0)'
    }

    container.addEventListener('mousemove', onMove, { passive: true })
    container.addEventListener('mouseleave', onLeave)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
    }
  }, [wrapRef, ready])
}

/* ---- Banner ---- */
const Banner = () => {
  const containerRef = useRef()
  const bgWrapRef = useRef()
  const [parallaxReady, setParallaxReady] = useState(false)

  useGSAP(() => {
    const tl = gsap.timeline()

    tl.from('.banner-bg-wrap', {
      scale: 1.1,
      opacity: 0,
      duration: 1.5,
      ease: 'expo.inOut',
      delay: 0.9,
      onComplete: () => setParallaxReady(true),
    })
      .from('.char', {
        y: 150,
        opacity: 0,
        stagger: 0.1,
        duration: 1.2,
        ease: 'power4.out',
      }, '-=0.5')
      .from('.banner-subtitle', {
        y: 20,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      }, '-=0.4')
      .from('.banner-cta-link', {
        y: 12,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.4')
  }, { scope: containerRef })

  useBgParallax(bgWrapRef, parallaxReady)

  const title = 'VIPLAV'

  return (
    <div className="banner-container" ref={containerRef}>
      <div className="banner-bg-mask">
        <div className={`banner-bg-wrap${parallaxReady ? ' parallax-ready' : ''}`} ref={bgWrapRef}>
          <img className="banner-bg" src="/bg.png" alt="Background" fetchpriority="high" decoding="async" />
        </div>
      </div>
      <ParticleCanvas />
      <div className="banner-content">
        <h1 className="banner-title">
          {title.split('').map((char, i) => (
            <span key={i} className="char-wrapper">
              <span className="char">{char}</span>
            </span>
          ))}
        </h1>
        <p className="banner-subtitle">Engineering the
Decarbonization Revolution</p>
      </div>
      <ScrollCue />
    </div>
  )
}

/* ---- Bouncing scroll hint — fades out once the user starts scrolling ---- */
function ScrollCue() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const fade = Math.max(0, 1 - window.scrollY / 220)
        el.style.opacity = fade
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="banner-scroll-cue" ref={ref} aria-hidden="true">
      <span className="scroll-cue-label">Scroll</span>
      <span className="scroll-cue-stem"><span className="scroll-cue-dot" /></span>
    </div>
  )
}

export default Banner
