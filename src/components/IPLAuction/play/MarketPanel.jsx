/**
 * Team dashboard, market view: the whole player pool with filters, sold
 * prices, and (for players still to come) whether this team could buy them
 * right now at their base price — the engine's own sale check.
 */
import { useState } from "react";
import { ROLE_LABELS, ROLE_LIST } from "../../../lib/iplAuction/config";
import { PLAYER_STATUS, getMarket, validateSale } from "../../../lib/iplAuction/engine";
import { formatLakhs } from "../../../lib/iplAuction/money";
import { isFictional } from "../../../lib/iplAuction/playerFields";
import { inputClass, table } from "../ui/controls";
import { PlayerHero } from "../ui/auction";

const selectClass = inputClass;
const STILL_TO_COME = [PLAYER_STATUS.AVAILABLE, PLAYER_STATUS.UNSOLD, PLAYER_STATUS.ON_BLOCK];
const OVERSEAS_OPTIONS = { any: null, overseas: true, domestic: false };

function Eligibility({ state, teamId, player }) {
  if (!STILL_TO_COME.includes(player.status)) return <span className="text-slate-500">—</span>;
  const blocked = validateSale(state, teamId, player, player.basePrice);
  return blocked ? (
    <span className="text-red-300" title={blocked.message}>
      No
    </span>
  ) : (
    <span className="text-neon-emerald">Yes</span>
  );
}

export default function MarketPanel({ state, teamId }) {
  const [status, setStatus] = useState(PLAYER_STATUS.AVAILABLE);
  const [role, setRole] = useState("ALL");
  const [overseas, setOverseas] = useState("any");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const rows = getMarket(state, { status, role, overseas: OVERSEAS_OPTIONS[overseas], query });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="ALL">All players</option>
          <option value={PLAYER_STATUS.AVAILABLE}>Still to come</option>
          <option value={PLAYER_STATUS.SOLD}>Sold</option>
          <option value={PLAYER_STATUS.UNSOLD}>Unsold</option>
          <option value={PLAYER_STATUS.WITHDRAWN}>Withdrawn</option>
        </select>
        <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="ALL">All roles</option>
          {ROLE_LIST.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select className={selectClass} value={overseas} onChange={(e) => setOverseas(e.target.value)} aria-label="Overseas">
          <option value="any">Overseas + domestic</option>
          <option value="overseas">Overseas only</option>
          <option value="domestic">Domestic only</option>
        </select>
        <input
          className={`${selectClass} min-w-0 flex-1 sm:flex-none`}
          placeholder="Search name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <p className="text-xs text-slate-500">
        {rows.length} player{rows.length === 1 ? "" : "s"}. &quot;Can buy&quot; checks your purse, squad, role and overseas
        limits at the base price. Tap a name for details.
      </p>
      <div className={table.wrap}>
        <table className={table.table}>
          <thead className={table.thead}>
            <tr>
              <th className={table.th}>#</th>
              <th className={table.th}>Player</th>
              <th className={table.th}>Role</th>
              <th className={table.th}>OS</th>
              <th className={table.th}>Base</th>
              <th className={table.th}>Status</th>
              <th className={table.th}>Sold</th>
              <th className={table.th}>Can buy</th>
            </tr>
          </thead>
          <tbody className={table.tbody}>
            {rows.map(({ player, position, team }) => (
              <MarketRow
                key={player.id}
                {...{ state, teamId, player, position, team }}
                open={openId === player.id}
                onToggle={() => setOpenId(openId === player.id ? null : player.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarketRow({ state, teamId, player, position, team, open, onToggle }) {
  const mine = player.soldTo === teamId;
  return (
    <>
      <tr className={`${mine ? "bg-primary/10" : ""}`}>
        <td className={`${table.td} text-slate-500`}>{position}</td>
        <td className={table.td}>
          <button type="button" className="text-left underline decoration-slate-600 hover:text-primary hover:decoration-primary" onClick={onToggle}>
            {player.name}
          </button>
          {isFictional(player) && <span className="ml-1 text-amber-300/80">(fictional)</span>}
        </td>
        <td className={table.td}>{ROLE_LABELS[player.role]}</td>
        <td className={table.td}>{player.isOverseas ? "Yes" : "—"}</td>
        <td className={`${table.td} whitespace-nowrap`}>{formatLakhs(player.basePrice)}</td>
        <td className={table.td}>{player.status}</td>
        <td className={`${table.td} whitespace-nowrap`}>{team ? `${team.shortName} · ${formatLakhs(player.soldPrice)}` : "—"}</td>
        <td className={table.td}>
          <Eligibility state={state} teamId={teamId} player={player} />
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className={`${table.td} bg-obsidian-900 p-3`}>
            <PlayerHero player={player} />
          </td>
        </tr>
      )}
    </>
  );
}
