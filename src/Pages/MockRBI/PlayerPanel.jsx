import React from "react";
import SituationCard from "../../components/MockRbi/SituationCard";
import PlayerHeader from "../../components/MockRbi/PlayerHeader";
import PlayerTimerBar from "../../components/MockRbi/PlayerTimerBar";
import MiniLeaderboard from "../../components/MockRbi/MiniLeaderboard";
import { useMockRbiPlayer } from "../../hooks/useMockRbiPlayer";

/**
 * Clean Orchestrator PlayerPanel Component for Mock RBI Simulation.
 * Integrates useMockRbiPlayer hook, decision timer bar, situation options,
 * and live top 5 leaderboard standings.
 */
export default function PlayerPanel() {
  const {
    team,
    activeSituation,
    shuffledOptions,
    selectedOption,
    setSelectedOption,
    submitted,
    loading,
    error,
    timeLeft,
    timerActive,
    allTeams,
    canFetchNew,
    handleSubmitChoice,
    handleFetchNewSituation,
  } = useMockRbiPlayer();

  if (loading && !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="font-mono text-primary animate-pulse text-sm">
          INITIALIZING MOCK RBI TERMINAL PROTOCOLS...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-sans select-none">
      <div className="max-w-6xl mx-auto">
        {/* Header HUD */}
        <PlayerHeader team={team} />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive font-mono text-xs">
            {error}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Situation & Decision Container */}
          <div className="lg:col-span-2 space-y-6">
            {activeSituation ? (
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-2xl">
                {/* Decision Window Timer Bar */}
                <PlayerTimerBar
                  timeLeft={timeLeft}
                  timerActive={timerActive}
                  submitted={submitted}
                />

                {/* Situation Details */}
                <SituationCard situation={activeSituation} />

                {/* Options Selection Grid */}
                <div className="space-y-3 mt-6">
                  <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    SELECT POLICY RESPONSE:
                  </h4>

                  {shuffledOptions.map((opt, idx) => {
                    const isSelected =
                      selectedOption &&
                      selectedOption.originalIndex === opt.originalIndex;
                    return (
                      <button
                        key={idx}
                        disabled={submitted || !timerActive}
                        onClick={() => setSelectedOption(opt)}
                        className={`w-full text-left p-4 rounded-xl border font-mono text-xs transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-primary/20 border-primary text-primary font-bold shadow-lg"
                            : "bg-background border-border hover:border-primary/50 text-foreground"
                        } ${
                          submitted || !timerActive
                            ? "opacity-60 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md bg-muted border border-border flex items-center justify-center text-[10px] font-bold shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Submit Action */}
                {!submitted && timerActive && (
                  <button
                    disabled={!selectedOption || loading}
                    onClick={() => handleSubmitChoice(selectedOption)}
                    className="w-full mt-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "SUBMITTING DECISION..." : "CONFIRM POLICY RESPONSE"}
                  </button>
                )}

                {/* Fetch New Situation Action */}
                {canFetchNew && (
                  <button
                    onClick={handleFetchNewSituation}
                    className="w-full mt-6 py-3.5 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-primary transition-colors animate-bounce"
                  >
                    NEW POLICY SITUATION AVAILABLE // LOAD ROUND
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center font-mono space-y-4">
                <div className="text-primary font-bold text-lg">
                  WAITING FOR GOVERNOR SITUATION DISPATCH...
                </div>
                <p className="text-muted-foreground text-xs max-w-md mx-auto">
                  No active policy situation currently published. Standing by for next operational round.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Rankings */}
          <div className="space-y-6">
            <MiniLeaderboard teams={allTeams} currentTeam={team} />
          </div>
        </div>
      </div>
    </div>
  );
}
