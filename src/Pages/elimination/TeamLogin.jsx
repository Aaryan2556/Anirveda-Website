import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account, databases, IPL_DATABASE_ID, COLLECTIONS, ID } from '../../config/appwrite';
import { Query } from 'appwrite';
import { ShieldCheck, Users, Trophy, AlertCircle, Loader2, Sparkles, Key } from 'lucide-react';

export default function TeamLogin({ onLoginSuccess }) {
    const [teamId, setTeamId] = useState('');
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleEnterArena = async (e) => {
        e.preventDefault();
        setError(null);

        const cleanTeamId = String(teamId).trim().toUpperCase();
        const cleanTeamName = String(teamName).trim();

        if (!cleanTeamId || !cleanTeamName) {
            setError('Please enter both Team ID and Team Name.');
            return;
        }

        setLoading(true);

        try {
            // 0. Ensure Appwrite active session exists for authorization
            try {
                await account.get();
            } catch (authErr) {
                try {
                    await account.createAnonymousSession();
                } catch (anonErr) {
                    console.warn('[Appwrite Session Warning]:', anonErr);
                }
            }

            const collectionTarget = COLLECTIONS.TEAMS || 'teams';

            // 1. Lookup Team in Appwrite
            let res = await databases.listDocuments(
                IPL_DATABASE_ID,
                collectionTarget,
                [Query.equal('teamId', cleanTeamId)]
            );

            if (!res.documents || res.documents.length === 0) {
                try {
                    res = await databases.listDocuments(
                        IPL_DATABASE_ID,
                        collectionTarget,
                        [Query.equal('teamId', cleanTeamId.toLowerCase())]
                    );
                } catch (e) {
                    // ignore fallback query exception
                }
            }

            if (!res.documents || res.documents.length === 0) {
                setError('Team ID not found. Please check your credentials.');
                setLoading(false);
                return;
            }

            const teamDoc = res.documents[0];

            // Check if current device is the one that previously logged in as this team
            let isSameDevice = false;
            try {
                const saved = localStorage.getItem('ipl_current_team') || localStorage.getItem('ipl_active_team');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.docId === teamDoc.$id || String(parsed.teamId || '').toUpperCase() === cleanTeamId) {
                        isSameDevice = true;
                    }
                }
            } catch (e) {
                // ignore parse error
            }

            // 2. Check isEntered Lock (Allow re-entry on the same device)
            if (teamDoc.isEntered === true && !isSameDevice) {
                setError('Access Denied: This team has already entered the arena from another device!');
                setLoading(false);
                return;
            }

            // 3. Claim Entry Lock in DB (must succeed to set isEntered: true)
            const updatedDoc = await databases.updateDocument(
                IPL_DATABASE_ID,
                collectionTarget,
                teamDoc.$id,
                { isEntered: true }
            );

            if (updatedDoc && updatedDoc.isEntered === true) {
                console.log('[Lock Engaged] isEntered set to true in DB for team:', teamDoc.teamId);
            } else {
                console.warn('[Lock FAILED] Database returned document, but isEntered is NOT true:', updatedDoc);
            }

            // 4. Proceed to Quiz and save session
            const sessionData = {
                teamId: teamDoc.teamId,
                teamName: teamDoc.teamName || cleanTeamName,
                shortName: teamDoc.shortName || '',
                docId: teamDoc.$id,
            };

            localStorage.setItem('ipl_current_team', JSON.stringify(sessionData));
            localStorage.setItem('ipl_active_team', JSON.stringify(sessionData));

            if (onLoginSuccess) {
                onLoginSuccess(sessionData);
            } else {
                navigate('/ipl-auction/elimination/play');
            }
        } catch (err) {
            console.error('[Arena Entry Failed]:', err);
            setError(err.message || 'Failed to update entry lock in database. Check Appwrite permissions.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white flex items-center justify-center p-4 sm:p-6 selection:bg-amber-400 selection:text-slate-950 relative overflow-hidden font-sans">
            {/* Broadcast Ambient Spotlights */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-10 right-10 w-80 h-80 bg-amber-400/10 rounded-full blur-[90px] pointer-events-none" />

            {/* Main Registration Tunnel Container */}
            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 shadow-2xl shadow-black/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden z-10 transition-all">
                {/* Top Rim Metallic Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                {/* Header / Hero Section */}
                <div className="text-center relative z-10 mb-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full mb-4 text-amber-400 font-semibold tracking-widest text-xs uppercase shadow-sm">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Official Qualifier Arena</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 mb-1">
                        IPL MEGA AUCTION
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold tracking-widest text-slate-400 uppercase font-mono">
                        Elimination Round Portal
                    </p>
                </div>

                {/* Alert Card */}
                {error && (
                    <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-sm font-medium flex items-center gap-2.5 backdrop-blur-md">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form Container */}
                <form onSubmit={handleEnterArena} className="space-y-5 relative z-10">
                    {/* Team ID Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center gap-1.5 font-mono">
                            <Key className="w-3.5 h-3.5 text-amber-400" /> Assigned Team ID
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Enter Team ID (e.g. CSK, MI, RCB)"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm rounded-xl transition-all duration-200"
                        />
                    </div>

                    {/* Team Name Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center gap-1.5 font-mono">
                            <Users className="w-3.5 h-3.5 text-amber-400" /> Franchise Team Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Enter your Franchise Name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-sm rounded-xl transition-all duration-200"
                        />
                    </div>

                    {/* Submit Action Button */}
                    <button
                        type="submit"
                        disabled={!teamId.trim() || !teamName.trim() || loading}
                        className="w-full mt-3 py-4 px-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black tracking-wider uppercase rounded-xl shadow-lg shadow-amber-500/25 transition-all transform active:scale-98 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                                <span>Verifying Credentials...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5 text-slate-950" />
                                <span>Enter Auction Arena</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer info */}
                <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400/70" />
                        Secure Arena Terminal • Single Device Lock Enforced
                    </p>
                </div>
            </div>
        </div>
    );
}