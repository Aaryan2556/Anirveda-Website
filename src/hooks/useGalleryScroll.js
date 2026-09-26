import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom React hook managing the 120 FPS passive scroll pipeline and touch detection
 * for the 3D sticky assembly gallery.
 *
 * @param {Array} dataset - Full media dataset
 * @returns {Object} { sectionRef, isTouchDevice, searchQuery, setSearchQuery, filteredData }
 */
export function useGalleryScroll(dataset = []) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const sectionRef = useRef(null);
  const rafId = useRef(null);

  // Mobile & Touch Device Detection
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        window.innerWidth < 768 ||
        ("ontouchstart" in window || navigator.maxTouchPoints > 0)
      );
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // RequestAnimationFrame Passive Scroll Pipeline
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = Math.min(1, Math.max(0, currentScroll / totalScroll));
      const assemblyFactor = Math.min(1, Math.max(0, (0.65 - rawProgress) / 0.65));
      const badgeFactor =
        rawProgress >= 0.1 && rawProgress <= 0.65
          ? Math.sin(((rawProgress - 0.1) / 0.55) * Math.PI)
          : 0;

      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (sectionRef.current) {
          sectionRef.current.style.setProperty(
            "--gallery-progress",
            rawProgress.toFixed(4)
          );
          sectionRef.current.style.setProperty(
            "--assembly-factor",
            assemblyFactor.toFixed(4)
          );
          sectionRef.current.style.setProperty(
            "--badge-opacity",
            badgeFactor.toFixed(4)
          );
        }
      });
    };

    const initTimer = setTimeout(handleScroll, 0);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Global search filtering across dataset
  const filteredData = dataset.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.alt && item.alt.toLowerCase().includes(q)) ||
      (item.nodeId && item.nodeId.toLowerCase().includes(q)) ||
      (item.tag && item.tag.toLowerCase().includes(q))
    );
  });

  return {
    sectionRef,
    isTouchDevice,
    searchQuery,
    setSearchQuery,
    filteredData,
  };
}
