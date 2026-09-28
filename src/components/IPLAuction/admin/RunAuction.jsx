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
import { Button, CurrentLot, Section } from "../DevPanels";
import { ConfirmButton } from "./fields";

export function AuctionControls({ state, send, pending, reset }) {
  const { status, lot } = state;
  const isLive = status === AUCTION_STATUS.LIVE;
  const isCompleted = status === AUCTION_STATUS.COMPLETED;
  const undoPreview = getUndoPreview(state);
  const nextInSequence = getNextPlayerInSequence(state);

  return (
    <Section title="Auction controls">
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
      <div className="mt-3 text-xs text-white/60">
        Open team dashboards:{" "}
        {getTeamsInOrder(state).map((team) => (
          <a
            key={team.id}
            href={`/ipl-auction/play?team=${encodeURIComponent(team.id)}`}
            target="_blank"
            rel="noreferrer"
            className="mr-3 text-primary underline"
          >
            {team.name}
          </a>
        ))}
      </div>
    </Section>
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

  const saleCommand = lot
    ? { type: COMMANDS.SELL_PLAYER, playerId: lot.playerId, teamId: saleTeamId, price: Number(salePrice) }
    : null;
  // Dry-run through the engine so the admin sees why a sale would be refused before clicking.
  const salePreview = saleCommand && saleTeamId && actor ? reduce(state, { ...saleCommand, actor }) : null;

  return (
    <Section title="On the block">
      <CurrentLot state={state} />
      {lot && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <div className="text-xs text-white/60">When the hammer falls, pick the winning team and enter the final price.</div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs">
              Winning team
              <select
                className="ml-2 border border-white/30 bg-black px-2 py-1 text-sm"
                value={saleTeamId}
                onChange={(e) => setSaleTeamId(e.target.value)}
              >
                <option value="">Select…</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} (max {formatLakhs(getMaxBid(state, team.id))})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Final price (lakhs)
              <input
                className="ml-2 w-24 border border-white/30 bg-black px-2 py-1 text-sm"
                type="number"
                min={lotPlayer.basePrice}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </label>
            <Button
              variant="primary"
              disabled={!salePreview?.ok || pending}
              onClick={() =>
                send(saleCommand, { success: `SOLD to ${state.teams[saleTeamId].name} for ${formatLakhs(Number(salePrice))}.` })
              }
            >
              SOLD{saleTeamId ? ` to ${state.teams[saleTeamId].name}` : ""} for {formatLakhs(Number(salePrice) || null)}
            </Button>
            <span className="mx-2 h-6 w-px bg-white/20" />
            <Button disabled={pending} onClick={() => send({ type: COMMANDS.MARK_UNSOLD })}>
              UNSOLD
            </Button>
            <Button variant="danger" disabled={pending} onClick={() => send({ type: COMMANDS.WITHDRAW_PLAYER, playerId: lot.playerId })}>
              Withdraw
            </Button>
          </div>
          {salePreview && !salePreview.ok && <p className="text-sm text-red-300">Can&apos;t sell: {salePreview.error.message}</p>}
        </div>
      )}
    </Section>
  );
}
