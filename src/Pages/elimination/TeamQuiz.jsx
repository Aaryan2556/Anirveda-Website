import React, { useState, useEffect } from 'react';
import { QUESTIONS } from '../../data/iplAuction/elimination/questions';
import { databases, IPL_DATABASE_ID, COLLECTIONS } from '../../config/appwrite';
import { ID } from 'appwrite';
import { CheckCircle2, ChevronRight, Check, AlertCircle, Zap, Award, Sparkles, LogOut, Loader2, Clock } from 'lucide-react';

// Fallback Answer Map if answer is not inline in questions array
const ANSWER_MAP = {
    1: "Dwayne Bravo & Harshal Patel",
    2: "Anil Kumble",
    3: "David Warner",
    4: "Krunal Pandya",
    5: "KL Rahul — 152*",
    6: "AB de Villiers",
    7: "Manish Pandey",
    8: "Lakshmipathy Balaji",
    9: "Yuvraj Singh",
    10: "6 wickets for 12 runs",
    11: "Nat Sciver-Brunt",
    12: "Issy Wong",
    13: "Smriti Mandhana",
    14: "Nat Sciver-Brunt — 523 runs",
    15: "Mumbai Indians",
    16: "Sunil Narine",
    17: "KL Rahul",
    18: "Harshal Patel",
    19: "Punjab Kings",
    20: "Mitchell Starc",
    21: "Vaibhav Sooryavanshi",
    22: "Vaibhav Sooryavanshi",
    23: "Shubman Gill",
    24: "Ravindra Jadeja",
    25: "Punjab Kings",
    26: "Amelia Kerr",
    27: "Sophie Molineux",
    28: "Gujarat Giants",
    29: "Sophie Devine",
    30: "Smriti Mandhana",
};

