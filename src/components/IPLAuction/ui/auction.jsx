/**
 * Auction building blocks shared by the admin console, team dashboard, big
 * screen and summary. Presentation only: every number comes from the engine's
 * selectors and rules (src/lib/iplAuction/engine).
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ROLE_LABELS, ROLE_LIST } from "../../../lib/iplAuction/config";
import {
  AUCTION_STATUS,
  getMaxBid,
  getRecentSales,
  getRoleNeeds,
  getTeamPurchaseHistory,
  getTeamStats,
  getTeamsInOrder,
} from "../../../lib/iplAuction/engine";
import { useConnectionStatus } from "../../../lib/iplAuction/hooks/useConnectionStatus";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { STAT_FIELD_LABELS, STAT_GROUPS, hasFictionalPlayers, isFictional } from "../../../lib/iplAuction/playerFields";
import { Empty, Tag, table } from "./controls";

/* ----- Status ----------------------------------------------------------- */

const STATUS_STYLES = {
  [AUCTION_STATUS.SETUP]: { tone: "default", text: "Setting up" },
  [AUCTION_STATUS.LIVE]: { tone: "primary", text: "Live" },
  [AUCTION_STATUS.PAUSED]: { tone: "warning", text: "Paused" },
  [AUCTION_STATUS.COMPLETED]: { tone: "success", text: "Completed" },
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? { tone: "default", text: status };
  return (
    <Tag tone={style.tone}>
      {status === AUCTION_STATUS.LIVE && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse" />}
      {style.text}
    </Tag>
  );
}

const CONNECTION_LABELS = {
  live: { text: "Live sync", dot: "bg-green-400" },
  polling: { text: "Syncing", dot: "bg-slate-400" },
  connecting: { text: "Connecting…", dot: "bg-yellow-300" },
  reconnecting: { text: "Reconnecting…", dot: "bg-yellow-300" },
  offline: { text: "Offline · last known state", dot: "bg-red-400" },
};

/** Sync health of the data; hidden for the browser-only (local) adapter. */
export function ConnectionIndicator() {
  const { status } = useConnectionStatus();
  const label = CONNECTION_LABELS[status];
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400" role="status">
      <span className={`h-2 w-2 rounded-full ${label.dot}`} />
      {label.text}
    </span>
  );
}

/** Auction status and sync state, for page headers. */
export function AuctionStatus({ state }) {
  return (
    <>
      <StatusBadge status={state.status} />
      <ConnectionIndicator />
    </>
  );
}

/* ----- Notices ---------------------------------------------------------- */

/** Shown whenever fictional players are in the auction. */
export function FictionalNotice({ state }) {
  if (!hasFictionalPlayers(state)) return null;
  return (
    <p className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
      Players marked <strong>FICTIONAL</strong> are invented for testing: their names and statistics are not real.
    </p>
  );
}

/** Local (browser-only) development mode. Never shown in production builds. */
export function LocalModeNotice({ kind }) {
  if (kind !== "local") return null;
  return (
    <p className="mb-5 rounded-xl border border-slate-800 bg-obsidian-900 px-4 py-2 text-xs text-slate-400">
      <strong className="text-slate-100">Local development mode.</strong> The auction lives only in this browser and syncs
      between its tabs. No database, no login.
    </p>
  );
}

/* ----- Players ---------------------------------------------------------- */

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const PHOTO_SIZES = {
  sm: "h-10 w-10 text-lg",
  md: "aspect-[4/5] w-full text-6xl",
  lg: "aspect-[4/5] w-full text-8xl",
  // Big screen: the parent sets the width in vh, so the initials scale with it.
  xl: "aspect-[4/5] w-full text-[7vh]",
};

