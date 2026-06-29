import { useEffect, useRef } from 'react'
import './CustomCursor.css'

export default function CustomCursor() {
  const dot  = useRef(null)
  const ring = useRef(null)
  const mouse = useRef({ x: -300, y: -300 })
  const trail = useRef({ x: -300, y: -300 })
  const raf   = useRef(null)

  useEffect(() => {
    const LERP = 0.1

    const onMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }

    const onOver = (e) => {
      if (e.target.closest('a, button, [role="button"], input, select, label, .team-card, .fan-card, .fan-btn, .faq-question, .fan-explore-btn, [data-cursor]')) {
        dot.current?.classList.add('active')
        ring.current?.classList.add('active')
      }
    }

    const onOut = (e) => {
      if (e.target.closest('a, button, [role="button"], input, select, label, .team-card, .fan-card, .fan-btn, .faq-question, .fan-explore-btn, [data-cursor]')) {
        dot.current?.classList.remove('active')
        ring.current?.classList.remove('active')
      }
    }

    const tick = () => {
      if (dot.current) {
        dot.current.style.transform = `translate(${mouse.current.x}px,${mouse.current.y}px)`
      }
      trail.current.x += (mouse.current.x - trail.current.x) * LERP
      trail.current.y += (mouse.current.y - trail.current.y) * LERP
      if (ring.current) {
        ring.current.style.transform = `translate(${trail.current.x}px,${trail.current.y}px)`
      }
      raf.current = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout',  onOut)
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout',  onOut)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div ref={dot}  className="cur-dot"  aria-hidden="true" />
      <div ref={ring} className="cur-ring" aria-hidden="true" />
    </>
  )
}
