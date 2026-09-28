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
import { PlayerDetails } from "../DevPanels";

const selectClass = "border border-white/30 bg-black px-2 py-1 text-sm";
const STILL_TO_COME = [PLAYER_STATUS.AVAILABLE, PLAYER_STATUS.UNSOLD, PLAYER_STATUS.ON_BLOCK];
const OVERSEAS_OPTIONS = { any: null, overseas: true, domestic: false };

function Eligibility({ state, teamId, player }) {
  if (!STILL_TO_COME.includes(player.status)) return <span className="text-white/30">—</span>;
  const blocked = validateSale(state, teamId, player, player.basePrice);
  return blocked ? (
    <span className="text-red-300" title={blocked.message}>
      No
    </span>
  ) : (
    <span className="text-green-300">Yes</span>
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
      <p className="text-xs text-white/50">
        {rows.length} player{rows.length === 1 ? "" : "s"}. &quot;Can buy&quot; checks your purse, squad, role and overseas
        limits at the base price. Tap a name for details.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-white/50">
            <tr>
              <th className="py-1 pr-3">#</th>
              <th className="pr-3">Player</th>
              <th className="pr-3">Role</th>
              <th className="pr-3">OS</th>
              <th className="pr-3">Base</th>
              <th className="pr-3">Status</th>
              <th className="pr-3">Sold</th>
              <th className="pr-3">Can buy</th>
            </tr>
          </thead>
          <tbody>
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
      <tr className={`border-t border-white/10 ${mine ? "bg-primary/15" : ""}`}>
        <td className="py-1 pr-3 text-white/50">{position}</td>
        <td className="pr-3">
          <button type="button" className="text-left underline decoration-white/20 hover:decoration-white" onClick={onToggle}>
            {player.name}
          </button>
          {isFictional(player) && <span className="ml-1 text-yellow-300/70">(fictional)</span>}
        </td>
        <td className="pr-3">{ROLE_LABELS[player.role]}</td>
        <td className="pr-3">{player.isOverseas ? "Yes" : "—"}</td>
        <td className="whitespace-nowrap pr-3">{formatLakhs(player.basePrice)}</td>
        <td className="pr-3">{player.status}</td>
        <td className="whitespace-nowrap pr-3">{team ? `${team.shortName} · ${formatLakhs(player.soldPrice)}` : "—"}</td>
        <td className="pr-3">
          <Eligibility state={state} teamId={teamId} player={player} />
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="bg-white/5 p-3">
            <PlayerDetails player={player} />
          </td>
        </tr>
      )}
    </>
  );
}
