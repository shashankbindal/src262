import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

/**
 * GSAP SplitText word-stagger reveal, fired when `active` becomes true.
 * The target element should start with CSS `opacity: 0`.
 * This hook sets the element opacity to 1 immediately, then animates
 * each word in with a y-rise + fade stagger.
 *
 * @param {boolean} active  - trigger when true (from parent useReveal)
 * @param {number}  delay   - seconds before animation starts
 */
export function useRevealWords(active, delay = 0) {
  const ref    = useRef(null)
  const played = useRef(false)

  useEffect(() => {
    if (!active || played.current || !ref.current) return
    played.current = true
    const el = ref.current

    /* Make element container visible — GSAP animates each word below */
    el.style.opacity = '1'

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const split = new SplitText(el, { type: 'words', wordsClass: 'gsap-word' })

    /* Lock initial word state immediately (prevents brief flash) */
    gsap.set(split.words, { y: 44, opacity: 0 })

    gsap.to(split.words, {
      y:        0,
      opacity:  1,
      stagger:  { each: 0.065, from: 'start' },
      duration: 0.95,
      ease:     'power4.out',
      delay,
      onComplete() {
        split.revert()
      },
    })
  }, [active, delay])

  return ref
}