/** Player photo, or initials when there is none (fictional players have no photos). */
export function PlayerPhoto({ player, size = "md" }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-obsidian-700 to-obsidian-900 ${PHOTO_SIZES[size]}`}
    >
      {player.image ? (
        <img src={player.image} alt={player.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="font-Bebas font-bold leading-none text-gold/60" aria-hidden="true">
          {initials(player.name)}
        </span>
      )}
    </div>
  );
}

export function PlayerTags({ player }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <Tag tone="primary">{ROLE_LABELS[player.role]}</Tag>
      {player.nationality && <Tag tone="default">{player.nationality}</Tag>}
      {player.isOverseas && <Tag tone="default">Overseas</Tag>}
      {isFictional(player) && <Tag tone="warning">Fictional</Tag>}
    </div>
  );
}



export function PlayerIdentity({ player, large = false }) {
  return (
    <div className="space-y-3">
      <h3 className={`font-Bebas font-bold uppercase leading-none tracking-tight text-slate-100 ${large ? "text-5xl xl:text-6xl" : "text-3xl sm:text-4xl"}`}>
        {player.name}
      </h3>
      <PlayerTags player={player} />
    </div>
  );
}

/** Photo + identity: the "on the block" hero. */
export function PlayerHero({ player, large = false }) {
  return (
    <div className={`grid gap-5 ${large ? "md:grid-cols-[minmax(0,20rem)_1fr]" : "sm:grid-cols-[minmax(0,11rem)_1fr]"}`}>
      <div className={large ? "mx-auto w-full max-w-[20rem]" : "mx-auto w-full max-w-[11rem]"}>
        <PlayerPhoto player={player} size={large ? "lg" : "md"} />
      </div>
      <div className="min-w-0 space-y-4">
        <PlayerIdentity player={player} large={large} />
      </div>
    </div>
  );
}

/** The player on the block, or a waiting message. */
export function CurrentLot({ state, large = false, hideLiveBid = false }) {
  if (!state.lot) {
    const message =
      state.status === AUCTION_STATUS.COMPLETED
        ? "The auction is complete."
        : state.status === AUCTION_STATUS.SETUP
          ? "The auction has not started yet."
          : "Waiting for the next player.";
    return <p className={`font-sans text-slate-400 ${large ? "py-16 text-center text-3xl" : "py-6 text-lg"}`}>{message}</p>;
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        {!hideLiveBid ? (
          <>
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-gold">
              <span className="h-2 w-2 rounded-full bg-gold motion-safe:animate-pulse" />Live Bid
            </p>
            {state.lot.currentBid != null && (
              <p className={`font-mono font-bold text-gold ${large ? "text-5xl" : "text-3xl"}`}>
                {formatLakhs(state.lot.currentBid)}
                {state.lot.currentBidTeamId && state.teams[state.lot.currentBidTeamId] && (
                  <span className={`text-slate-400 ml-2 ${large ? "text-2xl" : "text-lg"}`}>({state.teams[state.lot.currentBidTeamId].shortName})</span>
                )}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">Base Price</p>
            <p className={`font-mono font-bold text-gold ${large ? "text-5xl" : "text-3xl"}`}>
              {formatLakhs(state.players[state.lot.playerId].basePrice)}
            </p>
          </>
        )}
      </div>
      <PlayerHero player={state.players[state.lot.playerId]} large={large} />
    </div>
  );
}

const SOLD_BANNER_MS = 6000;

export function useSoldAnnouncement(state) {
  const [latest] = getRecentSales(state, 1);
  const latestSeq = latest?.seq ?? 0;
  const latestRef = useRef(latest);
  latestRef.current = latest;
  const seenSeq = useRef(latestSeq);
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (latestSeq <= seenSeq.current) return undefined;
    seenSeq.current = latestSeq;
    setShown(latestRef.current);
    const timer = setTimeout(() => setShown(null), SOLD_BANNER_MS);
    return () => clearTimeout(timer);
  }, [latestSeq]);

  return shown && state.purchases.some((purchase) => purchase.id === shown.id) ? shown : null;
}

export function SoldBanner({ sale }) {
  return (
    <AnimatePresence>
      {sale && (
        <motion.div
          key={sale.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-6"
        >
          <div className="w-full max-w-4xl rounded-xl border-2 border-primary bg-obsidian-800 px-8 py-10 text-center">
            <p className="font-Bebas text-[6rem] font-bold uppercase leading-none tracking-[-0.04em] text-primary drop-shadow-[0_0_35px_rgba(212,175,55,0.45)] sm:text-[9rem]">Sold</p>
            <p className="mt-2 font-Bebas text-4xl font-bold uppercase tracking-tight text-slate-100 sm:text-5xl">{sale.player.name}</p>
            <p className="mt-4 font-sans text-2xl text-slate-400 sm:text-3xl">
              to <span className="text-slate-100">{sale.team.name}</span> for{" "}
              <span className="font-mono text-4xl font-bold text-gold sm:text-5xl">{formatLakhs(sale.price)}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----- Sales, sequence, activity ---------------------------------------- */

/** The most recent sale, called out when it was this team's. Announced to screen readers. */
export function LatestSale({ state, teamId }) {
  const [sale] = getRecentSales(state, 1);
  if (!sale) return null;
  const mine = teamId && sale.teamId === teamId;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ${mine ? "border-primary bg-primary/15" : "border-slate-800 bg-obsidian-900"}`}
    >
      <span className="mr-2 font-mono text-xs font-bold uppercase tracking-wider text-gold">{mine ? "You bought" : "Last sale"}</span>
      <strong className="text-slate-100">{sale.player.name}</strong>
      {!mine && <span className="text-slate-400"> to {sale.team.name}</span>}
      <span className="text-slate-400"> for </span>
      <strong className="text-primary">{formatLakhs(sale.price)}</strong>
    </div>
  );
}

