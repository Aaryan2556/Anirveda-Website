import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export default function Departments() {
  const [open, setOpen] = useState(true);

  const departments = [
    { id: 2, link: "/em-logs", name: "Event Management & Creative", code: "EM-01" },
    { id: 3, link: "/dm", name: "Digital Marketing", code: "MKT-02" },
    { id: 4, link: "/pr", name: "Public Relations", code: "PR-03" },
    { id: 5, link: "/cnd", name: "Content & Documentation", code: "DOC-04" },
    { id: 6, link: "/tech", name: "Technical & Systems", code: "DEV-05" },
    { id: 8, link: "/gd", name: "Graphics Design & Media", code: "MEDIA-06" },
    { id: 9, link: "/sponsorship", name: "Sponsorship & Capital", code: "FIN-07" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-background text-foreground">
      {/* Dropdown Toggle Button */}
      <div className="flex flex-col items-center justify-center mb-6 text-center">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="group flex flex-col items-center justify-center gap-2 transition-all focus:outline-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-mono text-xs uppercase tracking-widest mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>OPERATIONAL SECTORS</span>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="font-Bebas text-5xl sm:text-7xl md:text-8xl uppercase text-primary tracking-wide">
              Departments
            </h2>
            <motion.span animate={open ? { rotate: 180 } : { rotate: 0 }} transition={{ duration: 0.3 }}>
              <Icon icon="carbon:chevron-down" className="text-3xl text-primary group-hover:scale-125 transition-transform" />
            </motion.span>
          </div>
        </button>
      </div>

      {/* Accordion Content Grid */}
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 pt-4 font-sans">
          {departments.map((dept, index) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link to={dept.link} className="block group">
                <div className="rounded-2xl bg-card border border-border p-6 shadow-md backdrop-blur-xl relative overflow-hidden flex flex-col justify-between h-full group-hover:border-primary/50 group-hover:shadow-primary/10 transition-all duration-300">
                  {/* Top shimmer line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent opacity-40 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full uppercase">
                      {dept.code}
                    </span>
                    <Icon icon="carbon:arrow-up-right" className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {dept.name}
                  </h3>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>SECTOR ACTIVE</span>
                    <span className="text-primary font-semibold">VIEW VECTOR →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
