/**
 * /ipl-auction — lobby: what the event is, where it stands, and the way into
 * each screen. Laid out like the site's other event pages (site navbar, Bebas
 * hero, gold divider, bordered cards).
 */
import { Link } from "react-router-dom";
import { ArrowRight, LayoutDashboard, MonitorPlay, ShieldCheck, Trophy } from "lucide-react";
import Navbar from "../../components/Navbar";
import { getAuctionSummary, getTeamsInOrder } from "../../lib/iplAuction/engine";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { ButtonLink, Divider } from "../../components/IPLAuction/ui/controls";
import { ConnectionIndicator, FictionalNotice, StatusBadge } from "../../components/IPLAuction/ui/auction";

export default function LobbyPage() {
  const { mode, reason } = getAuctionMode();
  return (
    <div className="min-h-screen bg-black font-Lato text-white">
      <Navbar />
      <section className="px-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="font-Bebas text-[5.5rem] uppercase leading-none text-primary xs:text-9xl xl:text-[9rem]">IPL Auction</h1>
        <p className="font-Abel text-2xl text-secondary sm:text-3xl">By Anirveda</p>
        <p className="mx-auto mt-4 max-w-2xl font-Abel text-base text-secondary sm:text-xl">
          Teams bid for players live in the room. Every sale is recorded here as the hammer falls, and purses,
          squads and results update on every screen.
        </p>
      </section>
      <Divider className="mb-10" />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        {mode === AUCTION_MODES.DISABLED ? (
          <p className="text-center text-secondary">The auction is not available right now: {reason}</p>
        ) : (
          <Lobby />
        )}
      </div>
    </div>
  );
}

function EntryCard({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col rounded-3xl border border-amber-600/30 bg-tertiary p-6">
      <Icon className="mb-3 h-7 w-7 text-primary" aria-hidden="true" />
      <h2 className="mb-2 font-Bebas text-3xl tracking-wide text-primary">{title}</h2>
      <p className="mb-5 flex-1 text-secondary">{text}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Lobby() {
  const { state } = useAuction();
  const { players } = getAuctionSummary(state);
  const teams = getTeamsInOrder(state);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-secondary">
        <span className="font-Abel text-lg text-white">{state.name}</span>
        <StatusBadge status={state.status} />
        <span>
          {teams.length} teams · {players.total} players · {players.byStatus.SOLD} sold
        </span>
        <ConnectionIndicator />
      </div>
      <FictionalNotice state={state} />

      <div className="grid gap-6 md:grid-cols-2">
        <EntryCard
          icon={LayoutDashboard}
          title="Team dashboard"
          text="Your purse, what you can still afford, your squad and needs, the player market and every other team."
        >
          {teams.map((team) => (
            <ButtonLink key={team.id} to={`/ipl-auction/play?team=${encodeURIComponent(team.id)}`}>
              {team.name}
            </ButtonLink>
          ))}
        </EntryCard>
        <EntryCard
          icon={MonitorPlay}
          title="Big screen"
          text="For the projector: the player on the block with photo and statistics, SOLD announcements and every team's purse."
        >
          <ButtonLink to="/ipl-auction/screen" variant="primary">
            Open big screen <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </EntryCard>
        <EntryCard
          icon={Trophy}
          title="Summary"
          text="Final squads, spend and role mix, and the most expensive buys. Updated after every sale."
        >
          <ButtonLink to="/ipl-auction/summary">
            View summary <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </EntryCard>
        <EntryCard icon={ShieldCheck} title="Organisers" text="Run the auction: player sequence, hammer, corrections, rules and exports.">
          <ButtonLink to="/ipl-auction/admin" variant="default">
            Admin console
          </ButtonLink>
        </EntryCard>
      </div>

      <p className="mt-10 text-center text-xs text-secondary/70">
        Looking for the rest of Anirveda?{" "}
        <Link to="/events" className="text-primary underline-offset-2 hover:underline">
          See all events
        </Link>
      </p>
    </>
  );
}