/** Latest sales first. `renderAction` adds a per-row control (the admin's cancel button). */
export function RecentSales({ state, limit = 10, highlightTeamId, renderAction }) {
  const sales = getRecentSales(state, limit);
  if (!sales.length) return <Empty>No players sold yet.</Empty>;
  return (
    <ol className="divide-y divide-slate-800 text-sm">
      {sales.map((sale) => (
        <li
          key={sale.id}
          className={`flex flex-wrap items-center justify-between gap-2 py-2 ${sale.teamId === highlightTeamId ? "text-primary" : ""}`}
        >
          <span className="min-w-0">
            <span className="text-slate-100">{sale.player.name}</span>
            <span className="text-slate-400"> → {sale.team.name}</span>
          </span>
          <span className="flex items-center gap-2">
            <strong className="text-primary">{formatLakhs(sale.price)}</strong>
            {renderAction?.(sale)}
          </span>
        </li>
      ))}
    </ol>
  );
}



export function ActivityLog({ state, limit = 40 }) {
  const entries = state.activity.slice(-limit).reverse();
  if (!entries.length) return <Empty>No activity yet.</Empty>;
  return (
    <ol className="max-h-80 divide-y divide-slate-800 overflow-y-auto pr-1 text-xs">
      {entries.map((entry) => (
        <li key={entry.seq} className="py-1.5">
          <span className="mr-2 font-mono text-slate-500">
            #{entry.seq} {entry.at ? new Date(entry.at).toLocaleTimeString() : ""}
          </span>
          <span className="text-slate-200">{entry.message}</span>
        </li>
      ))}
    </ol>
  );
}

/* ----- Teams ------------------------------------------------------------ */

