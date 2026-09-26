import React from "react";

/**
 * PlayerTimerBar Component rendering decision countdown gauge and progress bar.
 *
 * @param {Object} props
 * @param {number} props.timeLeft - Remaining time in seconds
 * @param {boolean} props.timerActive - Is timer currently counting down
 * @param {boolean} props.submitted - Has team already submitted response
 */
export default function PlayerTimerBar({ timeLeft, timerActive, submitted }) {
  const percentage = Math.max(0, Math.min(100, (timeLeft / 90) * 100));

  let colorClass = "bg-primary";
  if (timeLeft <= 20) colorClass = "bg-destructive animate-pulse";
  else if (timeLeft <= 45) colorClass = "bg-accent";

  return (
    <div className="w-full mb-6 font-mono">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-muted-foreground uppercase font-bold tracking-wider">
          {submitted
            ? "DECISION RECORDED"
            : timerActive
            ? "DECISION WINDOW REMAINING"
            : "WINDOW EXPIRED"}
        </span>
        <span
          className={`font-bold text-sm ${
            timeLeft <= 20 ? "text-destructive" : "text-primary"
          }`}
        >
          {timeLeft}S
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border">
        <div
          className={`h-full transition-all duration-1000 ${colorClass}`}
          style={{ width: `${submitted ? 100 : percentage}%` }}
        />
      </div>
    </div>
  );
}
