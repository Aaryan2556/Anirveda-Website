/**
 * /ipl-auction/admin — functional admin console. Final design is Phase 8.
 * All business rules live in src/lib/iplAuction.
 *
 * Flow: players come up in sequence, teams bid in the room, and the admin
 * records the result here — SOLD to a team at the hammer price, or UNSOLD.
 */
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminAuth } from "../../lib/iplAuction/hooks/useAdminAuth";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { ROLE_LABELS, ROLE_LIST } from "../../lib/iplAuction/config";
import {
  ACTOR_ROLES,
  AUCTION_STATUS,
  COMMANDS,
  PLAYER_STATUS,
  getMaxBid,
  getNextPlayerInSequence,
  getPlayersInOrder,
  getTeamsInOrder,
  getUndoPreview,
  reduce,
} from "../../lib/iplAuction/engine";
import { formatLakhs } from "../../lib/iplAuction/money";
import { makeId } from "../../lib/iplAuction/repository/mockSeed";
import {
  ActivityLog,
  AuctionHeader,
  Button,
  CurrentLot,
  DevBanner,
  RecentSales,
  Section,
  TeamsTable,
} from "../../components/IPLAuction/DevPanels";

const ADMIN_ACTOR = { role: ACTOR_ROLES.ADMIN };
const STATUS_FILTERS = ["ALL", ...Object.values(PLAYER_STATUS)];

/** Appwrite mode requires a signed-in user with the admin label; local mode needs no login. */
export default function AdminPage() {
  const auth = useAdminAuth();
  if (auth.status === "loading") return <Shell>Checking sign-in…</Shell>;
  if (!auth.isAdmin) return <SignIn auth={auth} />;
  return <AdminConsole auth={auth} />;
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-tertiary px-4 py-6 font-Lato text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-Bebas text-4xl tracking-wide">IPL Auction · Admin</h1>
        {children}
      </div>
    </div>
  );
}