/** Bars for each role: have / max (or squad max when a role has no cap), with minimums flagged. */
export function RoleMeters({ state, teamId }) {
  const needs = getRoleNeeds(state, teamId);
  const squadMax = state.config.squad.max;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {ROLE_LIST.map((role) => {
        const { have, min, max, need, full } = needs.roles[role];
        const cap = max ?? squadMax;
        return (
          <div key={role} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-slate-400">{ROLE_LABELS[role]}</span>
              <span className={need > 0 ? "text-amber-300" : full ? "text-slate-500" : "text-slate-100"}>
                {have}/{max ?? "∞"}
                {need > 0 && ` · need ${need}`}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
              <div className="h-full rounded-full bg-primary" style={{ width: `${cap ? Math.min(100, (have / cap) * 100) : 0}%` }} />
            </div>
            {min > 0 && <div className="mt-0.5 text-[10px] text-slate-500">min {min}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** Purse, squad and overseas for every team. */
export function TeamsTable({ state, highlightTeamId }) {
  const { config } = state;
  return (
    <div className={table.wrap}>
      <table className={table.table}>
        <thead className={table.thead}>
          <tr>
            <th className={table.th}>Team</th>
            <th className={table.th}>Purse left</th>
            <th className={table.th}>Spent</th>
            <th className={table.th}>Max next</th>
            <th className={table.th}>Squad</th>
            <th className={table.th}>Overseas</th>
            {ROLE_LIST.map((role) => (
              <th key={role} className={table.th}>
                {ROLE_LABELS[role]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={table.tbody}>
          {getTeamsInOrder(state).map((team) => {
            const stats = getTeamStats(state, team.id);
            return (
              <tr key={team.id} className={team.id === highlightTeamId ? table.highlight : ""}>
                <td className={`${table.td} whitespace-nowrap text-slate-100`}>{team.name}</td>
                <td className={`${table.td} whitespace-nowrap font-bold text-primary`}>{formatLakhs(stats.purse)}</td>
                <td className={`${table.td} whitespace-nowrap text-slate-400`}>{formatLakhs(stats.spent)}</td>
                <td className={`${table.td} whitespace-nowrap text-slate-400`}>{formatLakhs(getMaxBid(state, team.id))}</td>
                <td className={`${table.td} whitespace-nowrap`}>
                  {stats.count}/{config.squad.max}
                  <span className="text-slate-500"> (min {config.squad.min})</span>
                </td>
                <td className={`${table.td} whitespace-nowrap`}>
                  {stats.overseas}/{config.maxOverseas ?? "∞"}
                </td>
                {ROLE_LIST.map((role) => (
                  <td key={role} className={`${table.td} whitespace-nowrap`}>
                    {stats.roles[role]}/{config.roleLimits[role].max ?? "∞"}
                    {config.roleLimits[role].min > 0 && <span className="text-slate-500"> (min {config.roleLimits[role].min})</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** One tile per team: purse left, squad and overseas counts. For the big screen and headers. */
export function PurseStrip({ state, highlightTeamId }) {
  const { config } = state;
  const teams = getTeamsInOrder(state);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
      {teams.map((team) => {
        const stats = getTeamStats(state, team.id);
        return (
          <div
            key={team.id}
            className={`rounded-xl border px-3 py-2 ${team.id === highlightTeamId ? "border-primary bg-primary/10" : "border-slate-800 bg-obsidian-800"}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-mono text-sm font-bold uppercase text-slate-100" title={team.name}>
                {team.shortName}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                {stats.count}/{config.squad.max} · OS {stats.overseas}/{config.maxOverseas ?? "∞"}
              </span>
            </div>
            <div className="font-mono text-2xl font-bold leading-tight text-gold">{formatLakhs(stats.purse)}</div>
          </div>
        );
      })}
    </div>
  );
}

/** One team: purse, spend, role mix and squad with prices. `mine` marks the viewer's team. */
export function TeamSquadCard({ state, team, mine = false, footer }) {
  const { config } = state;
  const stats = getTeamStats(state, team.id);
  const squad = getTeamPurchaseHistory(state, team.id);
  return (
    <section className={`rounded-xl border bg-obsidian-800 p-4 ${mine ? "border-primary" : "border-slate-800"}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="min-w-0 font-Bebas text-xl font-bold uppercase leading-none tracking-tight text-slate-100">
          {team.name}
          {mine && <Tag tone="primary" className="ml-2 align-middle">You</Tag>}
        </h3>
        <span className="whitespace-nowrap font-mono text-lg font-bold leading-none text-gold">{formatLakhs(stats.purse)}</span>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        {stats.count}/{config.squad.max} players · spent {formatLakhs(stats.spent)} · overseas {stats.overseas}/
        {config.maxOverseas ?? "∞"}
      </p>
      <RoleMeters state={state} teamId={team.id} />
      <div className="mt-4 border-t border-slate-800 pt-3">
        {squad.length === 0 ? (
          <Empty>No players yet.</Empty>
        ) : (
          <ul className="space-y-1 text-xs">
            {squad.map((purchase) => (
              <li key={purchase.id} className="flex justify-between gap-2">
                <span className="min-w-0">
                  <span className="text-slate-100">{purchase.player.name}</span>
                  <span className="text-slate-400">
                    {" "}
                    · {ROLE_LABELS[purchase.player.role]}
                    {purchase.player.isOverseas ? " · OS" : ""}
                  </span>
                  {isFictional(purchase.player) && <span className="text-amber-300/80"> (fictional)</span>}
                </span>
                <span className="whitespace-nowrap text-primary">{formatLakhs(purchase.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {footer}
    </section>
  );
}
