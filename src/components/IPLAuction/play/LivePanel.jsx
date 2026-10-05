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

/** Purse, spend, squad size, what the team still needs, and its squad. */
export function MyTeam({ state, teamId }) {
  const { config } = state;
  const stats = getTeamStats(state, teamId);
  const needs = getRoleNeeds(state, teamId);
  const history = getTeamPurchaseHistory(state, teamId);
  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile label="Purse left" value={formatLakhs(stats.purse)} accent />
        <StatTile label="Max price next" value={formatLakhs(getMaxBid(state, teamId))} />
        <StatTile label="Spent" value={formatLakhs(stats.spent)} />
        <StatTile label="Squad" value={`${stats.count}/${config.squad.max}`} hint={`min ${config.squad.min}`} />
        <StatTile label="Overseas" value={`${stats.overseas}/${config.maxOverseas ?? "∞"}`} />
        <StatTile label="Slots left" value={needs.slotsLeft} />
      </div>

      <div>
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">Still needed</div>
        <p className="mb-3 text-xs text-slate-400">
          {needs.squadShort > 0
            ? `${needs.squadShort} more player${needs.squadShort === 1 ? "" : "s"} to reach the squad minimum of ${config.squad.min}. `
            : "Squad minimum reached. "}
          {needs.overseasLeft !== null && `${needs.overseasLeft} overseas slot${needs.overseasLeft === 1 ? "" : "s"} left.`}
        </p>
        <RoleMeters state={state} teamId={teamId} />
      </div>

      <div>
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Squad ({history.length}) in order bought
        </div>
        {history.length === 0 ? (
          <Empty>No players bought yet.</Empty>
        ) : (
          <ol className="divide-y divide-slate-800">
            {history.map((purchase, index) => (
              <li key={purchase.id} className="flex justify-between gap-2 py-2">
                <span className="min-w-0">
                  <span className="mr-2 font-mono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-slate-100">{purchase.player.name}</span>
                  <span className="text-slate-400">
                    {" "}
                    · {ROLE_LABELS[purchase.player.role]}
                    {purchase.player.isOverseas ? " · OS" : ""}
                  </span>
                  {isFictional(purchase.player) && <span className="text-amber-300/80"> (fictional)</span>}
                </span>
                <span className="whitespace-nowrap font-bold text-primary">{formatLakhs(purchase.price)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default function LivePanel({ state, teamId }) {
  return (
    <div className="space-y-4">
      <LatestSale state={state} teamId={teamId} />
      <Panel title="On the block">
        <CurrentLot state={state} hideLiveBid={true} />
        {state.lot && <BuyingPower state={state} teamId={teamId} />}
      </Panel>
      <Panel title="My team">
        <MyTeam state={state} teamId={teamId} />
      </Panel>
    </div>
  );
}
