import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Terminal } from "lucide-react";

import Navbar from "../components/Navbar";
import ContactUs from "../components/ContactUs";
import AnnouncementBar from "../components/AnnouncementBar";
import CustomCursor from "../components/common/CustomCursor";

import { sponsorsData, sponsorsCategoryTabs } from "../data/sponsorsData";
import SponsorCard from "../components/sponsors/SponsorCard";
import SponsorModal from "../components/sponsors/SponsorModal";
import AmbientGridCanvas from "../components/sponsors/AmbientGridCanvas";

// Dedicated Sponsors Page Component
export default function Sponsors() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSponsor, setSelectedSponsor] = useState(null);

  // Filter sponsors
  const filteredSponsors = sponsorsData.filter((s) => {
    const matchesTab = activeTab === "all" || s.category === activeTab;
    const matchesQuery =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tierTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans relative overflow-x-hidden select-none">
      {/* Ambient Mouse Tracking Light & Custom Cursor */}
      <CustomCursor />

      {/* Navigation Header */}
      <AnnouncementBar />
      <Navbar />

      {/* Main Content Layout */}
      <main className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <AmbientGridCanvas />

        {/* Revamped Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative flex flex-col items-center text-center pt-8 pb-12"
        >
          {/* Ambient Glow Backdrop Behind Heading */}
          <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-32 bg-primary/20 rounded-full blur-3xl -z-10" />

          {/* Status Telemetry Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-primary/40 text-primary font-mono text-xs font-bold tracking-widest uppercase mb-6 shadow-md"
          >
            <span>EMPOWERING INNOVATION & GROWTH // SPONSOR ECOSYSTEM</span>
          </motion.div>

          {/* Primary-Colored Heading with Layered Depth Glow Shadows */}
          <motion.h1
            initial={{ opacity: 0, y: 25, letterSpacing: "0.02em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.05em" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-Bebas text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-wider text-primary leading-none mb-6 drop-shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
          >
            SPONSORS
          </motion.h1>

          {/* Subtitle Paragraph with Stagger Delay */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="font-sans text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed mb-10"
          >
            Anirveda is dedicated to fostering innovation, bridging technology and economics to create meaningful solutions. Our sponsors are integral to this journey, enabling us to host events, workshops, and projects that empower students to turn ideas into reality.
          </motion.p>

          {/* Category Tabs & Search HUD Bar */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-card border border-border backdrop-blur-md shadow-xl">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 w-full md:w-auto">
              {sponsorsCategoryTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const count =
                  tab.id === "all"
                    ? sponsorsData.length
                    : sponsorsData.filter((s) => s.category === tab.id).length;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-border"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive ? "bg-background text-primary" : "bg-background/60 text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 select-text">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search sponsors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border font-mono text-xs text-secondary placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:text-primary focus:ring-1 focus:ring-primary caret-primary transition-all duration-200 select-text relative z-0"
              />
            </div>
          </div>
        </motion.div>

        {/* High-Contrast Sponsor Grid */}
        {filteredSponsors.length > 0 ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredSponsors.map((sponsor, idx) => (
              <SponsorCard
                key={sponsor.id}
                sponsor={sponsor}
                index={idx}
                onSelectModal={(sp) => setSelectedSponsor(sp)}
              />
            ))}
          </div>
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center bg-card border border-border rounded-2xl mb-16 font-mono text-muted-foreground">
            <Terminal className="w-10 h-10 mb-3 text-accent" />
            <p className="text-sm">NO MATCHING SPONSORS FOUND IN DATABASE</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <ContactUs />

      {/* Telemetry Inspection Modal */}
      {selectedSponsor && (
        <SponsorModal sponsor={selectedSponsor} onClose={() => setSelectedSponsor(null)} />
      )}
    </div>
  );
}