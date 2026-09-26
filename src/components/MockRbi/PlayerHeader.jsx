import React from "react";
import { Link } from "react-router-dom";

/**
 * PlayerHeader Component displaying active team status, current score, and navigation actions.
 *
 * @param {Object} props
 * @param {Object} props.team - Current team object
 */
export default function PlayerHeader({ team }) {
  if (!team) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 pb-6 border-b border-border">
      <div>
        <h1 className="font-Bebas text-4xl sm:text-5xl text-primary tracking-wide leading-none">
          MOCK RBI // POLICY TERMINAL
        </h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          DECISION ROOM NODE :: TEAM <span className="text-secondary font-bold">{team.teamName}</span>
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Current Team Score Badge */}
        <div className="px-4 py-2 rounded-xl bg-card border border-primary/40 flex items-center gap-2 font-mono text-sm shadow-md">
          <span className="text-muted-foreground text-xs uppercase">CURRENT SCORE:</span>
          <span className="text-primary font-bold text-lg">{team.Score} PTS</span>
        </div>

        <Link
          to="/mock-rbi/leaderboard"
          className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:border-primary hover:text-primary transition-all font-mono text-xs font-bold uppercase"
        >
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