// Fisher-Yates unbiased shuffler
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default function TeamQuiz({ team, onExit }) {
    const teamIdKey = team?.teamId || team?.$id || team?.id || 'team';
    const progressStorageKey = `ipl_quiz_progress_${teamIdKey}`;
    const deckStorageKey = `ipl_quiz_deck_${teamIdKey}`;
    const completedStorageKey = `ipl_completed_${teamIdKey}`;
    const startTimeStorageKey = `ipl_start_time_${teamIdKey}`;

    // Persistent Quiz Start Timestamp
    const [quizStartTime] = useState(() => {
        const saved = localStorage.getItem(startTimeStorageKey);
        if (saved) {
            const parsed = parseInt(saved, 10);
            if (!isNaN(parsed) && parsed > 0) return parsed;
        }
        const now = Date.now();
        localStorage.setItem(startTimeStorageKey, String(now));
        return now;
    });

    // Check if team has already completed the round
    const [isCompleted, setIsCompleted] = useState(() => {
        return localStorage.getItem(completedStorageKey) === 'true';
    });

    // 1. Initialize shuffled questions with localStorage cache (limited to 15 questions)
    const [shuffledQuestions, setShuffledQuestions] = useState(() => {
        const cachedDeck = localStorage.getItem(deckStorageKey);
        if (cachedDeck) {
            try {
                const parsed = JSON.parse(cachedDeck);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 15);
            } catch (err) {
                console.error('Failed to parse cached deck:', err);
            }
        }

        if (QUESTIONS && QUESTIONS.length > 0) {
            const normalized = QUESTIONS.map((q, index) => {
                const qId = Number(q.questionId ?? q.id ?? index + 1);
                return {
                    questionId: qId,
                    text: q.text,
                    options: q.options,
                    answer: q.answer || ANSWER_MAP[qId] || '',
                };
            });
            const randomized = shuffleArray(normalized).slice(0, 15);
            localStorage.setItem(deckStorageKey, JSON.stringify(randomized));
            return randomized;
        }
        return [];
    });

    // 2. Initialize current question index from localStorage
    const [currentIndex, setCurrentIndex] = useState(() => {
        const savedIndex = localStorage.getItem(progressStorageKey);
        return savedIndex !== null ? Number(savedIndex) : 0;
    });

    const [currentOptions, setCurrentOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [warningMsg, setWarningMsg] = useState(null);
    const [timerSeconds, setTimerSeconds] = useState(() => {
        return Math.max(0, Math.floor((Date.now() - quizStartTime) / 1000));
    });

    // Live Timer Interval Hook (clears when isCompleted is true)
    useEffect(() => {
        if (isCompleted) return;
        setTimerSeconds(Math.max(0, Math.floor((Date.now() - quizStartTime) / 1000)));

        const interval = setInterval(() => {
            setTimerSeconds(Math.max(0, Math.floor((Date.now() - quizStartTime) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [isCompleted, quizStartTime]);

    // Completion Guard on Mount
    useEffect(() => {
        if (localStorage.getItem(completedStorageKey) === 'true') {
            setIsCompleted(true);
        }
    }, [completedStorageKey]);

    // Anti-cheat & Proctoring Event Listeners
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        const handleCopyCut = (e) => {
            e.preventDefault();
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', '');
            }
        };

        const handleKeyDown = (e) => {
            const key = e.key;
            const lowerKey = key ? key.toLowerCase() : '';
            const ctrlOrCmd = e.ctrlKey || e.metaKey;

            if (
                key === 'F12' ||
                key === 'PrintScreen' ||
                (ctrlOrCmd && ['c', 'u', 's', 'a', 'p'].includes(lowerKey)) ||
                (ctrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(lowerKey))
            ) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const triggerFocusWarning = () => {
            const alertText = "WARNING: Arena focus lost! Navigating away, opening browser sidebars, or multitasking is strictly prohibited.";
            setWarningMsg(alertText);
            try {
                alert(alertText);
            } catch (e) {
                // ignore alert block
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerFocusWarning();
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('copy', handleCopyCut);
        window.addEventListener('cut', handleCopyCut);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', triggerFocusWarning);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('copy', handleCopyCut);
            window.removeEventListener('cut', handleCopyCut);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', triggerFocusWarning);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // 3. Persist currentIndex changes into localStorage
    useEffect(() => {
        if (teamIdKey) {
            localStorage.setItem(progressStorageKey, String(currentIndex));
        }
    }, [currentIndex, progressStorageKey, teamIdKey]);

    // 4. Update options whenever current question index or questions deck change
    useEffect(() => {
        if (shuffledQuestions.length > 0 && currentIndex < shuffledQuestions.length) {
            setCurrentOptions(shuffleArray(shuffledQuestions[currentIndex].options));
            setSelectedOption(null);
            setSubmitError(null);
        } else if (shuffledQuestions.length > 0 && currentIndex >= shuffledQuestions.length) {
            setIsCompleted(true);
        }
    }, [currentIndex, shuffledQuestions]);

    // Helper function to upsert team's standing in leaderboard collection
    const upsertLeaderboard = async (activeTeamId, activeTeamName, isCorrect, currentTimerSeconds) => {
        const collectionId = COLLECTIONS.LEADERBOARD || 'leaderboard';
        const docId = String(activeTeamId).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);

        try {
            const existing = await databases.getDocument(IPL_DATABASE_ID, collectionId, docId);
            await databases.updateDocument(IPL_DATABASE_ID, collectionId, docId, {
                score: Number(existing.score || 0) + (isCorrect ? 10 : 0),
                questionsAnswered: Number(existing.questionsAnswered || 0) + 1,
                totalTimeSeconds: currentTimerSeconds,
                updatedAt: new Date().toISOString(),
            });
        } catch (err) {
            if (err.code === 404) {
                await databases.createDocument(IPL_DATABASE_ID, collectionId, docId, {
                    teamId: String(activeTeamId),
                    teamName: String(activeTeamName),
                    score: isCorrect ? 10 : 0,
                    questionsAnswered: 1,
                    totalTimeSeconds: currentTimerSeconds,
                    updatedAt: new Date().toISOString(),
                });
            } else {
                console.error('Failed to update leaderboard:', err);
            }
        }
    };

    // 5. Submit answer to Appwrite submissions and leaderboard collections
    const handleSubmitAnswer = async () => {
        if (!selectedOption || isSubmitting) return;

        setIsSubmitting(true);
        setSubmitError(null);

        const activeQuestion = shuffledQuestions[currentIndex] || {};
        const parsedQuestionId = Number(activeQuestion.questionId ?? activeQuestion.id ?? (currentIndex + 1));
        const activeTeamId = String(team?.teamId || team?.$id || team?.id || 'unknown');
        const activeTeamName = String(team?.teamName || team?.name || activeTeamId);

        const correctAnswer = activeQuestion.answer || '';
        const isCorrect = Boolean(correctAnswer) &&
            correctAnswer.trim().toLowerCase() === String(selectedOption).trim().toLowerCase();

        try {
            // A. Write raw submission record
            await databases.createDocument(
                IPL_DATABASE_ID,
                COLLECTIONS.SUBMISSIONS || 'submissions',
                ID.unique(),
                {
                    teamId: activeTeamId,
                    teamName: activeTeamName,
                    questionId: isNaN(parsedQuestionId) ? currentIndex + 1 : parsedQuestionId,
                    selectedOption: String(selectedOption),
                    submittedAt: new Date().toISOString(),
                }
            );

            // B. Directly upsert/increment team record in leaderboard collection
            await upsertLeaderboard(activeTeamId, activeTeamName, isCorrect, timerSeconds);

            // Advance to next random question or lock in round
            if (currentIndex + 1 < shuffledQuestions.length) {
                setCurrentIndex((prev) => prev + 1);
                setSelectedOption(null);
            } else {
                localStorage.setItem(completedStorageKey, 'true');
                setIsCompleted(true);
                localStorage.removeItem(progressStorageKey);
                localStorage.removeItem(deckStorageKey);
                localStorage.removeItem(startTimeStorageKey);
            }
        } catch (err) {
            console.error('Appwrite Submission Error:', err);
            setSubmitError('Failed to record submission on referee server. Please tap retry.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExitQuiz = () => {
        localStorage.removeItem(progressStorageKey);
        localStorage.removeItem(deckStorageKey);
        localStorage.removeItem(completedStorageKey);
        localStorage.removeItem(startTimeStorageKey);
        if (onExit) onExit();
    };

    if (!shuffledQuestions.length) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-mono gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs uppercase tracking-widest text-slate-300">Preparing Random Auction Deck...</span>
            </div>
        );
    }

    // Broadcast Round Completion View
    if (isCompleted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 selection:bg-amber-400 selection:text-slate-950">
                <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-black/80 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-400 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black uppercase text-amber-400 tracking-tight mb-2">Round Locked In!</h2>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        All {shuffledQuestions.length || 15} responses recorded for <strong className="text-white font-bold">{team?.teamName || team?.name || 'Franchise'}</strong>. Stand by for final standings on the referee board.
                    </p>
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6 font-mono text-xs text-amber-400/90 flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>STANDINGS LIVE ON MAIN DISPLAY</span>
                    </div>
                    <button
                        onClick={handleExitQuiz}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs tracking-widest uppercase rounded-xl transition border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Switch Team / Log Out
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = shuffledQuestions[currentIndex] || {};
    const progressPercent = ((currentIndex + 1) / (shuffledQuestions.length || 15)) * 100;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    const displayTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const isFinalQuestion = currentIndex + 1 === shuffledQuestions.length;

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white p-4 md:p-6 flex flex-col justify-between max-w-3xl mx-auto font-sans select-none relative"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
            {/* Anti-Cheat Focus Warning Banner */}
            {warningMsg && (
                <div className="mb-4 p-3.5 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex items-center justify-between text-rose-300 text-xs font-semibold backdrop-blur-md shadow-lg animate-pulse">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{warningMsg}</span>
                    </div>
                    <button
                        onClick={() => setWarningMsg(null)}
                        className="px-2 py-0.5 bg-rose-500/30 hover:bg-rose-500/50 text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Broadcast Scoreboard Header */}
            <header className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 md:p-5 mb-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold block">Franchise Arena</span>
                            <span className="text-base md:text-lg font-black text-amber-400 tracking-wide uppercase">
                                {team?.teamName || team?.name || 'Franchise'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right font-mono">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3 text-amber-400" /> Time Elapsed
                            </span>
                            <span className="text-sm md:text-base font-extrabold text-amber-400 font-mono">
                                {displayTime}
                            </span>
                        </div>
                        <div className="text-right font-mono">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Powerplay Pace</span>
                            <span className="text-sm md:text-base font-bold text-amber-400">
                                QUESTION {currentIndex + 1} / {shuffledQuestions.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Animated Progress Bar */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-300 rounded-full shadow-sm"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </header>

            {/* Main Broadcast Question Arena Board */}
            <main className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 my-auto relative overflow-hidden">
                <div className="flex justify-between items-center mb-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase rounded-lg">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Question #{currentIndex + 1}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                        DECK ID: #{currentQ.questionId}
                    </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold leading-relaxed mb-8 text-slate-100">
                    {currentQ.text}
                </h3>

                {/* Shuffled Options */}
                <div className="space-y-3.5">
                    {currentOptions.map((opt, idx) => {
                        const isSelected = selectedOption === opt;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedOption(opt)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${isSelected
                                    ? 'border-amber-400 bg-amber-500/15 text-white font-bold shadow-lg shadow-amber-500/10 scale-[1.01]'
                                    : 'border-slate-800 bg-slate-950/60 hover:border-amber-400/50 hover:bg-slate-800/60 text-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono border transition-all ${isSelected
                                            ? 'border-amber-400 bg-amber-400 text-slate-950 font-black'
                                            : 'border-slate-700 bg-slate-900 text-slate-400'
                                            }`}
                                    >
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-sm sm:text-base font-medium">{opt}</span>
                                </div>
                                {isSelected && <Check className="w-5 h-5 text-amber-400 shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                {submitError && (
                    <div className="mt-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{submitError}</span>
                    </div>
                )}
            </main>

            {/* Confirmation & Submit Footer */}
            <footer className="mt-6">
                <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black tracking-wider uppercase rounded-2xl transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                            <span>Transmitting to Referee...</span>
                        </>
                    ) : (
                        <>
                            <span>{isFinalQuestion ? "SUBMIT INNINGS / COMPLETE QUIZ" : "Confirm & Lock Answer"}</span>
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </footer>
        </div>
    );
}