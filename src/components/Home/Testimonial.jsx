"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Quote,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Star,
} from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Soham Payal Pathak",
    role: "Co-Founder (The Simply Salad)",
    company: "Shark Tank India Featured",
    roleBadge: "Keynote Speaker",
    spotlightBadge: "Shark Tank Featured",
    quote:
      "I had the opportunity of speaking at a session during Economania hosted by Anirveda PDEU. It was really a very good experience. They treated me with so much warmth and love. I was accompanied by my grandfather, and he was really proud to see me speak on the stage, address all the kids, and inspire them to do something different.",
    src: "https://res.cloudinary.com/duygdcgj3/image/upload/v1756113541/soham_gx627v.png",
  },
  {
    id: 2,
    name: "Hrishikesh Kalola",
    role: "AI Engineer",
    company: "Paperchase",
    roleBadge: "Ex-Chief Coordinator",
    spotlightBadge: "Alumni Spotlight",
    quote:
      "Being a part of Anirveda, the tech-economics club of my college, has been an incredible journey of growth and learning over four years. Starting as an associate and progressing to Chief Coordinator, I developed my leadership and people management skills in ways I never imagined.",
    src: "https://res.cloudinary.com/duygdcgj3/image/upload/v1756452188/HrishikeshBhai_aio2jr.jpg",
  },
  {
    id: 3,
    name: "Tanish Patel",
    role: "AI Engineer",
    company: "Paperchase",
    roleBadge: "Ex-Core Committee",
    spotlightBadge: "Alumni Spotlight",
    quote:
      "Anirveda is one of the places where I truly connected with people and realized how such a niche intersection holds so much knowledge. It is truly one of the best places to explore the worlds of economics and technology, which couldn't have been more well-integrated anywhere else.",
    src: "https://res.cloudinary.com/duygdcgj3/image/upload/v1756113541/Tanish_cmmgkr.webp",
  },
  {
    id: 4,
    name: "Harshvardhan Gaikwad",
    role: "Reliance Industries Ltd.",
    company: "Corporate Strategy",
    roleBadge: "Ex-President",
    spotlightBadge: "Alumni Leader",
    quote:
      "Anirveda has been more than just a club for me; it has been a transformative journey of growth and self-discovery. From starting as a subcommittee member to serving as President, every role taught me invaluable lessons in leadership, teamwork, and resilience.",
    src: "https://res.cloudinary.com/duygdcgj3/image/upload/v1756113538/harshvardhan_crwr17.png",
  },
];

export default function Testimonial() {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [autoplay]);

  const current = testimonials[active];

  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-20"
      onMouseEnter={() => setAutoplay(false)}
      onMouseLeave={() => setAutoplay(true)}
    >
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-md text-amber-400 font-mono text-xs uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <span>ALUMNI & LEADER VOICES</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          What People Have to Say About Us
        </h2>
        <p className="mt-3 text-slate-400 font-sans text-sm sm:text-base max-w-xl">
          Hear from founders, alumni leaders, and keynote speakers about their experience with Anirveda PDEU.
        </p>
      </div>

      {/* 1. Main Bento Testimonial Card */}
      <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-slate-950/70 border border-amber-500/20 hover:border-amber-500/40 p-6 sm:p-10 lg:p-12 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500">
        {/* Subtle Watermark Quote Icon */}
        <Quote className="absolute right-4 bottom-4 w-48 h-48 text-amber-500/5 pointer-events-none -rotate-12" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* 2. Left Column: Portrait Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-xs sm:max-w-sm aspect-[4/5] rounded-2xl overflow-hidden border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)] group"
              >
                <img
                  src={current.src}
                  alt={current.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://res.cloudinary.com/r5piguws/image/upload/v1785948890/VGA_1298_wbrmap.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Floating Corner Badges */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-amber-300 font-mono text-xs font-bold shadow-lg">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{current.roleBadge}</span>
                </div>

                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 backdrop-blur-md border border-amber-500/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider shadow-md">
                  
                  <span>{current.spotlightBadge}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3. Right Column: Typography & Content */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Opening Quote Icon */}
                <div className="mb-4">
                  <div className="inline-flex p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
                    <Quote className="w-6 h-6 rotate-180" />
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
                    {current.name}
                  </h3>
                  <p className="text-amber-400 font-mono text-xs sm:text-sm font-semibold tracking-wider uppercase mt-1">
                    {current.role} • {current.company}
                  </p>
                </div>

                {/* Quote Text */}
                <blockquote className="text-base sm:text-lg text-slate-300 leading-relaxed italic font-light font-sans mb-6">
                  &ldquo;{current.quote}&rdquo;
                </blockquote>
              </motion.div>
            </AnimatePresence>

            {/* 4. Modern Navigation Controls & Progress Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-4">
              {/* Indicator Dots & Step Counter */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActive(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`transition-all duration-300 ${
                        idx === active
                          ? "w-8 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                          : "w-2 h-2 rounded-full bg-slate-800 hover:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs text-slate-400 ml-2">
                  0{active + 1} / 0{testimonials.length}
                </span>
              </div>

              {/* Slider Arrow Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  aria-label="Previous testimonial"
                  className="p-3 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95 transition-all shadow-md"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next testimonial"
                  className="p-3 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95 transition-all shadow-md"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
