/**
 * /ipl-auction — public event page, laid out like the site's home hero (site
 * navbar, gold Space Grotesk title, monospace buttons, glass card). Its only
 * way in is Team login: each team signs in and sees only its own dashboard.
 * The big screen, summary and controls are admin-only (/ipl-auction/admin).
 */
import { Link } from "react-router-dom";
import { ArrowRight, LayoutDashboard, Radio, Wallet } from "lucide-react";
import Navbar from "../../components/Navbar";
import { ButtonLink, Divider } from "../../components/IPLAuction/ui/controls";

const FEATURES = [
  { icon: Radio, title: "Live", text: "The player on the block and every sale, the moment the hammer falls." },
  { icon: Wallet, title: "Your purse", text: "What you have left and the most you can pay for the next player." },
  { icon: LayoutDashboard, title: "Your squad", text: "Players bought, role needs and the player market." },
];

export default function LobbyPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-obsidian-900 font-sans text-slate-100">
      <div className="pointer-events-none absolute left-1/4 top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-1/4 top-72 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" aria-hidden="true" />
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-8 sm:pt-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-slate-400">Anirveda // Live auction simulation</p>
        <h1 className="font-Bebas text-6xl uppercase leading-none tracking-[-0.04em] text-primary drop-shadow-[0_0_35px_rgba(212,175,55,0.35)] sm:text-8xl lg:text-9xl">
          IPL Auction
        </h1>
        <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-100 sm:text-2xl lg:text-3xl">By Anirveda</h2>
        <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-300 sm:text-lg">
          Teams bid for players live in the room. Every sale is recorded as the hammer falls, and each team&apos;s
          purse and squad update instantly on its own dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink to="/ipl-auction/play" variant="primary" size="lg">
            Team login <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <span className="font-mono text-xs text-slate-500">Use the team account the organisers gave you.</span>
        </div>
      </section>

      <Divider className="mb-12" />

      <section className="relative mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-3 sm:px-8">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-slate-800 bg-obsidian-800/80 p-6 shadow-glassGlow backdrop-blur-xl">
            <Icon className="mb-3 h-6 w-6 text-gold" aria-hidden="true" />
            <h3 className="mb-1 font-Bebas text-xl font-bold uppercase tracking-tight text-primary">{title}</h3>
            <p className="text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </section>

      <p className="relative pb-12 text-center font-mono text-xs text-slate-500">
        Looking for the rest of Anirveda?{" "}
        <Link to="/events" className="text-gold underline-offset-2 hover:underline">
          See all events
        </Link>
      </p>
    </div>
  );
}
