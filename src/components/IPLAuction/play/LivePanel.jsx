/**
 * Team dashboard, live view: the latest sale, the player on the block and
 * whether this team can buy them, and the team's own purse, needs and squad.
 * View-only; every "can we buy?" answer comes from the engine's rules.
 */
import { ROLE_LABELS, ROLE_LIST } from "../../../lib/iplAuction/config";
import {
  getMaxBid,
  getRecentSales,
  getRoleNeeds,
  getTeamPurchaseHistory,
  getTeamStats,
  validateSale,
} from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { isFictional } from "../../../lib/iplAuction/playerFields";
import { CurrentLot, Section, UpcomingPlayers } from "../DevPanels";

/** Announces the most recent sale, and calls it out when it was this team's. */
export function LatestSale({ state, teamId }) {
  const [sale] = getRecentSales(state, 1);
  if (!sale) return null;
  const mine = sale.teamId === teamId;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`border p-3 text-sm ${mine ? "border-primary bg-primary/15" : "border-white/15"}`}
    >
      {mine ? "You bought " : "Last sale: "}
      <strong>{sale.player.name}</strong>
      {mine ? "" : ` to ${sale.team.name}`} for <strong>{formatLakhs(sale.price)}</strong>.
    </div>
  );
}

/** Whether this team can buy the player on the block, and how high it can go. */
export function BuyingPower({ state, teamId }) {
  const player = state.players[state.lot.playerId];
  const blocked = validateSale(state, teamId, player, player.basePrice);
  return (
    <div className="mt-4 border-t border-white/10 pt-4 text-sm">
      {blocked ? (
        <span className="text-red-300">You can&apos;t buy this player: {blocked.message}</span>
      ) : (
        <span>
          You can pay up to <strong className="text-primary">{formatLakhs(getMaxBid(state, teamId))}</strong> for this
          player.
        </span>
      )}
    </div>
  );
}

function Stat({ label, value, strong }) {
  return (
    <div className="min-w-[7rem] border border-white/10 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className={strong ? "text-lg font-bold text-primary" : "text-lg"}>{value}</div>
    </div>
  );
}

/** Purse, spend, squad size and what the team still needs to complete a valid squad. */
export function MyTeam({ state, teamId }) {
  const { config } = state;
  const stats = getTeamStats(state, teamId);
  const needs = getRoleNeeds(state, teamId);
  const history = getTeamPurchaseHistory(state, teamId);
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <Stat label="Purse left" value={formatLakhs(stats.purse)} strong />
        <Stat label="Spent" value={formatLakhs(stats.spent)} />
        <Stat label="Max price next" value={formatLakhs(getMaxBid(state, teamId))} />
        <Stat label="Squad" value={`${stats.count}/${config.squad.max}`} />
        <Stat label="Overseas" value={`${stats.overseas}/${config.maxOverseas ?? "∞"}`} />
      </div>

      <div>
        <div className="mb-1 text-xs uppercase text-white/50">Still needed</div>
        <p className="mb-2 text-xs text-white/70">
          {needs.squadShort > 0
            ? `${needs.squadShort} more player${needs.squadShort === 1 ? "" : "s"} to reach the squad minimum of ${config.squad.min}. `
            : "Squad minimum reached. "}
          {needs.slotsLeft} slot{needs.slotsLeft === 1 ? "" : "s"} left
          {needs.overseasLeft !== null && `, ${needs.overseasLeft} overseas`}.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ROLE_LIST.map((role) => {
            const { have, min, max, need, full } = needs.roles[role];
            return (
              <div
                key={role}
                className={`border px-2 py-1 text-xs ${need > 0 ? "border-yellow-400/60" : full ? "border-white/10 text-white/50" : "border-white/15"}`}
              >
                <div className="font-bold">{ROLE_LABELS[role]}</div>
                <div>
                  {have} / {max ?? "∞"} {min > 0 && <span className="text-white/60">(min {min})</span>}
                </div>
                <div className={need > 0 ? "text-yellow-200" : "text-white/50"}>
                  {need > 0 ? `Need ${need}` : full ? "Full" : "OK"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs uppercase text-white/50">Squad ({history.length}) in order bought</div>
        {history.length === 0 ? (
          <p className="text-white/60">No players bought yet.</p>
        ) : (
          <ol className="space-y-1">
            {history.map((purchase, index) => (
              <li key={purchase.id} className="flex justify-between gap-2 border-b border-white/5 pb-1">
                <span>
                  <span className="text-white/40">{index + 1}.</span> {purchase.player.name} ·{" "}
                  {ROLE_LABELS[purchase.player.role]}
                  {purchase.player.isOverseas ? " · OS" : ""}
                  {isFictional(purchase.player) && <span className="text-yellow-300/70"> (fictional)</span>}
                </span>
                <span>{formatLakhs(purchase.price)}</span>
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
      <Section title="On the block">
        <CurrentLot state={state} />
        {state.lot && <BuyingPower state={state} teamId={teamId} />}
      </Section>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Section title="My team">
          <MyTeam state={state} teamId={teamId} />
        </Section>
        <Section title="Up next">
          <UpcomingPlayers state={state} />
        </Section>
      </div>
    </div>
  );
}
