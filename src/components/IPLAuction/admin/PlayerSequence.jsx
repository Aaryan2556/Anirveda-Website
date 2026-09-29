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
import { Button, inputClass, table } from "../ui/controls";
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
        <span className="text-slate-400">
          Showing {players.length} of {state.playerOrder.length}
        </span>
        <Select value={filter} onChange={setFilter} options={STATUS_FILTERS} aria-label="Filter by status" />
        <input
          className={inputClass}
          placeholder="Search name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className={table.wrap}>
        <table className={table.table}>
          <thead className={table.thead}>
            <tr>
              <th className={table.th}>#</th>
              <th className={table.th}>Player</th>
              <th className={table.th}>Role</th>
              <th className={table.th}>Overseas</th>
              <th className={table.th}>Base</th>
              <th className={table.th}>Status</th>
              <th className={table.th}>Sold to</th>
              <th className={table.th}>Actions</th>
            </tr>
          </thead>
          <tbody className={table.tbody}>
            {players.map(({ player, position }) => (
              <Fragment key={player.id}>
                <tr className={`${player.id === nextInSequence?.id ? "bg-primary/10" : ""}`}>
                  <td className={`${table.td} whitespace-nowrap`}>
                    {position}
                    <button
                      type="button"
                      className="ml-2 px-1 text-slate-400 hover:text-slate-100 disabled:opacity-30"
                      disabled={isCompleted || position === 1 || pending}
                      onClick={() => move(player.id, -1)}
                      aria-label={`Move ${player.name} earlier`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="px-1 text-slate-400 hover:text-slate-100 disabled:opacity-30"
                      disabled={isCompleted || position === state.playerOrder.length || pending}
                      onClick={() => move(player.id, 1)}
                      aria-label={`Move ${player.name} later`}
                    >
                      ↓
                    </button>
                  </td>
                  <td className={table.td}>
                    {player.name}
                    {isFictional(player) && <span className="ml-1 text-amber-300/80">(fictional)</span>}
                  </td>
                  <td className={table.td}>{ROLE_LABELS[player.role]}</td>
                  <td className={table.td}>{player.isOverseas ? "Yes" : "—"}</td>
                  <td className={table.td}>{formatLakhs(player.basePrice)}</td>
                  <td className={table.td}>{player.status}</td>
                  <td className={table.td}>
                    {player.soldTo ? `${state.teams[player.soldTo]?.name} · ${formatLakhs(player.soldPrice)}` : "—"}
                  </td>
                  <td className={`${table.td} space-x-1 whitespace-nowrap`}>
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
                    <td colSpan={8} className={`${table.td} border-t border-slate-800 bg-obsidian-900 p-3`}>
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
