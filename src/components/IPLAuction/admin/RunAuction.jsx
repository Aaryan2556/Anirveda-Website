/**
 * Running the auction: lifecycle controls and recording the room's result for
 * the player on the block (SOLD to a team at the hammer price, or UNSOLD).
 */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AUCTION_STATUS,
  COMMANDS,
  getMaxBid,
  getNextPlayerInSequence,
  getTeamsInOrder,
  getUndoPreview,
  reduce,
} from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { nextPrice, previousPrice, stepAt } from "../../../lib/iplAuction/priceSteps";
import { Button, Panel, inputClass } from "../ui/controls";
import { CurrentLot } from "../ui/auction";
import { ConfirmButton, Field } from "./fields";

export function AuctionControls({ state, send, pending, reset }) {
  const { status, lot } = state;
  const isLive = status === AUCTION_STATUS.LIVE;
  const isCompleted = status === AUCTION_STATUS.COMPLETED;
  const undoPreview = getUndoPreview(state);
  const nextInSequence = getNextPlayerInSequence(state);

  return (
    <Panel title="Auction controls">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={status !== AUCTION_STATUS.SETUP || pending}
          onClick={() => send({ type: COMMANDS.START_AUCTION }, { success: "Auction started." })}
        >
          Start auction
        </Button>
        <Button
          variant="primary"
          disabled={!isLive || Boolean(lot) || !nextInSequence || pending}
          onClick={() => send({ type: COMMANDS.OPEN_LOT })}
          title={nextInSequence ? `Put up ${nextInSequence.name}` : "No players left in the sequence"}
        >
          Next player{nextInSequence ? `: ${nextInSequence.name}` : ""}
        </Button>
        <Button disabled={!isLive || pending} onClick={() => send({ type: COMMANDS.PAUSE_AUCTION })}>
          Pause
        </Button>
        <Button disabled={status !== AUCTION_STATUS.PAUSED || pending} onClick={() => send({ type: COMMANDS.RESUME_AUCTION })}>
          Resume
        </Button>
        <Button
          disabled={!undoPreview || isCompleted || pending}
          onClick={() => send({ type: COMMANDS.UNDO })}
          title={undoPreview ?? "Nothing to undo"}
        >
          Undo{undoPreview ? `: ${undoPreview}` : ""}
        </Button>
        <ConfirmButton
          label="End auction"
          confirmLabel="Confirm: end the auction"
          disabled={!(isLive || status === AUCTION_STATUS.PAUSED) || pending}
          onConfirm={() => send({ type: COMMANDS.END_AUCTION }, { success: "Auction ended." })}
        />
        {reset && (
          <ConfirmButton
            label="Reset local data"
            confirmLabel="Confirm: wipe local auction"
            onConfirm={async () => {
              await reset();
              toast.success("Local auction reset.");
            }}
          />
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800 pt-3 text-xs text-slate-400">
        <a href="/ipl-auction/sabka_malik/screen" target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
          Open big screen
        </a>
        <span className="uppercase tracking-wider">View as team (admin preview):</span>
        {getTeamsInOrder(state).map((team) => (
          <a
            key={team.id}
            href={`/ipl-auction/play?team=${encodeURIComponent(team.id)}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            {team.name}
          </a>
        ))}
      </div>
    </Panel>
  );
}

export function OnTheBlock({ state, send, actor, pending }) {
  const { lot } = state;
  const lotPlayer = lot ? state.players[lot.playerId] : null;
  const teams = getTeamsInOrder(state);
  const [saleTeamId, setSaleTeamId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const lotId = lot?.id;
  const lotBasePrice = lotPlayer?.basePrice;
  useEffect(() => {
    // New player on the block: clear the winner, start the price at base.
    setSaleTeamId("");
    setSalePrice(lotBasePrice == null ? "" : String(lotBasePrice));
  }, [lotId, lotBasePrice]);

  useEffect(() => {
    if (!lotId || !salePrice) return;
    send({ type: COMMANDS.UPDATE_BID, price: Number(salePrice), teamId: saleTeamId });
  }, [salePrice, saleTeamId, lotId, send]);

  const saleCommand = lot
    ? { type: COMMANDS.SELL_PLAYER, playerId: lot.playerId, teamId: saleTeamId, price: Number(salePrice) }
    : null;
  // The −/+ calculator works from the typed price, or from the base price if that isn't valid yet.
  const typedPrice = Number(salePrice);
  const currentPrice =
    lotPlayer && Number.isSafeInteger(typedPrice) && typedPrice >= lotPlayer.basePrice ? typedPrice : lotPlayer?.basePrice ?? 0;
  // Dry-run through the engine so the admin sees why a sale would be refused before clicking.
  const salePreview = saleCommand && saleTeamId && actor ? reduce(state, { ...saleCommand, actor }) : null;

  return (
    <Panel title="On the block">
      <div className={lot ? "grid gap-6 xl:grid-cols-[1fr_20rem]" : ""}>
        <CurrentLot state={state} />
        {lot && (
          <div className="min-w-0 space-y-3 rounded-2xl border border-gold/40 bg-obsidian-900 p-4 shadow-goldGlow xl:self-start">
            <div>
              <h3 className="font-Bebas text-xl font-bold uppercase leading-none tracking-tight text-primary">Hammer</h3>
              <p className="mt-1 text-xs text-slate-400">When the hammer falls, pick the winning team and enter the final price.</p>
            </div>
            <Field label="Winning team">
              <select className={`${inputClass} w-full min-w-0`} value={saleTeamId} onChange={(e) => setSaleTeamId(e.target.value)}>
                <option value="">Select…</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} (max {formatLakhs(getMaxBid(state, team.id))})
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid min-w-0 gap-1 text-xs">
              <label htmlFor="ipl-sale-price" className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Final price (lakhs)
              </label>
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2">
                <Button
                  aria-label={`Lower price to ${formatLakhs(previousPrice(currentPrice, lotPlayer.basePrice))}`}
                  disabled={currentPrice <= lotPlayer.basePrice}
                  onClick={() => setSalePrice(String(previousPrice(currentPrice, lotPlayer.basePrice)))}
                >
                  −
                </Button>
                <input
                  id="ipl-sale-price"
                  className={`${inputClass} w-full min-w-0 text-center`}
                  type="number"
                  inputMode="numeric"
                  min={lotPlayer.basePrice}
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
                <Button
                  variant="outline"
                  aria-label={`Raise price to ${formatLakhs(nextPrice(currentPrice))}`}
                  onClick={() => setSalePrice(String(nextPrice(currentPrice)))}
                >
                  +{formatLakhs(stepAt(currentPrice))}
                </Button>
              </div>
              <span className="text-slate-500">
                {formatLakhs(Number(salePrice) || null)} · base {formatLakhs(lotPlayer.basePrice)} · +20 L up to ₹5 Cr, then +₹1 Cr
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!salePreview?.ok || pending}
              onClick={() =>
                send(saleCommand, { success: `SOLD to ${state.teams[saleTeamId].name} for ${formatLakhs(Number(salePrice))}.` })
              }
            >
              SOLD{saleTeamId ? ` to ${state.teams[saleTeamId].shortName}` : ""} · {formatLakhs(Number(salePrice) || null)}
            </Button>
            {salePreview && !salePreview.ok && (
              <p className="text-sm text-red-300" role="alert">
                Can&apos;t sell: {salePreview.error.message}
              </p>
            )}
            <div className="flex gap-2 border-t border-slate-800 pt-3">
              <Button className="flex-1" disabled={pending} onClick={() => send({ type: COMMANDS.MARK_UNSOLD })}>
                UNSOLD
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={pending}
                onClick={() => send({ type: COMMANDS.WITHDRAW_PLAYER, playerId: lot.playerId })}
              >
                Withdraw
              </Button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