function SignIn({ auth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    await auth.signIn(email, password);
    setBusy(false);
  };
  return (
    <Shell>
      {auth.user ? (
        <div className="space-y-2 border border-red-500/60 p-3 text-sm">
          <p>
            Signed in as <strong>{auth.user.email}</strong>, but this account is not an IPL admin.
          </p>
          <Button onClick={auth.signOut}>Sign out</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-2 border border-white/15 p-4 text-sm">
          <input
            required
            type="email"
            placeholder="Admin email"
            autoComplete="username"
            className="border border-white/30 bg-black px-2 py-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="border border-white/30 bg-black px-2 py-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}
      {auth.error && <p className="text-sm text-red-300">{auth.error}</p>}
    </Shell>
  );
}

function AdminConsole({ auth }) {
  const { state, dispatch, reset, kind } = useAuction();
  const { status, lot } = state;
  const isLive = status === AUCTION_STATUS.LIVE;
  const isSetup = status === AUCTION_STATUS.SETUP;
  const isCompleted = status === AUCTION_STATUS.COMPLETED;
  const teams = getTeamsInOrder(state);
  const undoPreview = getUndoPreview(state);
  const nextInSequence = getNextPlayerInSequence(state);

  const send = async (command, successMessage) => {
    const result = await dispatch({ ...command, actor: ADMIN_ACTOR });
    if (!result.ok) toast.error(result.error.message);
    else if (successMessage) toast.success(successMessage);
    return result;
  };

  // --- Record the result of the room's bidding ---
  const lotPlayer = lot ? state.players[lot.playerId] : null;
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
  const salePreview = saleCommand && saleTeamId ? reduce(state, { ...saleCommand, actor: ADMIN_ACTOR }) : null;
  const recordSale = () => send(saleCommand, `SOLD to ${state.teams[saleTeamId].name} for ${formatLakhs(Number(salePrice))}.`);

  // --- Player sequence ---
  const [filter, setFilter] = useState("ALL");
  const players = useMemo(
    () => getPlayersInOrder(state)
      .map((player, index) => ({ player, position: index + 1 }))
      .filter(({ player }) => filter === "ALL" || player.status === filter),
    [state, filter]
  );
  const move = (playerId, offset) => {
    const order = [...state.playerOrder];
    const from = order.indexOf(playerId);
    const to = from + offset;
    if (to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    send({ type: COMMANDS.REORDER_PLAYERS, playerOrder: order });
  };

  // --- Cancel an earlier sale (two-step confirm) ---
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const cancelSale = async (playerId) => {
    const result = await send({ type: COMMANDS.CANCEL_SALE, playerId }, "Sale cancelled and purse refunded.");
    if (result.ok) setConfirmCancelId(null);
  };
  const cancelSaleButton = (playerId) =>
    confirmCancelId === playerId ? (
      <>
        <Button variant="danger" onClick={() => cancelSale(playerId)}>
          Confirm cancel (clears undo)
        </Button>
        <Button onClick={() => setConfirmCancelId(null)}>Keep</Button>
      </>
    ) : (
      <Button variant="danger" disabled={isCompleted} onClick={() => setConfirmCancelId(playerId)}>
        Cancel sale
      </Button>
    );

  // --- Rules editor (SETUP only) ---
  const [configDraft, setConfigDraft] = useState(() => JSON.stringify(state.config, null, 2));
  useEffect(() => {
    setConfigDraft(JSON.stringify(state.config, null, 2));
  }, [state.config]);
  const applyConfig = () => {
    let parsed;
    try {
      parsed = JSON.parse(configDraft);
    } catch {
      toast.error("Rules are not valid JSON.");
      return;
    }
    send({ type: COMMANDS.UPDATE_CONFIG, config: parsed }, "Rules updated.");
  };

  // --- Add player ---
  const emptyPlayer = { name: "", role: ROLE_LIST[0], basePrice: "20", nationality: "", isOverseas: false };
  const [newPlayer, setNewPlayer] = useState(emptyPlayer);
  const addPlayer = async (event) => {
    event.preventDefault();
    const result = await send({
      type: COMMANDS.ADD_PLAYER,
      player: {
        id: makeId("player"),
        name: newPlayer.name,
        role: newPlayer.role,
        basePrice: Number(newPlayer.basePrice),
        nationality: newPlayer.nationality || null,
        isOverseas: newPlayer.isOverseas,
        dataSource: "MANUAL_ENTRY",
      },
    }, "Player added to the end of the sequence.");
    if (result.ok) setNewPlayer(emptyPlayer);
  };

  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="min-h-screen bg-tertiary px-4 py-6 font-Lato text-white">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-7xl space-y-4">
        <h1 className="font-Bebas text-4xl tracking-wide">IPL Auction · Admin (dev)</h1>
        <DevBanner kind={kind} />
        {auth.user && (
          <div className="flex items-center gap-3 text-xs text-white/60">
            Signed in as {auth.user.email}
            <Button onClick={auth.signOut}>Sign out</Button>
          </div>
        )}
        <AuctionHeader state={state} />

        <Section title="Auction controls">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={!isSetup} onClick={() => send({ type: COMMANDS.START_AUCTION })}>
              Start auction
            </Button>
            <Button
              variant="primary"
              disabled={!isLive || Boolean(lot) || !nextInSequence}
              onClick={() => send({ type: COMMANDS.OPEN_LOT })}
              title={nextInSequence ? `Put up ${nextInSequence.name}` : "No players left in the sequence"}
            >
              Next player{nextInSequence ? `: ${nextInSequence.name}` : ""}
            </Button>
            <Button disabled={!isLive} onClick={() => send({ type: COMMANDS.PAUSE_AUCTION })}>
              Pause
            </Button>
            <Button disabled={status !== AUCTION_STATUS.PAUSED} onClick={() => send({ type: COMMANDS.RESUME_AUCTION })}>
              Resume
            </Button>
            <Button
              disabled={!undoPreview || isCompleted}
              onClick={() => send({ type: COMMANDS.UNDO })}
              title={undoPreview ?? "Nothing to undo"}
            >
              Undo{undoPreview ? `: ${undoPreview}` : ""}
            </Button>
            <Button
              variant="danger"
              disabled={!(isLive || status === AUCTION_STATUS.PAUSED)}
              onClick={() => send({ type: COMMANDS.END_AUCTION })}
            >
              End auction
            </Button>
            {!reset ? null : confirmReset ? (
              <>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await reset();
                    setConfirmReset(false);
                    toast.success("Local auction reset.");
                  }}
                >
                  Confirm: wipe local auction
                </Button>
                <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmReset(true)}>
                Reset local data
              </Button>
            )}
          </div>
          <div className="mt-3 text-xs text-white/60">
            Open team dashboards:{" "}
            {teams.map((team) => (
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

        <Section title="On the block">
          <CurrentLot state={state} />
          {lot && (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <div className="text-xs text-white/60">
                When the hammer falls, pick the winning team and enter the final price.
              </div>
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
                <Button variant="primary" disabled={!salePreview?.ok} onClick={recordSale}>
                  SOLD{saleTeamId ? ` to ${state.teams[saleTeamId].name}` : ""} for {formatLakhs(Number(salePrice) || null)}
                </Button>
                <span className="mx-2 h-6 w-px bg-white/20" />
                <Button onClick={() => send({ type: COMMANDS.MARK_UNSOLD })}>UNSOLD</Button>
                <Button variant="danger" onClick={() => send({ type: COMMANDS.WITHDRAW_PLAYER, playerId: lot.playerId })}>
                  Withdraw
                </Button>
              </div>
              {salePreview && !salePreview.ok && (
                <p className="text-sm text-red-300">Can&apos;t sell: {salePreview.error.message}</p>
              )}
            </div>
          )}
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Recent sales">
            <RecentSales state={state} renderAction={(sale) => cancelSaleButton(sale.playerId)} />
          </Section>
          <Section title="Activity">
            <ActivityLog state={state} />
          </Section>
        </div>

        <Section title="Teams">
          <TeamsTable state={state} />
        </Section>

        <Section
          title={`Player sequence (${players.length})`}
          actions={
            <select
              className="border border-white/30 bg-black px-2 py-1 text-xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          }
        >
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
                  <tr
                    key={player.id}
                    className={`border-t border-white/10 ${player.id === nextInSequence?.id ? "bg-primary/10" : ""}`}
                  >
                    <td className="whitespace-nowrap py-1 pr-3">
                      {position}
                      <button
                        type="button"
                        className="ml-2 px-1 text-white/60 hover:text-white disabled:opacity-30"
                        disabled={isCompleted || position === 1}
                        onClick={() => move(player.id, -1)}
                        aria-label={`Move ${player.name} earlier`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="px-1 text-white/60 hover:text-white disabled:opacity-30"
                        disabled={isCompleted || position === state.playerOrder.length}
                        onClick={() => move(player.id, 1)}
                        aria-label={`Move ${player.name} later`}
                      >
                        ↓
                      </button>
                    </td>
                    <td className="pr-3">
                      {player.name}
                      {player.dataSource === "FICTIONAL" && <span className="ml-1 text-yellow-300/70">(fictional)</span>}
                    </td>
                    <td className="pr-3">{ROLE_LABELS[player.role]}</td>
                    <td className="pr-3">{player.isOverseas ? "Yes" : "—"}</td>
                    <td className="pr-3">{formatLakhs(player.basePrice)}</td>
                    <td className="pr-3">{player.status}</td>
                    <td className="pr-3">
                      {player.soldTo ? `${state.teams[player.soldTo]?.name} · ${formatLakhs(player.soldPrice)}` : "—"}
                    </td>
                    <td className="space-x-1 whitespace-nowrap py-1 pr-3">
                      {(player.status === PLAYER_STATUS.AVAILABLE || player.status === PLAYER_STATUS.UNSOLD) && (
                        <Button
                          disabled={!isLive || Boolean(lot)}
                          onClick={() => send({ type: COMMANDS.OPEN_LOT, playerId: player.id })}
                        >
                          Put up now
                        </Button>
                      )}
                      {(player.status === PLAYER_STATUS.AVAILABLE || player.status === PLAYER_STATUS.UNSOLD) && (
                        <Button
                          variant="danger"
                          onClick={() => send({ type: COMMANDS.WITHDRAW_PLAYER, playerId: player.id })}
                        >
                          Withdraw
                        </Button>
                      )}
                      {player.status === PLAYER_STATUS.WITHDRAWN && (
                        <Button onClick={() => send({ type: COMMANDS.REINSTATE_PLAYER, playerId: player.id })}>
                          Reinstate
                        </Button>
                      )}
                      {player.status === PLAYER_STATUS.SOLD && cancelSaleButton(player.id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Add player">
            <form onSubmit={addPlayer} className="grid gap-2 text-sm">
              <input
                required
                placeholder="Name"
                className="border border-white/30 bg-black px-2 py-1"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                <select
                  className="border border-white/30 bg-black px-2 py-1"
                  value={newPlayer.role}
                  onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                >
                  {ROLE_LIST.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Base price (lakhs)"
                  className="w-40 border border-white/30 bg-black px-2 py-1"
                  value={newPlayer.basePrice}
                  onChange={(e) => setNewPlayer({ ...newPlayer, basePrice: e.target.value })}
                />
                <input
                  placeholder="Nationality"
                  className="w-36 border border-white/30 bg-black px-2 py-1"
                  value={newPlayer.nationality}
                  onChange={(e) => setNewPlayer({ ...newPlayer, nationality: e.target.value })}
                />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={newPlayer.isOverseas}
                    onChange={(e) => setNewPlayer({ ...newPlayer, isOverseas: e.target.checked })}
                  />
                  Overseas
                </label>
              </div>
              <div>
                <Button variant="primary" type="submit" disabled={isCompleted}>
                  Add player
                </Button>
              </div>
            </form>
          </Section>

          <Section
            title="Rules (editable before start)"
            actions={
              <Button variant="primary" disabled={!isSetup} onClick={applyConfig}>
                Apply rules
              </Button>
            }
          >
            <p className="mb-2 text-xs text-white/60">
              Temporary development defaults — not final event rules. All money in whole lakhs (₹1 Cr = 100).
            </p>
            <textarea
              className="h-72 w-full border border-white/30 bg-black p-2 font-mono text-xs"
              value={configDraft}
              readOnly={!isSetup}
              onChange={(e) => setConfigDraft(e.target.value)}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
