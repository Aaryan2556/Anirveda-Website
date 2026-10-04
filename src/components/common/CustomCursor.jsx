import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Disable window mouse event listeners on touch/mobile devices to eliminate touch lag
    if (typeof window !== "undefined" && (window.innerWidth < 768 || "ontouchstart" in window)) {
      return;
    }

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      if (
        e.target.tagName === "BUTTON" ||
        e.target.tagName === "A" ||
        e.target.closest("button") ||
        e.target.closest("a")
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <>
      {/* Smooth Cursor-Trailing Ambient Radial Lighting Glow */}
      <motion.div
        className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-10 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 hidden md:block"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, hsl(var(--accent) / 0.04) 40%, transparent 70%)",
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      {/* Primary Gold Pointer Dot */}
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-gold rounded-full pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 shadow-goldGlow hidden md:block"
        animate={{
          left: mousePos.x,
          top: mousePos.y,
          scale: isHovered ? 2.2 : 1,
          backgroundColor: isHovered ? "#FDF0A6" : "#D4AF37",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      />
    </>
  );
}