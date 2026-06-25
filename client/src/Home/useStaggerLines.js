import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/**
 * Hook that staggers child elements (paragraphs) line-by-line
 * when the container scrolls into view. Uses IntersectionObserver
 * to trigger, NOT ScrollTrigger — no scroll conflicts.
 * 
 * @param {string} childSelector - CSS selector for children to stagger (default 'p')
 */
export const useStaggerLines = (childSelector = 'p', threshold = 0.2) => {
  const containerRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Set initial state: all children hidden
    const children = el.querySelectorAll(childSelector);
    
    // Convert to Array to apply soothing initial state
    const childrenArr = Array.from(children);
    
    childrenArr.forEach((child) => {
      gsap.set(child, { 
        opacity: 0, 
        y: 40,
        rotationZ: -2,
        scale: 0.95,
        filter: 'blur(8px)'
      });
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          // Soothing stagger animate each paragraph
          gsap.to(children, {
            opacity: 1,
            y: 0,
            rotationZ: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'power3.out',
            stagger: {
              each: 0.1,
              from: "start"
            },
          });

          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [childSelector, threshold, hasAnimated]);

  return containerRef;
};
