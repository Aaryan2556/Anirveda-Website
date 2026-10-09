/**
 * Team dashboard, live view: the latest sale, the player on the block and
 * whether this team can buy them, and the team's own purse, needs and squad
 * (no other team's purse, no upcoming players).
 * View-only; every "can we buy?" answer comes from the engine's rules.
 */
import { ROLE_LABELS } from "../../../lib/iplAuction/config";
import {
  getMaxBid,
  getRoleNeeds,
  getTeamPurchaseHistory,
  getTeamStats,
  validateSale,
} from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { isFictional } from "../../../lib/iplAuction/playerFields";
import { Empty, Panel, StatTile } from "../ui/controls";
import { CurrentLot, LatestSale, RoleMeters } from "../ui/auction";

/** Whether this team can buy the player on the block, and how high it can go. */
export function BuyingPower({ state, teamId }) {
  const player = state.players[state.lot.playerId];
  const blocked = validateSale(state, teamId, player, player.basePrice);
  return (
    <div
      className={`mt-5 rounded-xl border px-4 py-3 text-sm ${blocked ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-primary/40 bg-primary/10"}`}
    >
      {blocked ? (
        <>You can&apos;t buy this player: {blocked.message}</>
      ) : (
        <>
          <span className="text-slate-400">You can pay up to </span>
          <strong className="font-mono text-xl font-bold text-gold">{formatLakhs(getMaxBid(state, teamId))}</strong>
          <span className="text-slate-400"> for this player.</span>
        </>
      )}
    </div>
  );
}

/** Full-width stacked view: 15-slot compact squad grid on top, broadcast summary strip on bottom. */
export function MyTeam({ state, teamId }) {
  const config = state.config || {};
  const team = state.teams[teamId];
  const initialPurse = config.initialPurse || 10000;
  const maxSquad = config.squad?.max || 15;
  const stats = getTeamStats(state, teamId);
  const history = getTeamPurchaseHistory(state, teamId);
  const maxBid = getMaxBid(state, teamId);

  const batCount = stats.roles?.BATTER || 0;
  const bowlCount = stats.roles?.BOWLER || 0;
  const arCount = stats.roles?.ALL_ROUNDER || 0;
  const wkCount = stats.roles?.WICKETKEEPER || 0;
  const osCount = stats.overseas || 0;

  // Build 15-slot canvas array
  const slots = Array.from({ length: maxSquad }, (_, i) => history[i] || null);

  const getRoleShort = (role) => {
    switch (role) {
      case "BATTER": return "BAT";
      case "BOWLER": return "BOWL";
      case "ALL_ROUNDER": return "AR";
      case "WICKETKEEPER": return "WK";
      default: return role;
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "BATTER": return "border-blue-500/40 bg-blue-500/10 text-blue-300";
      case "BOWLER": return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
      case "ALL_ROUNDER": return "border-purple-500/40 bg-purple-500/10 text-purple-300";
      case "WICKETKEEPER": return "border-amber-500/40 bg-amber-500/10 text-amber-300";
      default: return "border-slate-700 bg-slate-800 text-slate-300";
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 text-xs">
      {/* 1. TOP BLOCK: "My Squad" (Full-Width Horizontal Multi-Column 15-Slot Grid) */}
      <Panel title={`My Squad Roster (${history.length} Acquired · ${maxSquad - history.length} Open)`}>
        <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {slots.map((purchase, index) => {
            const slotNum = index + 1;
            if (purchase) {
              const p = purchase.player;
              return (
                <div
                  key={purchase.id || index}
                  className="flex items-center justify-between gap-1.5 rounded-lg border border-slate-700/80 bg-obsidian-800 py-1.5 px-2.5 shadow-sm transition hover:border-gold/50 min-w-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`shrink-0 rounded border px-1 py-0.5 font-mono text-[9px] font-bold uppercase ${getRoleBadgeStyle(p.role)}`}>
                      {getRoleShort(p.role)}
                    </span>
                    <span className="truncate font-sans text-xs font-semibold text-slate-100">
                      {p.name}
                    </span>
                    {p.isOverseas && (
                      <span className="shrink-0 rounded bg-amber-500/20 px-1 text-[9px] font-mono text-amber-300">
                        OS
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-gold">
                    {formatLakhs(purchase.price)}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={`empty-slot-${slotNum}`}
                className="flex items-center justify-between rounded-lg border border-dashed border-slate-800 bg-obsidian-900/40 py-1.5 px-2.5 text-slate-500 min-w-0"
              >
                <span className="font-mono text-[10px] text-slate-500 truncate">
                  Slot {String(slotNum).padStart(2, "0")} · <span className="text-slate-600">Open</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-600 shrink-0">
                  Open
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 2. BOTTOM BLOCK: "My Team Summary" (Full-Width Expansive Broadcast HUD Strip) */}
      <div className="w-full rounded-xl border border-gold/30 bg-obsidian-900/90 p-3.5 shadow-glassGlow flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
        {/* Left: Team Crest & Identity */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          {team?.logo ? (
            <img src={team.logo} alt={team.name} className="h-8 w-8 object-contain shrink-0" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 font-Bebas text-sm font-bold text-gold">
              {team?.shortName || "TM"}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-Bebas text-xl font-bold uppercase leading-none tracking-tight text-slate-100 sm:text-2xl">
                {team?.name || "My Franchise"}
              </h3>
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                {stats.count} / {maxSquad} Players
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">Code: <strong className="text-slate-200">{team?.shortName}</strong></span>
          </div>
        </div>

        {/* Center: Category Breakdown Pill Strip */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] justify-center">
          <span className="inline-flex items-center rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-blue-300">
            <strong className="mr-1.5 font-bold text-gold">{batCount}</strong> BAT
          </span>
          <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
            <strong className="mr-1.5 font-bold text-gold">{bowlCount}</strong> BOWL
          </span>
          <span className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-purple-300">
            <strong className="mr-1.5 font-bold text-gold">{arCount}</strong> AR
          </span>
          <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300">
            <strong className="mr-1.5 font-bold text-gold">{wkCount}</strong> WK
          </span>
          <span className="inline-flex items-center rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold">
            <strong className="mr-1.5 font-bold text-amber-400">{osCount}</strong> OS
          </span>
        </div>

        {/* Right: Purse & Max Bid Indicators */}
        <div className="flex items-center gap-4 shrink-0 justify-end w-full sm:w-auto">
          <div className="text-right">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Purse Remaining</span>
            <div className="font-mono text-lg font-bold text-gold">{formatLakhs(stats.purse)} <span className="font-normal text-slate-500 text-xs">/ {formatLakhs(initialPurse)}</span></div>
          </div>
          <div className="h-8 w-px bg-slate-800" aria-hidden="true" />
          <div className="text-right">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Max Next Bid</span>
            <span className="font-mono text-base font-bold text-primary">{formatLakhs(maxBid)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LivePanel({ state, teamId }) {
  return (
    <div className="w-full space-y-4">
      <LatestSale state={state} teamId={teamId} />
      <Panel title="On the block">
        <CurrentLot state={state} hideLiveBid={true} />
        {state.lot && <BuyingPower state={state} teamId={teamId} />}
      </Panel>
      <MyTeam state={state} teamId={teamId} />
    </div>
  );
}
