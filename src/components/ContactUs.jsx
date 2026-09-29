"use client";
import React, { useState } from "react";
import {
  MapPin,
  Mail,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Copy,
  Check,
  ArrowUpRight,
} from "lucide-react";
import Form from "./Home/Form";

export default function ContactUs() {
  const [copied, setCopied] = useState(false);
  const [, setStripText] = useState("Form submitted successfully!");
  const [, setShowNotification] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("anirvedatecheco@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const triggerNotification = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();

    const targetElement = document.getElementById(id);

    if (targetElement) {
      const navOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      window.history.pushState(null, "", `#${id}`);
    } else {
      sessionStorage.setItem("anirveda_scroll_target", id);
      window.location.href = `/#${id}`;
    }
  };

  return (
    <footer
      id="contact"
      className="relative w-full bg-background text-foreground overflow-hidden pt-16 pb-12 border-t border-border"
    >
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1. 2-Column Contact Bento Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-20">
          {/* Left Column: Direct Outreach & Info */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight font-Bebas uppercase">
              Let's Build Something{" "}
              <span className="text-primary block sm:inline">Disruptive</span>
            </h2>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-sans">
              Have an idea, partnership inquiry, or question regarding our
              techno-economic initiatives? Send us a message and connect with our team.
            </p>

            {/* Info Cards */}
            <div className="space-y-4 pt-2">
              {/* Campus Location Card */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all group shadow-sm">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    CAMPUS HEADQUARTERS
                  </h4>
                  <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-normal">
                    Pandit Deendayal Energy University (PDEU), Knowledge Corridor,
                    Raisan, Gandhinagar, Gujarat 382426
                  </p>
                </div>
              </div>

              {/* Email Card */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border hover:border-accent/40 transition-all group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-accent/10 text-accent border border-accent/20 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-accent uppercase tracking-wider mb-0.5">
                      DIRECT EMAIL
                    </h4>
                    <a
                      href="mailto:anirvedatecheco@gmail.com"
                      className="font-mono text-xs sm:text-sm text-foreground hover:text-accent transition-colors"
                    >
                      anirvedatecheco@gmail.com
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleCopyEmail}
                  type="button"
                  title="Copy email to clipboard"
                  className="p-2 rounded-xl bg-muted hover:bg-accent/20 text-muted-foreground hover:text-accent border border-border transition-all"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-3">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-3">
                CONNECT ON SOCIAL MEDIA
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/anirveda_pdeu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-3 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 active:scale-95 transition-all shadow-md"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/anirveda-the-technoeconomics-club/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="p-3 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 active:scale-95 transition-all shadow-md"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://www.youtube.com/@anirvedapdeu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="p-3 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 active:scale-95 transition-all shadow-md"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/anirveda_pdeu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X Twitter"
                  className="p-3 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 active:scale-95 transition-all shadow-md"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <Form
              showStrip={triggerNotification}
              setStripText={setStripText}
            />
          </div>
        </div>

        {/* 2. Structured Sub-Footer Bar */}
        <div className="pt-12 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-foreground tracking-wider">
                  ANIRVEDA
                </span>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] border border-primary/30">
                  PDEU
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                The official Techno-Economics club of Pandit Deendayal Energy University.
                Synthesizing economic theory and technological disruption since 2016.
              </p>
            </div>

            {/* Quick Navigation Links */}
            <div>
              <h4 className="font-mono text-xs font-bold text-primary uppercase tracking-widest mb-4">
                NAVIGATION
              </h4>
              <ul className="space-y-2 font-sans text-xs text-muted-foreground">
                <li>
                  <a
                    href="/#about"
                    onClick={(e) => scrollToSection(e, "about")}
                    className="hover:text-primary transition-colors cursor-pointer block"
                  >
                    Genesis & Mission
                  </a>
                </li>
                <li>
                  <a
                    href="/#events"
                    onClick={(e) => scrollToSection(e, "events")}
                    className="hover:text-primary transition-colors cursor-pointer block"
                  >
                    Flagship Events
                  </a>
                </li>
                <li>
                  <a
                    href="/#testimonials"
                    onClick={(e) => scrollToSection(e, "testimonials")}
                    className="hover:text-primary transition-colors cursor-pointer block"
                  >
                    Alumni Voices
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => scrollToSection(e, "contact")}
                    className="hover:text-primary transition-colors cursor-pointer block"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Initiatives */}
            <div>
              <h4 className="font-mono text-xs font-bold text-accent uppercase tracking-widest mb-4">
                INITIATIVES
              </h4>
              <ul className="space-y-2 font-sans text-xs text-muted-foreground">
                <li>
                  <span className="hover:text-accent cursor-pointer transition-colors">
                    Breach FinTech Hackathon
                  </span>
                </li>
                <li>
                  <span className="hover:text-accent cursor-pointer transition-colors">
                    IPL Strategy Auction
                  </span>
                </li>
                <li>
                  <span className="hover:text-accent cursor-pointer transition-colors">
                    Podcasts & Case Studies
                  </span>
                </li>
                <li>
                  <span className="hover:text-accent cursor-pointer transition-colors">
                    Macroeconomic Research
                  </span>
                </li>
              </ul>
            </div>

            {/* Location & Support Outreach */}
            <div>
              <h4 className="font-mono text-xs font-bold text-secondary uppercase tracking-widest mb-4">
                CAMPUS LOCATION
              </h4>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-3">
                Pandit Deendayal Energy University, Knowledge Corridor, Raisan, Gandhinagar, Gujarat 382426
              </p>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=anirvedatecheco@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-secondary hover:text-foreground transition-colors"
              >
                <span>anirvedatecheco@gmail.com</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Copyright Row */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-muted-foreground">
            <p>© 2026 Anirveda PDEU. All rights reserved.</p>
            <p className="text-foreground/80">Architected for Techno-Economic Disruption.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}