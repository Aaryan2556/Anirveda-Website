/**
 * Projector view for the room: the player on the block at room scale — photo,
 * name, tags and base price — plus the SOLD announcement when the admin
 * records a sale. Read-only: it subscribes to the auction state and sends no
 * commands, so the screen always follows the admin console.
 *
 * Every size is written in vw/vh inside clamp() so the same markup fills a
 * 1080p and a 4K projector without scrolling.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AUCTION_STATUS } from "../../../lib/iplAuction/engine";
import { useAuction } from "../../../lib/iplAuction/hooks/useAuction";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { ROLE_LABELS } from "../../../lib/iplAuction/config";
import { hasFictionalPlayers, isFictional } from "../../../lib/iplAuction/playerFields";
import {
  ConnectionIndicator,
  PlayerPhoto,
  StatusBadge,
  useSoldAnnouncement,
} from "../ui/auction";

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-900";

/** Oversized pills: the room has to read the role and nationality too. */
const PILL =
  "inline-flex items-center rounded-full border px-4 py-1.5 font-mono font-bold uppercase tracking-wider " +
  "text-[clamp(0.8rem,1.35vw,1.75rem)]";

function PlayerPills({ player }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <span className={`${PILL} border-gold/40 bg-gold/10 text-gold`}>{ROLE_LABELS[player.role]}</span>
      {player.nationality && <span className={`${PILL} border-slate-700 bg-obsidian-800 text-slate-200`}>{player.nationality}</span>}
      {player.isOverseas && <span className={`${PILL} border-slate-700 bg-obsidian-800 text-slate-200`}>Overseas</span>}
      {isFictional(player) && (
        <span className={`${PILL} border-amber-500/50 bg-amber-500/10 text-amber-300`}>Fictional</span>
      )}
    </div>
  );
}

const idleMessage = (state) =>
  state.status === AUCTION_STATUS.COMPLETED
    ? "The auction is complete"
    : state.status === AUCTION_STATUS.SETUP
      ? "The auction has not started yet"
      : "Waiting for the next player";

/** Base price is always on screen: the admin records bids, this view never shows them. */
function BasePrice({ player }) {
  return (
    <div className="text-center">
      <p className="font-mono text-[clamp(0.85rem,1.3vw,1.6rem)] font-bold uppercase tracking-[0.35em] text-slate-400">
        Base price
      </p>
      <p className="mt-1 font-mono font-bold leading-none text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.35)] text-[clamp(2.5rem,5vw,7rem)]">
        {formatLakhs(player.basePrice)}
      </p>
    </div>
  );
}

/** The hero: photo, name, tags, base price — stacked and centred. */
function CurrentPlayer({ player }) {
  return (
    <div className="flex w-full flex-col items-center px-4 text-center">
      <div className="w-[min(38vh,72vw)]">
        <PlayerPhoto player={player} size="xl" bare />
      </div>
      <h2 className="mt-4 max-w-full truncate font-Bebas font-bold uppercase leading-none tracking-tight text-slate-100 drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] text-[clamp(2.25rem,5.5vw,7.5rem)]">
        {player.name}
      </h2>
      <div className="mt-3 sm:mt-4">
        <PlayerPills player={player} />
      </div>
      <div className="mt-4 sm:mt-6">
        <BasePrice player={player} />
      </div>
    </div>
  );
}

/** Full-screen SOLD flash: the announcement and the price it fetched. */
function SoldOverlay({ sale }) {
  return (
    <AnimatePresence>
      {sale && (
        <motion.div
          key={sale.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="status"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 px-6 text-center"
        >
          <p className="font-Bebas font-bold uppercase leading-none tracking-[-0.04em] text-primary drop-shadow-[0_0_60px_rgba(212,175,55,0.5)] text-[clamp(5rem,20vw,24rem)]">
            Sold
          </p>
          <p className="mt-1 font-Bebas font-bold uppercase leading-none text-slate-100 text-[clamp(1.5rem,3.5vw,5rem)]">
            {sale.player.name}
          </p>
          <p className="mt-4 font-mono font-bold leading-none text-gold text-[clamp(2.5rem,8vw,11rem)]">
            {formatLakhs(sale.price)}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Projector browsers want the page full screen; `F` or the corner button. */
function FullscreenToggle() {
  const [active, setActive] = useState(Boolean(document.fullscreenElement));
  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };
  useEffect(() => {
    const onKey = (event) => {
      if (event.key?.toLowerCase() === "f" && !event.metaKey && !event.ctrlKey && !event.altKey) toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <button
      type="button"
      onClick={toggle}
      className={`absolute bottom-3 right-3 z-20 rounded-lg border border-slate-700/80 bg-obsidian-800/70 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 transition hover:border-gold/50 hover:text-gold ${FOCUS_RING}`}
    >
      {active ? "Exit full screen" : "Full screen"}
    </button>
  );
}

export default function BigScreen() {
  const { state } = useAuction();
  const sold = useSoldAnnouncement(state);
  const player = state.lot ? state.players[state.lot.playerId] ?? null : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-obsidian-900 font-sans text-slate-100">
        {/* Night-stadium backdrop: slow pan, dark-blue grade, flickering floodlights. */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <img
            src="/images/stadium/night-stadium.png"
            alt=""
            className="h-full w-full animate-slowPan object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040B1E]/75 via-[#071229]/70 to-[#07090E]/95" />
          <div className="absolute -top-[12vmin] left-[6vw] h-[40vmin] w-[40vmin] rounded-full bg-[#CFE4FF]/25 blur-[90px] animate-lightFlicker" />
          <div className="absolute -top-[12vmin] right-[6vw] h-[40vmin] w-[40vmin] rounded-full bg-[#BFD8FF]/20 blur-[90px] animate-lightFlickerAlt" />
        </div>

        <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-800/80 px-4 py-2.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-obsidian-900 p-1.5 sm:h-12 sm:w-12 sm:p-2 ${FOCUS_RING}`}
              aria-label="Anirveda home"
            >
              <img src="/images/logos/logo_white.webp" alt="Anirveda" className="h-full w-full object-contain" />
            </Link>
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] uppercase tracking-wider text-slate-400 sm:text-sm">
                Anirveda · {state.name}
              </p>
              <h1 className="font-Bebas text-xl font-bold uppercase leading-none tracking-tight text-primary sm:text-3xl">
                IPL Auction
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasFictionalPlayers(state) && (
              <span className="hidden rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300 sm:inline-flex">
                Fictional players
              </span>
            )}
            <StatusBadge status={state.status} />
            <ConnectionIndicator />
          </div>
        </header>

        <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {player ? (
            <CurrentPlayer player={player} />
          ) : (
            <p className="px-6 text-center font-Bebas font-bold uppercase leading-none tracking-tight text-slate-200 text-[clamp(2rem,5vw,6rem)]">
              {idleMessage(state)}
            </p>
          )}
        </main>

        <FullscreenToggle />
      </div>

      <div role="status" aria-live="assertive" className="sr-only">
        {sold ? `Sold: ${sold.player.name} to ${sold.team.name} for ${formatLakhs(sold.price)}` : ""}
      </div>
      <SoldOverlay sale={sold} />
    </MotionConfig>
  );
}
