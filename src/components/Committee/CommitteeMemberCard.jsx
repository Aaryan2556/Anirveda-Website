import React, { useState, memo } from "react";
import { Icon } from "@iconify/react";
import { getCommitteeAvatarUrl } from "../../utils/cloudinary";

/**
 * Memoized CommitteeMemberCard Component
 * Features Cloudinary 400x400 face-centered avatar delivery, progressive skeleton placeholder,
 * lazy image decoding, and content-visibility off-screen DOM containment.
 *
 * @param {Object} props
 * @param {Object} props.member - Member data object
 */
const CommitteeMemberCard = memo(function CommitteeMemberCard({ member }) {
  const [loaded, setLoaded] = useState(false);
  const avatarUrl = getCommitteeAvatarUrl(member.img_src);

  return (
    <div className="group rounded-3xl bg-card border border-border p-6 shadow-xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between hover:border-primary/50 transition-all duration-300 [content-visibility:auto] [contain-intrinsic-size:300px_400px]">
      {/* Top Multi-Stop Gradient Shimmer Line */}
      

      <div>
        {/* Header Spec: Node Code & Live Status Pulse */}
        <div className="flex items-center justify-between mb-4 font-mono text-[10px]">
          <span className="font-bold text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full uppercase">
            {member.nodeCode}
          </span>
          <span className="flex items-center gap-1.5 text-primary font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            ACTIVE
          </span>
        </div>

        {/* Member Avatar */}
        <div className="relative mb-5 flex justify-center">
          <div className="relative h-32 w-32 rounded-full border-2 border-primary/30 p-1 bg-muted/40 overflow-hidden shadow-inner group-hover:border-primary transition-colors">
            {/* Skeleton Loader Placeholder */}
            {!loaded && (
              <div className="absolute inset-0 bg-muted/60 animate-pulse rounded-full z-10" />
            )}

            <img
              src={avatarUrl}
              alt={member.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={`h-full w-full rounded-full object-cover object-center transition-all duration-500 group-hover:scale-110 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </div>

        {/* Name & Role */}
        <div className="text-center">
          <h3 className="font-sans text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
            {member.name}
          </h3>
          <p className="mt-1 font-mono text-xs font-semibold text-primary uppercase">
            {member.position}
          </p>
        </div>

        {/* Primary Vector Callout Box */}
        <div className="mt-4 p-3 rounded-2xl bg-muted/60 border border-border flex flex-col gap-1 text-center font-mono">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            PRIMARY VECTOR
          </span>
          <span className="text-[11px] text-foreground font-semibold leading-tight">
            {member.vector}
          </span>
        </div>
      </div>

      {/* LinkedIn Handle Trigger Button */}
      <div className="mt-6 pt-2">
        <a
          href={member.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_hsl(var(--primary-hsl)/0.3)] group-hover:scale-105 transition-transform"
        >
          <Icon icon="carbon:logo-linkedin" className="text-sm" />
          <span>Connect Telemetry</span>
        </a>
      </div>
    </div>
  );
});

export default CommitteeMemberCard;
