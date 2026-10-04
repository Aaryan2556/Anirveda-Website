import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export default function ProfileCard(props) {
  const { data, heading } = props;
  const [current, setCurrent] = useState(0);

  return (
    <div className="w-full py-10 bg-background text-foreground overflow-hidden">
      <h2 className="py-6 sm:py-8 text-center font-Bebas text-3xl xs:text-4xl sm:text-6xl md:text-8xl font-normal uppercase text-primary tracking-wide leading-[0.95] max-w-full break-words px-4">
        {heading}
      </h2>

      <div className="relative mt-4 flex items-center justify-between gap-2 px-2 sm:px-8 md:mt-0 md:justify-center">
        {/* Mobile Left Chevron */}
        <div className="ml-1 md:hidden z-10 shrink-0">
          <button
            onClick={() => setCurrent((prev) => (prev === 0 ? data.length - 1 : prev - 1))}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-muted border border-border text-foreground hover:text-primary hover:border-primary/40 transition-all"
            aria-label="Previous Profile"
          >
            <Icon icon="carbon:chevron-left" className="text-xl" />
          </button>
        </div>

        {/* Mobile View: Single Active Card */}
        <div className="relative flex w-full justify-center md:hidden">
          {data[current] && (
            <motion.div
              key={data[current].id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xs rounded-3xl bg-card border border-border p-6 shadow-xl relative overflow-hidden backdrop-blur-xl flex flex-col items-center justify-between"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent" />

              <div className="relative mb-5 mt-2">
                <div className="mx-auto h-32 w-32 rounded-full border-2 border-primary/40 p-1 bg-muted/50 overflow-hidden shadow-inner">
                  <img
                    src={data[current].img_src}
                    className="h-full w-full rounded-full object-cover object-center transition-transform duration-500 hover:scale-110"
                    alt={data[current].name}
                  />
                </div>
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-card animate-pulse" />
              </div>

              <span className="font-mono text-[10px] text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full uppercase mb-2">
                NODE-{data[current].id < 10 ? `0${data[current].id}` : data[current].id}
              </span>

              <h3 className="text-center text-xl font-bold font-sans text-foreground tracking-tight">
                {data[current].name}
              </h3>
              <h4 className="mt-1 text-center font-mono text-xs font-semibold text-primary uppercase">
                {data[current].position}
              </h4>

              <div className="w-full mt-6">
                <a
                  href={data[current].linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary-hsl)/0.3)] hover:scale-105 transition-transform"
                >
                  <Icon icon="carbon:logo-linkedin" className="text-sm" />
                  <span>Connect Node</span>
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* Desktop View: Full Responsive Grid */}
        <div className="hidden md:flex md:flex-wrap md:justify-center md:gap-6 lg:mx-auto lg:max-w-7xl lg:gap-8">
          {data.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -8 }}
              className="w-72 rounded-3xl bg-card border border-border p-6 shadow-xl relative overflow-hidden backdrop-blur-xl flex flex-col items-center justify-between group hover:border-primary/50 transition-all duration-300"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent opacity-70 group-hover:opacity-100 transition-opacity" />

              <div className="relative mb-5 mt-2">
                <div className="mx-auto h-32 w-32 rounded-full border-2 border-primary/30 p-1 bg-muted/40 overflow-hidden shadow-inner group-hover:border-primary transition-colors">
                  <img
                    src={item.img_src}
                    className="h-full w-full rounded-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                    alt={item.name}
                  />
                </div>
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-card animate-pulse" />
              </div>

              <span className="font-mono text-[10px] text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full uppercase mb-2">
                NODE-{item.id < 10 ? `0${item.id}` : item.id}
              </span>

              <h3 className="text-center text-xl font-bold font-sans text-foreground tracking-tight">
                {item.name}
              </h3>
              <h4 className="mt-1 text-center font-mono text-xs font-semibold text-primary uppercase">
                {item.position}
              </h4>

              {/* Callout box */}
              <div className="w-full mt-4 p-2.5 rounded-xl bg-muted/60 border border-border text-center">
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                  FINANCIAL & COMPUTE GOVERNANCE
                </span>
              </div>

              <div className="w-full mt-5">
                <a
                  href={item.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary-hsl)/0.3)] group-hover:scale-105 transition-transform"
                >
                  <Icon icon="carbon:logo-linkedin" className="text-sm" />
                  <span>Connect Node</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Right Chevron */}
        <div className="mr-1 md:hidden z-10 shrink-0">
          <button
            onClick={() => setCurrent((prev) => (prev === data.length - 1 ? 0 : prev + 1))}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-muted border border-border text-foreground hover:text-primary hover:border-primary/40 transition-all"
            aria-label="Next Profile"
          >
            <Icon icon="carbon:chevron-right" className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}