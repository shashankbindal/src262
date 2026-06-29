import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

/**
 * Attaches a GSAP SplitText word-roll-in animation to a heading.
 * The element itself must have `overflow: hidden` (or its parent must)
 * to clip the y-percent entrance.
 *
 * @param {number} delay  - seconds before animation begins after trigger
 * @param {number} threshold - IntersectionObserver threshold (0–1)
 */
export function useTextReveal(delay = 0, threshold = 0.25) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let split = null

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.unobserve(el)

        split = new SplitText(el, { type: 'words', wordsClass: 'gsap-word' })

        /* Set immediately so there is no flash before the animation */
        gsap.set(split.words, { y: 36, opacity: 0 })

        gsap.to(split.words, {
          y: 0,
          opacity: 1,
          stagger: { each: 0.055, from: 'start' },
          duration: 0.85,
          ease: 'power4.out',
          delay,
          onComplete: () => {
            split?.revert()
            split = null
          },
        })
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)

    return () => {
      observer.unobserve(el)
      split?.revert()
    }
  }, [delay, threshold])

  return ref
}
