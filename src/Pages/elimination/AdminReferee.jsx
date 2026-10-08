import React, { useEffect, useState } from 'react';
import client, { databases, IPL_DATABASE_ID, COLLECTIONS } from '../../config/appwrite';
import { Query } from 'appwrite';
import {
  ShieldAlert,
  Activity,
  Trophy,
  Loader2,
  CheckCheck,
  Clock,
  Users,
  Award,
  Crown,
  RefreshCw,
  Search,
  Sparkles
} from 'lucide-react';

const TOTAL_QUESTIONS_COUNT = 15;

// Format duration helper function
const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '--:--';
  const totalSec = Math.max(0, parseInt(seconds, 10));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Sort leaderboard documents: highest score first, then fastest completion time ASC, then most questions answered
const sortLeaderboard = (docs) => {
  return [...docs].sort((a, b) => {
    const scoreA = Number(a.score || 0);
    const scoreB = Number(b.score || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const timeA = Number(a.totalTimeSeconds || 0);
    const timeB = Number(b.totalTimeSeconds || 0);

    if (timeA > 0 && timeB > 0 && timeA !== timeB) {
      return timeA - timeB;
    } else if (timeA > 0 && timeB <= 0) {
      return -1;
    } else if (timeB > 0 && timeA <= 0) {
      return 1;
    }

    const countA = Number(a.questionsAnswered || 0);
    const countB = Number(b.questionsAnswered || 0);
    return countB - countA;
  });
};

export default function AdminReferee() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Initial Mount: Fetch standings directly from leaderboard collection
  const fetchLeaderboard = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setLoadingInitial(true);

      const collectionId = COLLECTIONS.LEADERBOARD || 'leaderboard';
      const res = await databases.listDocuments(
        IPL_DATABASE_ID,
        collectionId,
        [Query.limit(100)]
      );

      const sorted = sortLeaderboard(res.documents);
      setLeaderboard(sorted);
    } catch (err) {
      console.error('Failed to load leaderboard documents:', err);
    } finally {
      setLoadingInitial(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // 2. Real-Time Subscription: Listen to create/update events on leaderboard collection
  useEffect(() => {
    const collectionId = COLLECTIONS.LEADERBOARD || 'leaderboard';
    const channel = `databases.${IPL_DATABASE_ID}.collections.${collectionId}.documents`;

    const unsubscribe = client.subscribe(channel, (event) => {
      const isCreateOrUpdate = event.events.some(
        (e) => e.includes('.create') || e.includes('.update')
      );
      if (!isCreateOrUpdate) return;

      const updatedDoc = event.payload;

      setLeaderboard((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.$id === updatedDoc.$id || item.teamId === updatedDoc.teamId
        );

        let updatedList;
        if (existingIndex >= 0) {
          updatedList = [...prev];
          updatedList[existingIndex] = updatedDoc;
        } else {
          updatedList = [...prev, updatedDoc];
        }

        return sortLeaderboard(updatedList);
      });
    });

    return () => unsubscribe();
  }, []);

  // Derived metrics for quick stats cards
  const totalTeamsActive = leaderboard.filter(
    (t) => Number(t.questionsAnswered || 0) > 0
  ).length;

  const topScore = leaderboard.length > 0 ? Math.max(...leaderboard.map((t) => Number(t.score || 0))) : 0;

  const completedTeamsCount = leaderboard.filter(
    (t) => Number(t.questionsAnswered || 0) >= TOTAL_QUESTIONS_COUNT
  ).length;

  const filteredLeaderboard = leaderboard.filter((t) => {
    const name = t.teamName || t.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-mono gap-3.5">
        <Loader2 className="w-9 h-9 animate-spin text-amber-400" />
        <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold">
          WAR ROOM | SYNCING LIVE LEADERBOARD...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white p-4 md:p-6 font-sans selection:bg-amber-400 selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Command Bar Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 p-6 rounded-3xl shadow-2xl shadow-black/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          
          <div>
            <div className="flex items-center gap-2.5">
              <div className="px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-400 font-mono text-xs uppercase font-bold tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>WAR ROOM | OFFICIAL REFEREE COMMAND</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 mt-2">
              IPL AUCTION QUALIFIER DASHBOARD
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Live broadcast feed evaluating real-time scores across registered franchises.
            </p>
          </div>

          {/* Multi-Card KPI Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl text-center min-w-[100px] shadow-inner">
              <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-sky-400" /> Active
              </span>
              <span className="text-xl font-black font-mono text-sky-400">
                {totalTeamsActive} / {leaderboard.length}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl text-center min-w-[100px] shadow-inner">
              <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-amber-400" /> Top Score
              </span>
              <span className="text-xl font-black font-mono text-amber-400">
                {topScore} PTS
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl text-center min-w-[100px] shadow-inner">
              <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold flex items-center justify-center gap-1">
                <CheckCheck className="w-3 h-3 text-emerald-400" /> Locked In
              </span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {completedTeamsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Referee Control Toolbar & Live Standings Board */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header Controls Bar */}
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-sm font-mono font-extrabold uppercase tracking-wider text-amber-400">
                LIVE QUALIFICATION STANDINGS
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 animate-ping" /> Realtime Stream
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter franchise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <button
                onClick={() => fetchLeaderboard(true)}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Subheader info bar */}
          <div className="bg-slate-950/90 px-6 py-2 border-b border-slate-800/80 flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span>TOP 8 FRANCHISES QUALIFY FOR STAGE AUCTION</span>
            <span>TOTAL DECK: {TOTAL_QUESTIONS_COUNT} QUESTIONS</span>
          </div>

          {/* Standings List */}
          <div className="p-4 sm:p-6 bg-slate-950/60 min-h-[500px] overflow-y-auto space-y-3">
            {filteredLeaderboard.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs uppercase tracking-widest">
                <Sparkles className="w-6 h-6 text-slate-600" />
                <span>Awaiting franchise submissions...</span>
              </div>
            ) : (
              filteredLeaderboard.map((team, idx) => {
                const answeredCount = Number(team.questionsAnswered || 0);
                const score = Number(team.score || 0);
                const isCompleted = answeredCount >= TOTAL_QUESTIONS_COUNT;
                const isTop8 = idx < 8;

                // Podium styles
                let rankStyle = 'bg-slate-800/80 text-slate-400 border-slate-700';
                let cardStyle = 'bg-slate-900/90 border-slate-800/90';

                if (idx === 0) {
                  rankStyle = 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30';
                  cardStyle = 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-400/40 shadow-lg shadow-amber-500/5';
                } else if (idx === 1) {
                  rankStyle = 'bg-slate-200 text-slate-950 font-black';
                  cardStyle = 'bg-gradient-to-r from-slate-400/10 via-slate-900 to-slate-900 border-slate-400/30';
                } else if (idx === 2) {
                  rankStyle = 'bg-amber-700 text-amber-100 font-black';
                  cardStyle = 'bg-gradient-to-r from-amber-800/10 via-slate-900 to-slate-900 border-amber-600/30';
                } else if (isTop8) {
                  cardStyle = 'bg-slate-900/90 border-amber-500/20';
                }

                return (
                  <div
                    key={team.$id || team.teamId || idx}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Rank Badge */}
                      <span className={`font-mono text-xs w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${rankStyle}`}>
                        {idx === 0 ? <Crown className="w-4 h-4 text-slate-950" /> : `#${idx + 1}`}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base sm:text-lg text-slate-100 block">
                            {team.teamName}
                          </span>
                          {isTop8 && (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                              QUALIFIED
                            </span>
                          )}
                        </div>

                        {/* Status Pills */}
                        <div className="mt-1.5 flex items-center gap-2">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                              <CheckCheck className="w-3 h-3" /> Round Locked In
                            </span>
                          ) : answeredCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40">
                              <Clock className="w-3 h-3 animate-spin" /> In Progress ({answeredCount}/{TOTAL_QUESTIONS_COUNT})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                              Not Started
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 block tracking-tight">
                        {score} <span className="text-xs text-amber-400/80 font-semibold">PTS</span>
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-1 sm:gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>{answeredCount} / {TOTAL_QUESTIONS_COUNT} Answered</span>
                        <span className="hidden sm:inline text-slate-600">•</span>
                        <span className="inline-flex items-center justify-end gap-1 text-amber-300/90 font-bold">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" /> {formatDuration(team.totalTimeSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
