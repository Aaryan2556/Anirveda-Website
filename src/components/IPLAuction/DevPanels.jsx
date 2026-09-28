/**
 * Phase 1 functional-testing panels for the IPL Auction.
 * Intentionally plain — the final UI/UX is Phase 8.
 */
import { ROLE_LABELS, ROLE_LIST } from "../../lib/iplAuction/config";
import { getMaxBid, getRecentSales, getTeamStats, getTeamsInOrder, getUpcomingPlayers } from "../../lib/iplAuction/engine";
import { useConnectionStatus } from "../../lib/iplAuction/hooks/useConnectionStatus";
import { formatLakhs } from "../../lib/iplAuction/money";
import { STAT_FIELD_LABELS, STAT_GROUPS, isFictional } from "../../lib/iplAuction/playerFields";

export function Section({ title, children, actions }) {
  return (
    <section className="border border-white/15 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Button({ children, variant = "default", ...props }) {
  const styles = {
    default: "border-white/30 hover:bg-white/10",
    primary: "border-primary bg-primary/20 hover:bg-primary/40",
    danger: "border-red-500/60 hover:bg-red-500/20",
  };
  return (
    <button
      type="button"
      className={`border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DevBanner({ kind = "local" }) {
  const storage =
    kind === "appwrite"
      ? "State lives in the IPL Appwrite dev database; only signed-in admins can change it."
      : "State lives only in this browser (localStorage) and syncs between tabs. No Appwrite, no network.";
  return (
    <div className="border border-yellow-500/60 bg-yellow-500/10 p-3 text-xs text-yellow-200">
      <strong>LOCAL DEVELOPMENT — FUNCTIONAL TEST UI.</strong> All teams and players are{" "}
      <strong>FICTIONAL mock data</strong>; names and statistics are invented and are not real. Bidding happens in
      the room; the admin records each result here. {storage}
    </div>
  );
}

export function AuctionHeader({ state }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
      <span>
        Status: <strong className="text-primary">{state.status}</strong>
      </span>
      <span className="text-white/60">Auction: {state.name}</span>
      <span className="text-white/60">Version: {state.version}</span>
      <ConnectionIndicator />
    </div>
  );
}

const CONNECTION_LABELS = {
  live: { text: "Live", className: "text-green-400" },
  polling: { text: "Syncing (polling)", className: "text-white/60" },
  connecting: { text: "Connecting…", className: "text-yellow-300" },
  reconnecting: { text: "Reconnecting…", className: "text-yellow-300" },
  offline: { text: "Offline — showing last known state", className: "text-red-400" },
};

/** Small sync indicator; hidden for the browser-only (local) adapter. */
export function ConnectionIndicator() {
  const { status } = useConnectionStatus();
  const label = CONNECTION_LABELS[status];
  if (!label) return null;
  return (
    <span className={label.className} role="status">
      ● {label.text}
    </span>
  );
}

function StatTable({ title, stats }) {
  if (!stats) return null;
  return (
    <div className="min-w-0">
      <div className="mb-1 text-xs uppercase text-white/50">{title}</div>
      <table className="text-xs">
        <tbody>
          {Object.entries(stats).map(([key, value]) => (
            <tr key={key}>
              <td className="pr-3 text-white/60">{STAT_FIELD_LABELS[key] ?? key}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlayerDetails({ player }) {
  const sourceNote = isFictional(player) ? " (fictional)" : "";
  return (
    <div className="space-y-2 text-sm">
      <div className="text-xl font-bold">
        {player.name}
        {isFictional(player) && (
          <span className="ml-2 border border-yellow-500/60 px-1.5 py-0.5 align-middle text-[10px] font-normal text-yellow-200">
            FICTIONAL
          </span>
        )}
      </div>
      <div className="text-white/70">
        {ROLE_LABELS[player.role]} · {player.nationality ?? "—"} {player.isOverseas ? "(overseas)" : ""} · Age{" "}
        {player.age ?? "—"}
      </div>
      <div className="text-white/70">
        {player.battingStyle ?? "—"}
        {player.bowlingStyle ? ` · ${player.bowlingStyle}` : ""}
      </div>
      <div>
        Base price: <strong>{formatLakhs(player.basePrice)}</strong>
      </div>
      <div className="flex flex-wrap gap-6">
        {Object.entries(STAT_GROUPS).map(([group, { label }]) => (
          <StatTable key={group} title={`${label}${sourceNote}`} stats={player.stats?.[group]} />
        ))}
      </div>
      {player.recentPerformance?.length > 0 && (
        <div className="text-xs text-white/70">
          Recent{sourceNote}: {player.recentPerformance.join(" | ")}
        </div>
      )}
      {!isFictional(player) && player.dataSource && (
        <div className="text-[10px] uppercase text-white/40">Source: {player.dataSource}</div>
      )}
    </div>
  );
}

export function CurrentLot({ state }) {
  const lot = state.lot;
  if (!lot) return <p className="text-sm text-white/60">No player is on the block.</p>;
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wider text-primary">On the block · bidding in the room</div>
      <PlayerDetails player={state.players[lot.playerId]} />
    </div>
  );
}

export function TeamsTable({ state, highlightTeamId }) {
  const { config } = state;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-white/50">
          <tr>
            <th className="py-1 pr-3">Team</th>
            <th className="pr-3">Purse left</th>
            <th className="pr-3">Spent</th>
            <th className="pr-3">Max price</th>
            <th className="pr-3">Squad</th>
            <th className="pr-3">Overseas</th>
            {ROLE_LIST.map((role) => (
              <th key={role} className="pr-3">
                {ROLE_LABELS[role]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getTeamsInOrder(state).map((team) => {
            const stats = getTeamStats(state, team.id);
            return (
              <tr
                key={team.id}
                className={`border-t border-white/10 ${team.id === highlightTeamId ? "bg-primary/15" : ""}`}
              >
                <td className="py-1 pr-3">{team.name}</td>
                <td className="pr-3">{formatLakhs(stats.purse)}</td>
                <td className="pr-3">{formatLakhs(stats.spent)}</td>
                <td className="pr-3">{formatLakhs(getMaxBid(state, team.id))}</td>
                <td className="pr-3">
                  {stats.count}/{config.squad.max} (min {config.squad.min})
                </td>
                <td className="pr-3">
                  {stats.overseas}/{config.maxOverseas ?? "∞"}
                </td>
                {ROLE_LIST.map((role) => (
                  <td key={role} className="pr-3">
                    {stats.roles[role]}/{config.roleLimits[role].max ?? "∞"}
                    {config.roleLimits[role].min > 0 ? ` (min ${config.roleLimits[role].min})` : ""}
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

/** Players still to come, in auction order. */
export function UpcomingPlayers({ state, limit = 8 }) {
  const upcoming = getUpcomingPlayers(state);
  if (!upcoming.length) return <p className="text-sm text-white/60">No players left in the sequence.</p>;
  return (
    <ol className="space-y-1 text-sm">
      {upcoming.slice(0, limit).map((player, index) => (
        <li key={player.id}>
          <span className="text-white/40">{index + 1}.</span> {player.name} · {ROLE_LABELS[player.role]}
          {player.isOverseas ? " · overseas" : ""} · base {formatLakhs(player.basePrice)}
        </li>
      ))}
      {upcoming.length > limit && <li className="text-white/50">+ {upcoming.length - limit} more</li>}
    </ol>
  );
}

/** Latest sales first. `renderAction` adds a per-row control (e.g. the admin's cancel button). */
export function RecentSales({ state, limit = 10, highlightTeamId, renderAction }) {
  const sales = getRecentSales(state, limit);
  if (!sales.length) return <p className="text-sm text-white/60">No players sold yet.</p>;
  return (
    <ol className="space-y-1 text-sm">
      {sales.map((sale) => (
        <li
          key={sale.id}
          className={`flex flex-wrap items-center gap-2 ${sale.teamId === highlightTeamId ? "text-primary" : ""}`}
        >
          <span>
            {sale.player.name} → <strong>{sale.team.name}</strong> · {formatLakhs(sale.price)}
          </span>
          {renderAction?.(sale)}
        </li>
      ))}
    </ol>
  );
}

export function ActivityLog({ state, limit = 40 }) {
  const entries = state.activity.slice(-limit).reverse();
  if (!entries.length) return <p className="text-sm text-white/60">No activity yet.</p>;
  return (
    <ol className="max-h-80 space-y-1 overflow-y-auto text-xs">
      {entries.map((entry) => (
        <li key={entry.seq} className="border-b border-white/5 pb-1">
          <span className="text-white/40">
            #{entry.seq} {entry.at ? new Date(entry.at).toLocaleTimeString() : ""}
          </span>{" "}
          {entry.message}
        </li>
      ))}
    </ol>
  );
}

export function SquadList({ state, teamId, squad }) {
  if (!squad.length) return <p className="text-sm text-white/60">No players bought yet.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {squad.map((player) => (
        <li key={player.id}>
          {player.name} · {ROLE_LABELS[player.role]}
          {player.isOverseas ? " · overseas" : ""} · {formatLakhs(player.price)}
        </li>
      ))}
      <li className="pt-1 text-white/60">Total spent: {formatLakhs(getTeamStats(state, teamId).spent)}</li>
    </ul>
  );
}
