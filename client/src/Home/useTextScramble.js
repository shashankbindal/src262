import { useEffect, useRef } from 'react'

/* Technical / mathematical scramble characters — fits the conference theme */
const CHARS = '!<>-_/[]{}=+*^?#~ABCDEFabcdef0123456789∑∂∆∇⊂⊃αβγδ'

/**
 * Animates text via a "decryption scramble" effect when `active` becomes true.
 * Attach the returned ref to a plain DOM element (span/div with no child components).
 * The element should start with opacity:0 in CSS — the hook sets opacity:1 before animating.
 *
 * @param {string}  text   - The final text to resolve to
 * @param {boolean} active - Start animation when this becomes true
 * @param {number}  delay  - Optional seconds to wait before starting
 */
export function useTextScramble(text, active, delay = 0) {
  const ref    = useRef(null)
  const played = useRef(false)
  const raf    = useRef(null)

  useEffect(() => {
    if (!active || played.current || !ref.current) return
    played.current = true
    const el = ref.current

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      el.textContent = text
      return
    }

    /* Build queue — each character has a randomised resolve frame */
    const chars = [...text]
    const queue = chars.map((char, i) => ({
      to:           char,
      resolveFrame: Math.floor(i * 2.5) + 12 + Math.floor(Math.random() * 6),
      current:      CHARS[Math.floor(Math.random() * CHARS.length)],
    }))

    let frame = 0

    const update = () => {
      let html = ''
      let complete = 0

      for (const item of queue) {
        if (frame >= item.resolveFrame) {
          complete++
          html += item.to === ' ' ? '&nbsp;' : item.to
        } else {
          /* Randomly swap the scramble character */
          if (Math.random() < 0.35) {
            item.current = CHARS[Math.floor(Math.random() * CHARS.length)]
          }
          html +=
            item.to === ' '
              ? '&nbsp;'
              : `<span class="scramble-char">${item.current}</span>`
        }
      }

      el.innerHTML = html
      frame++

      if (complete < queue.length) {
        raf.current = requestAnimationFrame(update)
      }
    }

    /* Delay, then start */
    const timeout = setTimeout(() => {
      el.style.opacity = '1'
      raf.current = requestAnimationFrame(update)
    }, delay * 1000)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(raf.current)
    }
  }, [active, text, delay])

  return ref
}
