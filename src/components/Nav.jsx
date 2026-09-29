import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import MagneticButton from "./ui/MagneticButton";

export default function Nav() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = [
    { title: "HOME", url: "/" },
    { title: "EVENTS", url: "/events" },
    { title: "GALLERY", url: "/gallery" },
    { title: "COMMITTEE", url: "/committee" },
    { title: "SPONSORS", url: "/sponsors" },
    { title: "BLOGS", url: "/blogs" },
  ];

  const moreItems = [
    { title: "Mock RBI", url: "/mock-rbi" },
    { title: "Economania", url: "/economania" },
    { title: "GalaxEcon", url: "/galaxecon" },
    { title: "Cityscapes", url: "/cityscapes" },
  ];

  const isActive = (url) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <header className="relative z-40 py-3 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
      {/* Brand Logo Only - Extra Large */}
      <Link to="/" className="flex items-center group">
        <div className="relative w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-2xl bg-obsidian-900 border border-gold/30 flex items-center justify-center p-3 shadow-goldGlow group-hover:border-gold group-hover:shadow-[0_0_24px_rgba(212,175,55,0.4)] transition-all duration-300">
          <img
            src="/images/logos/logo_white.webp"
            alt="Anirveda Logo"
            className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Centered Floating Glassmorphic Pill Dock (Desktop) */}
      <nav className="hidden lg:flex items-center bg-obsidian-900/80 backdrop-blur-2xl px-3 py-1.5 rounded-full border border-slate-800 shadow-glassGlow relative">
        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`relative px-4 py-2 text-xs font-semibold tracking-wider transition-all duration-300 rounded-full ${active ? "text-gold" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {active && (
                <motion.span
                  layoutId="activeNavTab"
                  className="absolute inset-0 bg-gold/15 border border-gold/40 rounded-full -z-10 shadow-goldGlow"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {item.title}
            </Link>
          );
        })}

        {/* MORE Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            onBlur={() => setTimeout(() => setIsMoreOpen(false), 200)}
            className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all duration-300 rounded-full flex items-center space-x-1 ${isMoreOpen ? "text-gold" : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <span>MORE</span>
            <Icon
              icon="carbon:chevron-down"
              className={`text-xs transition-transform duration-200 ${isMoreOpen ? "rotate-180 text-gold" : ""
                }`}
            />
          </button>

          <AnimatePresence>
            {isMoreOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-obsidian-900/95 backdrop-blur-2xl border border-gold/30 rounded-2xl p-2 shadow-2xl z-50"
              >
                {moreItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className="block px-3 py-2 text-xs font-medium text-slate-300 hover:text-gold hover:bg-gold/10 rounded-xl transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Right Glowing CTA Button ("JOIN US") with Magnetic Physics */}
      <div className="hidden lg:flex items-center space-x-4">
        <MagneticButton magneticStrength={0.4} range={130}>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfeI3Bi013_xIiV8P3sNSc6wa46X52Qy3gCDdDjCfDD3MfnNw/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center rounded-full border border-primary/80 bg-background px-6 py-2.5 font-mono text-xs font-bold tracking-widest text-background uppercase shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-background hover:shadow-lg hover:shadow-primary/20"
          >
            <span className="flex items-center space-x-2">
              <span>JOIN US</span>
              <Icon
                icon="carbon:arrow-up-right"
                className="text-sm transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </a>
        </MagneticButton>
      </div>
      {/* Mobile Hamburger Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden p-2.5 rounded-xl bg-obsidian-900 border border-slate-800 text-slate-300 hover:text-gold hover:border-gold/30 transition-colors"
        aria-label="Toggle Mobile Menu"
      >
        <Icon icon={isMobileMenuOpen ? "carbon:close" : "carbon:menu"} className="text-xl" />
      </button>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 right-0 bg-obsidian-900/95 backdrop-blur-2xl border-b border-gold/20 p-6 z-50 lg:hidden shadow-2xl"
          >
            <div className="flex flex-col space-y-3 font-mono text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-2 px-3 rounded-xl transition-colors ${isActive(item.url)
                      ? "bg-gold/15 text-gold border border-gold/30 font-bold"
                      : "text-slate-300 hover:text-gold hover:bg-slate-800/50"
                    }`}
                >
                  {item.title}
                </Link>
              ))}

              <div className="border-t border-slate-800 pt-3 mt-2">
                <span className="text-xs uppercase text-slate-500 font-mono tracking-wider block mb-2 px-3">
                  More Programs
                </span>
                {moreItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 px-3 text-slate-300 hover:text-gold hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>

              <div className="pt-4">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfeI3Bi013_xIiV8P3sNSc6wa46X52Qy3gCDdDjCfDD3MfnNw/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center py-3 bg-gradient-to-r from-gold via-amber-500 to-gold text-obsidian-900 font-bold rounded-xl shadow-goldGlow uppercase tracking-wider"
                >
                  JOIN US NOW
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
