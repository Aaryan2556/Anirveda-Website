import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Terminal } from "lucide-react";

import Navbar from "../components/Navbar";
import ContactUs from "../components/ContactUs";
import AnnouncementBar from "../components/AnnouncementBar";
import CustomCursor from "../components/common/CustomCursor";

import blogData, { BLOG_CATEGORIES } from "../data/blogs";
import FeaturedDossierCard from "../components/Blogs/FeaturedDossierCard";
import BlogArticleCard from "../components/Blogs/BlogArticleCard";
import BlogsGridCanvas from "../components/Blogs/BlogsGridCanvas";

export default function Blogs() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Flagship featured dossier (first item)
  const featuredBlog = blogData.find((b) => b.isFeatured) || blogData[0];

  // Filtered dataset
  const filteredBlogs = blogData.filter((b) => {
    const matchesCategory = activeCategory === "all" || b.category === activeCategory;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.tags && b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans relative overflow-x-hidden select-none">
      {/* Ambient Mouse Tracking Light & Custom Cursor */}
      <CustomCursor />
      {/* Site Header Navigation */}
      <AnnouncementBar />
      <Navbar />

      {/* Main Content Layout - Reduced mobile top padding from py-12 to pt-2 sm:pt-12 pb-12 */}
      <main className="relative z-10 pt-2 sm:pt-12 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Background Canvas Backdrop */}
        <BlogsGridCanvas />

        {/* Hero Section & Intelligence HUD - Reduced mobile top padding from pt-8 to pt-2 sm:pt-8 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex flex-col items-center text-center pt-2 sm:pt-8 pb-8 sm:pb-12"
        >
          {/* Ambient Glow Backdrop Behind Heading */}
          <div className="pointer-events-none absolute top-12 sm:top-24 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-24 sm:h-32 bg-primary/20 rounded-full blur-3xl -z-10" />

          {/* Status Telemetry Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted border border-primary/40 text-primary font-mono text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4 sm:mb-6 shadow-md"
          >
            <span>RESEARCH & POLICY TERMINAL</span>
          </motion.div>

          {/* Primary-Colored Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20, letterSpacing: "0.02em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.05em" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-Bebas text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] tracking-tight sm:tracking-wider text-primary leading-[0.95] mb-4 sm:mb-6 drop-shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] max-w-full break-words"
          >
            PUBLICATIONS
          </motion.h1>

          {/* Subtitle Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="font-sans text-xs sm:text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6 sm:mb-10"
          >
            Explore frontier research, macroeconomic analysis, influencer entrepreneurship studies, and technological policy frameworks curated by the Anirveda Intelligence Team.
          </motion.p>

          {/* Category Tabs & Search Bar HUD */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-2.5 sm:p-3 rounded-2xl bg-card border border-border backdrop-blur-md shadow-xl">
            {/* Category Pills Touch-First Swipe Rail */}
            <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center justify-start gap-2 w-full md:w-auto touch-pan-x min-h-[44px] py-1 px-0.5">
              {BLOG_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const count =
                  cat.id === "all"
                    ? blogData.length
                    : blogData.filter((b) => b.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all duration-300 flex-shrink-0 whitespace-nowrap min-h-[44px] ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-border"
                    }`}
                  >
                    <span>{cat.label}</span>
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

            {/* Search Input HUD */}
            <div className="relative w-full md:w-72 select-text">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border font-mono text-base sm:text-xs text-secondary placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:text-primary focus:ring-1 focus:ring-primary caret-primary transition-all duration-200 select-text relative z-0"
              />
            </div>
          </div>
        </motion.div>

        {/* Featured Flagship Lead Research Dossier */}
        {featuredBlog && activeCategory === "all" && !searchQuery && (
          <FeaturedDossierCard blog={featuredBlog} />
        )}

        {/* Article Grid Header */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-2 border-b border-border">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>RESEARCH DOSSIERS & ARTICLES ({filteredBlogs.length})</span>
          </div>
        </div>

        {/* 3D Holographic Publication Grid */}
        {filteredBlogs.length > 0 ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredBlogs.map((blog, idx) => (
              <BlogArticleCard key={blog.id} blog={blog} index={idx} />
            ))}
          </div>
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center bg-card border border-border rounded-2xl mb-16 font-mono text-muted-foreground">
            <Terminal className="w-10 h-10 mb-3 text-accent" />
            <p className="text-sm">NO MATCHING DOSSIERS FOUND IN INTELLIGENCE ARCHIVE</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <ContactUs />
    </div>
  );
}