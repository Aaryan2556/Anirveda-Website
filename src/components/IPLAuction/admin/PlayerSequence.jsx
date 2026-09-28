/**
 * The player pool in auction order: reorder, put up now, withdraw/reinstate,
 * edit profiles, remove (before the start) and cancel sales.
 */
import { Fragment, useMemo, useState } from "react";
import { ROLE_LABELS } from "../../../lib/iplAuction/config";
import {
  AUCTION_STATUS,
  COMMANDS,
  PLAYER_STATUS,
  getNextPlayerInSequence,
  getPlayersInOrder,
} from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { isFictional } from "../../../lib/iplAuction/playerFields";
import { Button } from "../DevPanels";
import PlayerEditor from "./PlayerEditor";
import { ConfirmButton, Select } from "./fields";

const STATUS_FILTERS = ["ALL", ...Object.values(PLAYER_STATUS)].map((value) => ({ value, label: value }));
const EDITABLE = [PLAYER_STATUS.AVAILABLE, PLAYER_STATUS.UNSOLD, PLAYER_STATUS.WITHDRAWN];
const CAN_PUT_UP = [PLAYER_STATUS.AVAILABLE, PLAYER_STATUS.UNSOLD];

export default function PlayerSequence({ state, send, pending, renderSaleAction }) {
  const { status, lot } = state;
  const isLive = status === AUCTION_STATUS.LIVE;
  const isSetup = status === AUCTION_STATUS.SETUP;
  const isCompleted = status === AUCTION_STATUS.COMPLETED;
  const nextInSequence = getNextPlayerInSequence(state);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const players = useMemo(() => {
    const query = search.trim().toLowerCase();
    return getPlayersInOrder(state)
      .map((player, index) => ({ player, position: index + 1 }))
      .filter(({ player }) => filter === "ALL" || player.status === filter)
      .filter(({ player }) => !query || player.name.toLowerCase().includes(query));
  }, [state, filter, search]);

  const move = (playerId, offset) => {
    const order = [...state.playerOrder];
    const from = order.indexOf(playerId);
    const to = from + offset;
    if (to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    send({ type: COMMANDS.REORDER_PLAYERS, playerOrder: order });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-white/60">
          Showing {players.length} of {state.playerOrder.length}
        </span>
        <Select value={filter} onChange={setFilter} options={STATUS_FILTERS} aria-label="Filter by status" />
        <input
          className="border border-white/30 bg-black px-2 py-1 text-sm"
          placeholder="Search name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-white/50">
            <tr>
              <th className="py-1 pr-3">#</th>
              <th className="pr-3">Player</th>
              <th className="pr-3">Role</th>
              <th className="pr-3">Overseas</th>
              <th className="pr-3">Base</th>
              <th className="pr-3">Status</th>
              <th className="pr-3">Sold to</th>
              <th className="pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map(({ player, position }) => (
              <Fragment key={player.id}>
                <tr className={`border-t border-white/10 ${player.id === nextInSequence?.id ? "bg-primary/10" : ""}`}>
                  <td className="whitespace-nowrap py-1 pr-3">
                    {position}
                    <button
                      type="button"
                      className="ml-2 px-1 text-white/60 hover:text-white disabled:opacity-30"
                      disabled={isCompleted || position === 1 || pending}
                      onClick={() => move(player.id, -1)}
                      aria-label={`Move ${player.name} earlier`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="px-1 text-white/60 hover:text-white disabled:opacity-30"
                      disabled={isCompleted || position === state.playerOrder.length || pending}
                      onClick={() => move(player.id, 1)}
                      aria-label={`Move ${player.name} later`}
                    >
                      ↓
                    </button>
                  </td>
                  <td className="pr-3">
                    {player.name}
                    {isFictional(player) && <span className="ml-1 text-yellow-300/70">(fictional)</span>}
                  </td>
                  <td className="pr-3">{ROLE_LABELS[player.role]}</td>
                  <td className="pr-3">{player.isOverseas ? "Yes" : "—"}</td>
                  <td className="pr-3">{formatLakhs(player.basePrice)}</td>
                  <td className="pr-3">{player.status}</td>
                  <td className="pr-3">
                    {player.soldTo ? `${state.teams[player.soldTo]?.name} · ${formatLakhs(player.soldPrice)}` : "—"}
                  </td>
                  <td className="space-x-1 whitespace-nowrap py-1 pr-3">
                    {CAN_PUT_UP.includes(player.status) && (
                      <Button disabled={!isLive || Boolean(lot) || pending} onClick={() => send({ type: COMMANDS.OPEN_LOT, playerId: player.id })}>
                        Put up now
                      </Button>
                    )}
                    {EDITABLE.includes(player.status) && (
                      <Button disabled={isCompleted} onClick={() => setEditingId(editingId === player.id ? null : player.id)}>
                        {editingId === player.id ? "Close" : "Edit"}
                      </Button>
                    )}
                    {CAN_PUT_UP.includes(player.status) && (
                      <Button variant="danger" disabled={pending} onClick={() => send({ type: COMMANDS.WITHDRAW_PLAYER, playerId: player.id })}>
                        Withdraw
                      </Button>
                    )}
                    {player.status === PLAYER_STATUS.WITHDRAWN && (
                      <Button disabled={pending} onClick={() => send({ type: COMMANDS.REINSTATE_PLAYER, playerId: player.id })}>
                        Reinstate
                      </Button>
                    )}
                    {isSetup && (
                      <ConfirmButton
                        label="Remove"
                        confirmLabel="Confirm remove"
                        disabled={pending}
                        onConfirm={() => send({ type: COMMANDS.REMOVE_PLAYER, playerId: player.id }, { success: `${player.name} removed.` })}
                      />
                    )}
                    {player.status === PLAYER_STATUS.SOLD && renderSaleAction?.(player.id)}
                  </td>
                </tr>
                {editingId === player.id && (
                  <tr>
                    <td colSpan={8} className="border-t border-white/10 bg-white/5 p-3">
                      <PlayerEditor player={player} send={send} pending={pending} onDone={() => setEditingId(null)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
