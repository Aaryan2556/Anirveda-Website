import React, { useRef, useEffect, useCallback } from "react";

/**
 * FloatingShapes / BackgroundTermsAnimation Canvas Component
 * Renders sparse floating particle matrix of financial & technological telemetry terms.
 *
 * @param {Object} props
 * @param {Array<string>} props.termsArray - Array of terms to render in particle system
 */
export default function FloatingShapes({ termsArray }) {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const particles = useRef([]);

  const PARTICLE_COUNT = 40;
  const PARTICLE_SPEED_VARIATION = 0.3;
  const GLITCH_PROBABILITY = 0.0005;
  const GLITCH_DURATION_FRAMES = 10;
  const PARTICLE_LIFESPAN = 300;

  const createParticle = useCallback(
    (canvasWidth, canvasHeight) => {
      return {
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx: (Math.random() - 0.5) * PARTICLE_SPEED_VARIATION * 2,
        vy: (Math.random() - 0.5) * PARTICLE_SPEED_VARIATION * 2,
        value: termsArray[Math.floor(Math.random() * termsArray.length)],
        life: PARTICLE_LIFESPAN,
        glitchTimer: 0,
        initialOpacity: Math.random() * 0.05 + 0.005,
        targetOpacity: Math.random() * 0.15 + 0.05,
      };
    },
    [termsArray]
  );

  const initializeParticles = useCallback(
    (canvasWidth, canvasHeight) => {
      particles.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvasWidth, canvasHeight)
      );
    },
    [createParticle]
  );

  const updateParticles = useCallback(
    (canvasWidth, canvasHeight) => {
      particles.current.forEach((p, index) => {
        if (p.glitchTimer > 0) {
          p.value = termsArray[Math.floor(Math.random() * termsArray.length)];
          p.x += (Math.random() - 0.5) * 5;
          p.y += (Math.random() - 0.5) * 5;
          p.opacity = Math.random() * 0.3;
          p.glitchTimer--;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;

          if (p.life > PARTICLE_LIFESPAN * 0.8) {
            p.opacity =
              p.initialOpacity +
              (p.targetOpacity - p.initialOpacity) *
                (1 - p.life / (PARTICLE_LIFESPAN * 0.2));
          } else if (p.life < PARTICLE_LIFESPAN * 0.2) {
            p.opacity =
              p.targetOpacity * (p.life / (PARTICLE_LIFESPAN * 0.2));
          } else {
            p.opacity = p.targetOpacity;
          }

          p.opacity = Math.max(0, Math.min(0.2, p.opacity));

          if (Math.random() < GLITCH_PROBABILITY) {
            p.glitchTimer = GLITCH_DURATION_FRAMES;
          }
        }

        if (
          p.life <= 0 ||
          p.x < -100 ||
          p.x > canvasWidth + 100 ||
          p.y < -50 ||
          p.y > canvasHeight + 50
        ) {
          particles.current[index] = createParticle(canvasWidth, canvasHeight);
        }
      });
    },
    [termsArray, createParticle]
  );

  const drawParticles = useCallback((ctx, canvasWidth, canvasHeight) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const baseFontSize = Math.min(canvasWidth, canvasHeight) * 0.03;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    particles.current.forEach((p) => {
      ctx.font = `${baseFontSize * (1 + (Math.random() - 0.5) * 0.05)}px 'Inter', monospace`;
      ctx.fillStyle = `rgba(201, 135, 43, ${p.opacity})`;
      ctx.fillText(p.value, p.x, p.y);
    });
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    updateParticles(rect.width, rect.height);
    drawParticles(ctx, rect.width, rect.height);

    animationFrameId.current = requestAnimationFrame(animate);
  }, [updateParticles, drawParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      initializeParticles(rect.width, rect.height);
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      drawParticles(ctx, rect.width, rect.height);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [animate, initializeParticles, drawParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
      aria-hidden="true"
    />
  );
}
