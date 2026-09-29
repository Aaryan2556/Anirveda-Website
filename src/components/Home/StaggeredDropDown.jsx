"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, Sparkles, Layers } from "lucide-react";
import UpcomingEventCards from "../Events/UpcomingEventCards";

const StaggeredDropDown = () => {
  const [open, setOpen] = useState(true);
  const wrapperRef = useRef(null);

  const handleToggle = (e) => {
    e.preventDefault();
    setOpen((prev) => !prev);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        open &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        // Optional: comment out if users prefer keeping it expanded while scrolling
        // setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 z-20" ref={wrapperRef}>
      {/* 1. Header Bar: Sleek Glass Pill */}
      <div className="w-full">
        <button
          onClick={handleToggle}
          type="button"
          aria-expanded={open}
          className="w-full flex items-center justify-between p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-amber-500/30 backdrop-blur-xl hover:border-amber-400/60 transition-all duration-500 shadow-2xl hover:shadow-[0_0_35px_rgba(245,158,11,0.2)] cursor-pointer group"
        >
          {/* Left Title Block */}
          <div className="flex items-center gap-3 sm:gap-4 text-left">
            {/* Animated Glowing Indicator */}
            <div className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </div>

            {/* Calendar Icon */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:text-amber-200 transition-colors">
                  Flagship Initiatives & Events
                </h2>
                {/* Edition Tag */}
                <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs">
                  ANIRVEDA 2026
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
                Explore hackathons, auctions, and techno-economic simulations
              </p>
            </div>
          </div>

          {/* Right Chevron Icon */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-amber-400/80 uppercase tracking-widest hidden sm:inline-block">
              {open ? "Collapse" : "Expand"}
            </span>
            <div className="p-2.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 group-hover:border-amber-500/40 transition-colors">
              <ChevronDown
                className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-500"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </div>
          </div>
        </button>
      </div>

      {/* 2. Fluid Expansion Transition with AnimatePresence */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="event-showcase-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.3, ease: "easeInOut" },
            }}
            className="overflow-hidden mt-4"
          >
            <div className="pt-2 pb-4">
              <UpcomingEventCards />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default StaggeredDropDown;
