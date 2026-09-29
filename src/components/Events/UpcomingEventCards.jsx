import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  X,
  Filter,
  Layers,
} from "lucide-react";
import { economaniaEvents } from "../../data/economania.js";

// Enhanced Event Data with Categories and Prize Badges
const enrichedEvents = economaniaEvents.map((event) => {
  let category = "Auctions & Simulations";
  let categoryTag = "STRATEGY AUCTION";
  let prizePool = "Exclusive Perks";
  let status = "Upcoming";

  if (event.id === 1) {
    category = "Hackathons";
    categoryTag = "FINTECH HACKATHON";
    prizePool = "₹2,00,000 Prize Pool";
    status = "Registrations Live";
  } else if (event.id === 2) {
    category = "Auctions & Simulations";
    categoryTag = "STRATEGY AUCTION";
    prizePool = "₹2,000 Prize Pool";
    status = "Registrations Live";
  } else if (event.id === 3) {
    category = "Auctions & Simulations";
    categoryTag = "TECH SIMULATION";
    prizePool = "Cash Prizes & Trophies";
    status = "Upcoming";
  } else if (event.id === 4) {
    category = "Auctions & Simulations";
    categoryTag = "SPACE SIMULATION";
    prizePool = "Merchandise & Certificates";
    status = "Upcoming";
  } else if (event.id === 5) {
    category = "Workshops";
    categoryTag = "SPEAKER SESSION";
    prizePool = "Certificates & Mentorship";
    status = "Registrations Live";
  } else if (event.id === 6) {
    category = "Auctions & Simulations";
    categoryTag = "PITCH SIMULATION";
    prizePool = "Incubation Support";
    status = "Upcoming";
  }

  return {
    ...event,
    category,
    categoryTag,
    prizePool,
    status,
  };
});

const categories = ["All", "Hackathons", "Auctions & Simulations", "Workshops"];

export default function UpcomingEventCards() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeModalEvent, setActiveModalEvent] = useState(null);

  const filteredEvents =
    selectedCategory === "All"
      ? enrichedEvents
      : enrichedEvents.filter((e) => e.category === selectedCategory);

  return (
    <div className="w-full text-foreground py-6">
      {/* Filter / Category Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filter Initiatives:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wide transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold border border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                    : "bg-card text-muted-foreground hover:text-primary border border-border hover:border-primary/40"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative flex flex-col justify-between rounded-3xl bg-card border border-border hover:border-primary/60 p-4 sm:p-5 backdrop-blur-xl transition-all duration-500 shadow-2xl hover:shadow-[0_0_35px_hsl(var(--primary)/0.2)] overflow-hidden"
            >
              {/* Ambient Hover Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700 pointer-events-none" />

              <div>
                {/* Poster Image Container */}
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden mb-4 bg-muted border border-border group-hover:border-primary/40 transition-colors">
                  <img
                    src={event.img}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />

                  {/* Top-Left Badge: Prize Pool */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/85 backdrop-blur-md border border-primary/40 text-primary font-mono text-xs font-bold shadow-lg">
                    <Trophy className="w-3.5 h-3.5 text-primary" />
                    <span>{event.prizePool}</span>
                  </div>

                  {/* Top-Right Badge: Category Tag */}
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/85 backdrop-blur-md border border-border text-foreground font-mono text-[10px] uppercase tracking-wider shadow-lg">
                    <span>{event.categoryTag}</span>
                  </div>

                  {/* Bottom Poster Info Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    {/* Live Status Badge */}
                    {event.status === "Registrations Live" ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 border border-primary/50 text-primary font-mono text-[11px] font-semibold backdrop-blur-md shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span>Registrations Live</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 border border-secondary/50 text-secondary font-mono text-[11px] font-semibold backdrop-blur-md shadow-md">
                        <Sparkles className="w-3 h-3 text-secondary" />
                        <span>Upcoming Initiative</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Title & Description */}
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {event.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 font-sans">
                  {event.description}
                </p>

                {/* Metadata List */}
                <div className="space-y-2 mb-5 font-mono text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{event.timing}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border">
                <button
                  onClick={() => setActiveModalEvent(event)}
                  className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground hover:text-primary font-mono text-xs flex items-center gap-1 transition-all"
                >
                  <span>Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                {event.registrationLink && event.registrationLink !== "" ? (
                  <a
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:scale-[1.02] transition-all"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-mono text-xs cursor-not-allowed border border-border"
                  >
                    <span>Coming Soon</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {activeModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setActiveModalEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-xs">
                  {activeModalEvent.categoryTag}
                </span>
                <span className="px-3 py-1 rounded-full bg-muted border border-border text-foreground font-mono text-xs">
                  {activeModalEvent.prizePool}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-3">
                {activeModalEvent.title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-sans">
                {activeModalEvent.description}
              </p>

              <div className="space-y-3 mb-6 bg-muted/40 p-4 rounded-2xl border border-border font-mono text-xs text-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Date: {activeModalEvent.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Timing: {activeModalEvent.timing}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Venue: {activeModalEvent.venue}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="px-5 py-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-mono text-xs"
                >
                  Close
                </button>
                {activeModalEvent.registrationLink ? (
                  <a
                    href={activeModalEvent.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                  >
                    <span>Proceed to Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-5 py-2.5 rounded-xl bg-muted text-muted-foreground font-mono text-xs cursor-not-allowed border border-border"
                  >
                    Registrations Opening Soon
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}