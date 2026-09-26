import React from "react";

/**
 * MiniLeaderboard Component displaying top 5 ranking teams in the Mock RBI simulation.
 *
 * @param {Object} props
 * @param {Array} props.teams - Top teams array
 * @param {Object} props.currentTeam - Currently logged in team
 */
export default function MiniLeaderboard({ teams, currentTeam }) {
  if (!teams || teams.length === 0) return null;

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xl font-mono">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <h3 className="font-Bebas text-2xl text-primary tracking-wide">
          LIVE RANKINGS (TOP 5)
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          REAL-TIME SCORE & SPEED
        </span>
      </div>

      <div className="space-y-2">
        {teams.map((t, idx) => {
          const isCurrent = currentTeam && currentTeam.$id === t.$id;
          return (
            <div
              key={t.$id || idx}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                isCurrent
                  ? "bg-primary/10 border-primary text-primary font-bold"
                  : "bg-background border-border/80 text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0
                      ? "bg-amber-500 text-black"
                      : idx === 1
                      ? "bg-slate-300 text-black"
                      : idx === 2
                      ? "bg-amber-700 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {t.teamName}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-primary font-bold">{t.Score} PTS</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
