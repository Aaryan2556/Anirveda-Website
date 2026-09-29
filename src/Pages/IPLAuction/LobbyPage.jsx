/**
 * /ipl-auction — public event page, laid out like the site's other event pages
 * (site navbar, Bebas hero, gold divider, bordered card). It links to no
 * screen: each team gets its own dashboard link from the organisers, and the
 * big screen, summary and controls are admin-only (/ipl-auction/admin).
 */
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import Navbar from "../../components/Navbar";
import { Divider } from "../../components/IPLAuction/ui/controls";

export default function LobbyPage() {
  return (
    <div className="min-h-screen bg-black font-Lato text-white">
      <Navbar />
      <section className="px-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="font-Bebas text-[5.5rem] uppercase leading-none text-primary xs:text-9xl xl:text-[9rem]">IPL Auction</h1>
        <p className="font-Abel text-2xl text-secondary sm:text-3xl">By Anirveda</p>
        <p className="mx-auto mt-4 max-w-2xl font-Abel text-base text-secondary sm:text-xl">
          Teams bid for players live in the room. Every sale is recorded as the hammer falls, and each team&apos;s
          purse and squad update on its dashboard.
        </p>
      </section>
      <Divider className="mb-10" />
      <div className="mx-auto max-w-xl px-4 pb-16">
        <div className="rounded-3xl border border-amber-600/30 bg-tertiary p-6 text-center">
          <LayoutDashboard className="mx-auto mb-3 h-7 w-7 text-primary" aria-hidden="true" />
          <h2 className="mb-2 font-Bebas text-3xl tracking-wide text-primary">Team dashboard</h2>
          <p className="text-secondary">
            Participating teams: open the dashboard link the organisers sent you. It shows your purse, what you can
            still afford, your squad and the player market.
          </p>
        </div>
        <p className="mt-10 text-center text-xs text-secondary/70">
          Looking for the rest of Anirveda?{" "}
          <Link to="/events" className="text-primary underline-offset-2 hover:underline">
            See all events
          </Link>
        </p>
      </div>
    </div>
  );
}
