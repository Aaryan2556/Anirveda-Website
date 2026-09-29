import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Navbar from "../components/Navbar";
import AnnouncementBar from "../components/AnnouncementBar";
import Departments from "../components/Committee/Departments";
import ContactUs from "../components/ContactUs";
import CommitteeMemberCard from "../components/Committee/CommitteeMemberCard";
import advisors from "../data/committee/advisors";
import executives from "../data/committee/executives";
import CustomCursor from "../components/common/CustomCursor";

// Domain Categories for Tab Filters
const DOMAIN_TABS = [
  { id: "all", label: "ALL NODES", icon: "carbon:network-3" },
  { id: "executives", label: "EXECUTIVE GOVERNANCE", icon: "carbon:user-role" },
  { id: "advisors", label: "ADVISORY BOARD", icon: "carbon:certificate-check" },
  { id: "departments", label: "OPERATIONAL SECTORS", icon: "carbon:categories" },
];

/**
 * Optimized Committee Page Component
 * Features Cloudinary face-centered 400x400 avatar delivery, progressive skeleton headshots,
 * viewport-throttled animations, and content-visibility DOM containment.
 */
export default function Committee() {
  const [activeTab, setActiveTab] = useState("all");
  const contentSectionRef = useRef(null);

  // Format executive committee members with node specs
  const formattedExecutives = executives.map((item) => ({
    ...item,
    category: "executives",
    nodeCode: `EXEC-0${item.id}`,
    vector: item.position.includes("President")
      ? "Executive Governance & Strategy"
      : item.position.includes("Financial")
        ? "Macroeconomic & Fiscal Policy"
        : "Quantitative & Systems Coordination",
  }));

  // Format advisory committee members with node specs
  const formattedAdvisors = advisors.map((item) => ({
    ...item,
    category: "advisors",
    nodeCode: `ADV-0${item.id}`,
    vector: item.position.includes("President")
      ? "Senior Advisory & Strategic Direction"
      : item.position.includes("Financial")
        ? "Capital Allocation & Treasury Operations"
        : "Alumni Network & Ecosystem Guidance",
  }));

  const allMembers = [...formattedExecutives, ...formattedAdvisors];

  // Hash-based landing and smooth scroll support
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (hash && DOMAIN_TABS.some((t) => t.id === hash)) {
      setActiveTab(hash);
      setTimeout(() => {
        contentSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (window.history.pushState) {
      window.history.pushState(null, "", `#${tabId}`);
    }
    contentSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getFilteredMembers = () => {
    if (activeTab === "executives") return formattedExecutives;
    if (activeTab === "advisors") return formattedAdvisors;
    return allMembers;
  };

  const filteredMembers = getFilteredMembers();

  return (
    <div className="bg-background text-foreground font-sans min-h-screen relative overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      {/* Ambient Mouse Tracking Light & Custom Cursor */}
      <CustomCursor />

      {/* Top Navigation Stack */}
      <AnnouncementBar />
      <Navbar />

      {/* 1. HERO HEADER SECTION */}
      <section className="relative w-full pt-12 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Backlight Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Header Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <span className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-muted/80 border border-primary/40 text-primary font-mono text-xs sm:text-sm font-bold tracking-wider backdrop-blur-md shadow-sm text-center">
  COMMITTEE NODE MATRIX
</span>
          </motion.div>

          {/* Hero Bebas Title */}
          <motion.h1
            initial={{ opacity: 0, y: 25, letterSpacing: "0.02em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.05em" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-Bebas text-6xl sm:text-8xl md:text-9xl uppercase tracking-wider text-primary leading-none mb-6 select-none drop-shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
          >
            GOVERNANCE & COMMITTEE
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-muted-foreground text-sm sm:text-base lg:text-xl font-normal leading-relaxed max-w-2xl"
          >
            The techno-economic leaders driving algorithmic strategy, macroeconomic research, compute infrastructure, and institutional growth behind Anirveda.
          </motion.p>
        </div>
      </section>

      {/* 2. INTERACTIVE DOMAIN TABS */}
      <section ref={contentSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-20">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-2 rounded-2xl bg-card/80 border border-border backdrop-blur-xl shadow-lg">
          {DOMAIN_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === "all"
                ? allMembers.length
                : tab.id === "executives"
                  ? formattedExecutives.length
                  : tab.id === "advisors"
                    ? formattedAdvisors.length
                    : 7;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 ${isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary-hsl)/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                <Icon icon={tab.icon} className="text-base" />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted border border-border text-muted-foreground"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. FLUID CONTENT GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab !== "departments" ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
            >
              {filteredMembers.map((member) => (
                <CommitteeMemberCard
                  key={`${member.category}-${member.id}`}
                  member={member}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="departments-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <Departments />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 4. STANDALONE DEPARTMENTS SECTION FOR ALL NODES VIEW */}
      {activeTab === "all" && (
        <section className="border-t border-border bg-background py-8">
          <Departments />
        </section>
      )}

      {/* Footer Contact Us */}
      <ContactUs />
    </div>
  );
}
