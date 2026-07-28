import React, { useRef, forwardRef, useImperativeHandle } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, useGSAP);

const StaggerText = forwardRef(({ 
  text, 
  hoverColor = "inherit",
  duration = 0.3,
  stagger = 0.02,
  ease = "power2.inOut",
  className = ""
}, ref) => {
  const originalRef = useRef(null);
  const hoverRef = useRef(null);
  const wrapperRef = useRef(null);
  const tlRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => tlRef.current?.play(),
    reverse: () => tlRef.current?.reverse(),
    reset: () => tlRef.current?.pause(0),
  }));

  useGSAP(() => {
    const parent = wrapperRef.current?.parentElement;
    const target = parent || wrapperRef.current;

    const splitOriginal = new SplitText(originalRef.current, { type: "chars" });
    const splitHover = new SplitText(hoverRef.current, { type: "chars" });

    tlRef.current = gsap.timeline({
      paused: true,
    });

    tlRef.current
      .to(splitOriginal.chars, {
        yPercent: -100,
        duration: duration,
        ease: ease,
        stagger: {
          each: stagger,
          from: "start"
        }
      }, 0)
      .to(splitHover.chars, {
        yPercent: -100,
        duration: duration,
        ease: ease,
        stagger: {
          each: stagger,
          from: "start"
        }
      }, 0);

    const handleEnter = () => tlRef.current?.play();
    const handleLeave = () => tlRef.current?.reverse();

    if (target) {
      target.addEventListener("mouseenter", handleEnter);
      target.addEventListener("mouseleave", handleLeave);
    }

    return () => {
      if (target) {
        target.removeEventListener("mouseenter", handleEnter);
        target.removeEventListener("mouseleave", handleLeave);
      }
      tlRef.current?.kill();
      splitOriginal.revert();
      splitHover.revert();
    };
  }, {
    scope: wrapperRef,
    dependencies: [text, hoverColor, duration, stagger, ease]
  });

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: "relative", overflow: "hidden", display: "flex", paddingRight: "16px", marginRight: "-16px" }}
    >
      <div ref={originalRef} style={{ display: "block", whiteSpace: "pre", paddingRight: "16px" }}>
        {text}
      </div>

      <div
        ref={hoverRef}
        style={{
          position: "absolute",
          left: 0,
          top: "100%",
          display: "block",
          whiteSpace: "pre",
          color: hoverColor,
          paddingRight: "16px",
        }}
      >
        {text}
      </div>
    </div>
  );
});

StaggerText.displayName = "StaggerText";

export default StaggerText;