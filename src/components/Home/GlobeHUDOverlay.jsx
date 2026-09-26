import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

export default function GlobeHUDOverlay({
  activeHub,
  onResetCamera,
  currentMode,
  onModeChange,
  autoRotate,
  onToggleAutoRotate,
}) {
  const [activeTab, setActiveTab] = useState("OVERVIEW");

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3.5 sm:p-5 select-none">
      {/* Top Controls Bar */}
      <div className="flex flex-col items-start gap-2.5 w-full">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Globe Title Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 border border-primary/40 text-primary font-mono text-[10px] sm:text-xs font-bold tracking-wider backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>GLOBAL TECHNO-ECONOMIC MATRIX</span>
          </div>

          {/* Earth Axis Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 border border-primary/40 text-primary font-mono text-[10px] sm:text-[11px] font-bold tracking-wider backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>AXIS: 23.5° TILT</span>
          </div>

          {/* Orbit Toggle */}
          <button
            onClick={onToggleAutoRotate}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-[10px] sm:text-[11px] font-bold uppercase transition-all duration-300 backdrop-blur-md ${
              autoRotate
                ? "bg-secondary/10 border-secondary/20 text-secondary shadow-sm"
                : "bg-muted/80 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon icon={autoRotate ? "carbon:play-filled" : "carbon:pause-filled"} className="text-xs" />
            <span>{autoRotate ? "AUTO-ORBIT" : "ORBIT PAUSED"}</span>
          </button>

          {/* Reset View Button */}
          {activeHub && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={onResetCamera}
              className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-mono text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform"
            >
              <Icon icon="carbon:reset" className="text-xs" />
              <span>Reset Orbit</span>
            </motion.button>
          )}
        </div>

        {!activeHub && (
          <div className="text-[10px] font-mono text-muted-foreground pl-1 tracking-wide uppercase">
            GLOBAL LIQUIDITY & COMPUTE MATRIX • Click any 3D pillar to view metrics
          </div>
        )}
      </div>

      {/* TOP-RIGHT MACRO TELEMETRY CARD */}
      {!activeHub && (
        <div className="absolute top-5 right-5 p-3 rounded-xl bg-card border border-border text-foreground text-[11px] font-mono space-y-1.5 backdrop-blur-md hidden sm:block pointer-events-auto shadow-2xl z-20">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-[10px]">CAPITAL VELOCITY:</span>
            <span className="text-primary font-bold">$840B/day</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-[10px]">ALGORITHMIC ROUTING:</span>
            <span className="text-secondary font-bold">99.98%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-[10px]">PRIMARY NODE:</span>
            <span className="text-secondary font-bold">GIFT CITY / PDEU</span>
          </div>
        </div>
      )}

      {/* POPUP MODAL SHOWING COMPLETE TECHNO-ECONOMIC TELEMETRY NODE DATA */}
      <AnimatePresence>
        {activeHub && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg mx-auto pointer-events-auto bg-card border border-primary/40 rounded-2xl p-4 sm:p-5 backdrop-blur-2xl shadow-2xl relative overflow-hidden my-auto select-none"
          >
            {/* Top Shimmer Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent" />

            {/* Header: Node Code, Country & Score Gauge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded uppercase">
                  {activeHub.code}
                </span>
                <span className="font-mono text-xs text-muted-foreground font-medium">
                  {activeHub.country}
                </span>
              </div>

              {/* Score Gauge Dial */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-background border border-primary/40 text-primary font-mono text-[10px] sm:text-xs font-bold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span>SCORE: {activeHub.technoeconomicScore || 85}/100</span>
                </div>

                <button
                  onClick={onResetCamera}
                  className="p-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Close Node Telemetry"
                >
                  <Icon icon="carbon:close" className="text-base" />
                </button>
              </div>
            </div>

            {/* Hub Title */}
            <h3 className="font-Bebas text-2xl sm:text-3xl text-primary leading-none tracking-wide mb-1">
              {activeHub.name}
            </h3>

            {/* Hub Highlight Pill */}
            <p className="text-accent font-mono text-[11px] font-semibold mb-3 flex items-center gap-1.5">
              <Icon icon="carbon:star-filled" className="text-accent text-xs" />
              <span>{activeHub.highlight}</span>
            </p>

            {/* Compact Micro-Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted border border-border mb-3 font-mono text-[10px] font-bold">
              {["OVERVIEW", "TECH", "ECONOMY"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 rounded-lg transition-all text-center ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "OVERVIEW" && (
              <div className="space-y-3">
                <p className="text-foreground text-xs sm:text-sm font-sans leading-relaxed line-clamp-2">
                  {activeHub.description}
                </p>

                {/* Key Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="bg-muted p-2 rounded-xl border border-border flex flex-col">
                    <span className="text-muted-foreground text-[9px] uppercase">DIGITAL SHARE</span>
                    <span className="text-primary font-bold text-xs mt-0.5 truncate">{activeHub.digitalShare}</span>
                  </div>
                  <div className="bg-muted p-2 rounded-xl border border-border flex flex-col">
                    <span className="text-muted-foreground text-[9px] uppercase">TECH GDP</span>
                    <span className="text-primary font-bold text-xs mt-0.5 truncate">{activeHub.techGdp}</span>
                  </div>
                  <div className="bg-muted p-2 rounded-xl border border-border flex flex-col">
                    <span className="text-muted-foreground text-[9px] uppercase">GDP</span>
                    <span className="text-secondary font-bold text-xs mt-0.5 truncate">{activeHub.gdp}</span>
                  </div>
                  <div className="bg-muted p-2 rounded-xl border border-border flex flex-col">
                    <span className="text-muted-foreground text-[9px] uppercase">GROWTH</span>
                    <span className="text-accent font-bold text-xs mt-0.5 truncate">{activeHub.growth}</span>
                  </div>
                </div>

                {/* Key Industry Clusters */}
                {activeHub.keyIndustries && activeHub.keyIndustries.length > 0 && (
                  <div className="pt-1">
                    <span className="text-muted-foreground font-mono text-[9px] uppercase tracking-wider block mb-1.5">
                      KEY INDUSTRY NODES:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeHub.keyIndustries.map((ind, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-background border border-border text-foreground font-mono text-[9px] font-medium"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: TECH VECTOR */}
            {activeTab === "TECH" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">DIGITAL PAYMENTS</span>
                  <span className="text-primary font-bold text-xs mt-0.5">{activeHub.digitalShare}</span>
                </div>
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">TECH GDP SHARE</span>
                  <span className="text-primary font-bold text-xs mt-0.5">{activeHub.techGdp}</span>
                </div>
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">NETWORK COVERAGE</span>
                  <span className="text-primary font-bold text-xs mt-0.5">{activeHub.networkCoverage}</span>
                </div>
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">AI ADOPTION</span>
                  <span className="text-accent font-bold text-xs mt-0.5">{activeHub.aiAdoption || "High"}</span>
                </div>
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">R&D INVESTMENTS</span>
                  <span className="text-secondary font-bold text-xs mt-0.5">{activeHub.rnd || "2.5% GDP"}</span>
                </div>
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">NODE STATUS</span>
                  <span className="text-accent font-bold text-xs mt-0.5">SYNCHRONIZED</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ECONOMY VECTOR */}
            {activeTab === "ECONOMY" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">NOMINAL GDP</span>
                  <span className="text-primary font-bold text-xs mt-0.5">{activeHub.gdp}</span>
                </div>
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">PER CAPITA</span>
                  <span className="text-secondary font-bold text-xs mt-0.5">{activeHub.gdpPerCapita}</span>
                </div>
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">ANNUAL GROWTH</span>
                  <span className="text-accent font-bold text-xs mt-0.5">{activeHub.growth}</span>
                </div>
                <div className="bg-muted p-2.5 rounded-xl border border-border flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase">UNEMPLOYMENT</span>
                  <span className="text-muted-foreground font-bold text-xs mt-0.5">{activeHub.unemployment}</span>
                </div>
              </div>
            )}

            {/* Card Footer: Coordinates & Close Action */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border font-mono text-[10px]">
              <span className="text-muted-foreground uppercase">
                LAT: {activeHub.lat}° | LON: {activeHub.lon}°
              </span>
              <button
                onClick={onResetCamera}
                className="text-primary hover:text-accent font-bold flex items-center gap-1 transition-colors uppercase"
              >
                <span>Close Telemetry</span>
                <Icon icon="carbon:close" className="text-xs" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Footer Legend */}
      {!activeHub && (
        <div className="flex items-center justify-between w-full text-[10px] font-mono text-muted-foreground border-t border-border pt-2.5 pointer-events-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Capital Hubs (GDP / Liquidity Index)</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-sm" />
              <span>Cross-Border Settlement Corridors</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-accent shadow-sm" />
              <span>Regulatory Sandboxes & AI Nodes</span>
            </span>
          </div>

          <span className="uppercase tracking-wider text-muted-foreground text-[10px]">
            DRAG TO ROTATE • SCROLL TO ZOOM
          </span>
        </div>
      )}
    </div>
  );
}