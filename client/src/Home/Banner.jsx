import React, { useRef, useEffect } from 'react';
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

    const N   = 50
    const MAX = 130  // connection distance

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const pts = Array.from({ length: N }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r:  Math.random() * 1.4 + 0.4,
      a:  Math.random() * 0.45 + 0.1,
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
          const d  = Math.sqrt(dx * dx + dy * dy)
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

/* ---- Banner ---- */
const Banner = () => {
  const containerRef = useRef()

  useGSAP(() => {
    const tl = gsap.timeline()

    tl.from('.banner-bg', {
      scale: 1.1,
      opacity: 0,
      duration: 1.5,
      ease: 'expo.inOut',
      delay: 0.9,
    })
    .from('.char', {
      y: 150,
      opacity: 0,
      stagger: 0.1,
      duration: 1.2,
      ease: 'power4.out',
    }, '-=0.5')
  }, { scope: containerRef })

  const title = 'VIPLAV'

  return (
    <div className="banner-container" ref={containerRef}>
      <img className="banner-bg" src="/bg.png" alt="Background" fetchpriority="high" decoding="async" />
      <ParticleCanvas />
      <div className="banner-content">
        <h1 className="banner-title">
          {title.split('').map((char, i) => (
            <span key={i} className="char-wrapper">
              <span className="char">{char}</span>
            </span>
          ))}
        </h1>
      </div>
    </div>
  )
}

export default Banner
