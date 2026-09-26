import React, { useState, useEffect, useRef } from "react";
import { useSprings, animated } from "@react-spring/web";

/**
 * Animated BlurText Component rendering spring blur transition for title characters.
 *
 * @param {Object} props
 * @param {string} props.text - Input text string to animate
 * @param {number} [props.delay=200] - Character spring stagger delay
 * @param {string} [props.className=""] - Extra Tailwind classes
 */
export function BlurText({ text, delay = 200, className = "" }) {
  const characters = text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.disconnect();
      }
    };
  }, []);

  const springs = useSprings(
    characters.length,
    characters.map((_, i) => ({
      from: { filter: "blur(50px)", opacity: 0, transform: "translate3d(0,-50px,0)" },
      to: inView
        ? async (next) => {
            await next({ filter: "blur(5px)", opacity: 0.5, transform: "translate3d(0,5px,0)" });
            await next({ filter: "blur(0px)", opacity: 1, transform: "translate3d(0,0,0)" });
          }
        : { filter: "blur(10px)", opacity: 0 },
      delay: i * delay,
    }))
  );

  return (
    <p ref={ref} className={`${className} relative uppercase tracking-tight`}>
      {springs.map((props, index) => (
        <animated.span
          key={index}
          style={props}
          className="inline-block will-change-transform"
        >
          {characters[index] === " " ? "\u00A0" : characters[index]}
        </animated.span>
      ))}
    </p>
  );
}
