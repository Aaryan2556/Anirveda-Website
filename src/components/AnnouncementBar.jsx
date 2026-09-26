import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

const AnnouncementBar = () => {
    const announcements = [
  {
    id: 1,
    text: "🏏 IPL Auction 2026 — Registrations opening soon. Your auction strategy starts now.",
    badge: "AUCTION",
    link: "/ipl-auction",
  },
  {
    id: 2,
    text: "⚡ Tesseract 2026 — Registrations opening soon. Ctrl + Alt + Get Ready.",
    badge: "FLAGSHIP",
    link: "/events",
  },

  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-50 bg-obsidian-800 text-gold border border-gold/40 w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:shadow-goldGlow transform hover:scale-110 transition-all duration-300 backdrop-blur-md"
        aria-label="Open Announcement Ticker"
      >
        <Icon icon="carbon:notification" className="text-lg animate-pulse" />
      </button>
    );
  }

  const current = announcements[currentIndex];

  return (
    <div className="relative z-50 pt-3 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* Floating marquee banner with token-based gradient border */}
      <div className="relative rounded-full p-[1px] bg-gradient-to-r from-primary/50 via-accent/60 to-secondary/50 shadow-md backdrop-blur-xl">
        <div className="bg-obsidian-900/90 rounded-full px-4 py-2 sm:py-2.5 flex items-center justify-between overflow-hidden">
          {/* Left Live Status Indicator */}
          <div className="flex items-center space-x-2 shrink-0 pr-2 sm:pr-4 border-r border-slate-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="font-mono text-[10px] sm:text-xs font-bold text-gold uppercase tracking-wider hidden xs:inline">
              LIVE SIGNAL
            </span>
          </div>

          {/* Center Marquee Content */}
          <div className="flex-1 overflow-hidden px-3 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center space-x-2 text-xs sm:text-sm font-medium text-slate-200"
              >
                <span className="bg-gold/20 text-gold-light border border-gold/30 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider hidden md:inline-block">
                  {current.badge}
                </span>
                <span className="truncate">{current.text}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1.5 shrink-0 pl-2 sm:pl-4 border-l border-slate-800">
            <button
              onClick={handlePrev}
              className="p-1 rounded-full text-slate-400 hover:text-gold hover:bg-slate-800/60 transition-colors"
              aria-label="Previous announcement"
            >
              <Icon icon="carbon:chevron-left" className="text-sm" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-full text-slate-400 hover:text-gold hover:bg-slate-800/60 transition-colors"
              aria-label="Next announcement"
            >
              <Icon icon="carbon:chevron-right" className="text-sm" />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors ml-1"
              aria-label="Close announcement bar"
            >
              <Icon icon="carbon:close" className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
