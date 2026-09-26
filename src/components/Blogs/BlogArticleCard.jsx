import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Calendar, User, BookOpen } from "lucide-react";

export default function BlogArticleCard({ blog, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
      className="group relative rounded-2xl select-none flex flex-col h-full"
    >
      {/* Glassmorphic Surface */}
      <div className="relative h-full w-full rounded-2xl bg-card p-6 flex flex-col justify-between overflow-hidden border border-border transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-xl group-hover:shadow-primary/10">
        
        {/* Top Ambient Glow */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/15 via-transparent to-transparent pointer-events-none" />

        {/* Top Bar: Category Badge & Read Velocity */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="px-2.5 py-0.5 rounded-full bg-background border border-border text-secondary font-mono text-[10px] font-bold tracking-wider uppercase">
            {blog.categoryLabel || "RESEARCH"}
          </span>

          <div className="flex items-center gap-1 font-mono text-[10px] text-accent font-bold">
            <Clock className="w-3 h-3" />
            <span>{blog.readTime || "5 min read"}</span>
          </div>
        </div>

        {/* Image Frame with Smooth Hover Zoom */}
        <div className="h-48 w-full rounded-xl bg-muted/40 border border-border/80 p-1.5 flex items-center justify-center mb-5 group-hover:border-primary/40 transition-colors shadow-inner overflow-hidden relative">
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-full object-cover rounded-lg filter transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Title & Excerpt */}
        <div className="flex-1 flex flex-col justify-start mb-4">
          <h3 className="font-Bebas text-3xl tracking-wide text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
            {blog.title}
          </h3>

          <p className="font-sans text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
            {blog.excerpt}
          </p>

          {/* Author & Date Telemetry */}
          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground pt-3 border-t border-border/80">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-secondary" />
              <span>{blog.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-secondary" />
              <span>{blog.date}</span>
            </div>
          </div>
        </div>

        {/* Action Trigger Link */}
        <div className="pt-2">
          <Link
            to={`/blogs/${blog.id}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted border border-border text-muted-foreground font-mono text-xs font-bold uppercase tracking-wider group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>READ ARTICLE</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
