/**
 * /ipl-auction/admin/screen — admin-only projector view for the room: the player on
 * the block, a SOLD announcement when the admin records a sale, what is coming
 * up and every team's purse. Sends no commands.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { getRecentSales } from "../../lib/iplAuction/engine";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { formatLakhs } from "../../lib/iplAuction/money";
import RequireAdmin from "../../components/IPLAuction/admin/RequireAdmin";
import { Page, PageHeader, Panel } from "../../components/IPLAuction/ui/controls";
import {
  AuctionStatus,
  CurrentLot,
  FictionalNotice,
  PurseStrip,
  RecentSales,
} from "../../components/IPLAuction/ui/auction";

const SOLD_BANNER_MS = 6000;

/**
 * Shows a sale for a few seconds when it arrives. Only purchases newer than any
 * seen so far count (purchase `seq` never goes back), so opening the page, an
 * UNDO or a cancelled sale never re-announces an older sale.
 */
function useSoldAnnouncement(state) {
  const [latest] = getRecentSales(state, 1);
  const latestSeq = latest?.seq ?? 0;
  const latestRef = useRef(latest);
  latestRef.current = latest;
  const seenSeq = useRef(latestSeq);
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (latestSeq <= seenSeq.current) return undefined;
    seenSeq.current = latestSeq;
    setShown(latestRef.current);
    const timer = setTimeout(() => setShown(null), SOLD_BANNER_MS);
    return () => clearTimeout(timer);
  }, [latestSeq]);

  // An undone sale must not stay on screen.
  return shown && state.purchases.some((purchase) => purchase.id === shown.id) ? shown : null;
}

function SoldBanner({ sale }) {
  return (
    <AnimatePresence>
      {sale && (
        <motion.div
          key={sale.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/85 px-6"
        >
          <div className="w-full max-w-4xl rounded-xl border-2 border-primary bg-obsidian-800 px-8 py-10 text-center">
            <p className="font-Bebas text-[6rem] font-bold uppercase leading-none tracking-[-0.04em] text-primary drop-shadow-[0_0_35px_rgba(212,175,55,0.45)] sm:text-[9rem]">Sold</p>
            <p className="mt-2 font-Bebas text-4xl font-bold uppercase tracking-tight text-slate-100 sm:text-5xl">{sale.player.name}</p>
            <p className="mt-4 font-sans text-2xl text-slate-400 sm:text-3xl">
              to <span className="text-slate-100">{sale.team.name}</span> for{" "}
              <span className="font-mono text-4xl font-bold text-gold sm:text-5xl">{formatLakhs(sale.price)}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Admins only: opened from the admin console on the projector laptop. */
export default function ScreenPage() {
  return <RequireAdmin title="Big screen">{() => <BigScreen />}</RequireAdmin>;
}

function BigScreen() {
  const { state } = useAuction();
  const sold = useSoldAnnouncement(state);
  const [latest] = getRecentSales(state, 1);

  return (
    <MotionConfig reducedMotion="user">
      <Page wide>
        <PageHeader title="IPL Auction" eyebrow={`Anirveda · ${state.name}`}>
          <AuctionStatus state={state} />
        </PageHeader>
        <FictionalNotice state={state} />

        <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
          <Panel className="xl:min-h-[60vh]">
            <CurrentLot state={state} large />
          </Panel>
          <div className="space-y-4">
            <Panel title="Last sale">
              {latest ? (
                <div aria-live="polite">
                  <p className="font-Bebas text-3xl font-bold uppercase leading-none tracking-tight text-slate-100">{latest.player.name}</p>
                  <p className="mt-1 text-slate-400">
                    {latest.team.name} ·{" "}
                    <span className="font-mono text-2xl font-bold text-gold">{formatLakhs(latest.price)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No players sold yet.</p>
              )}
            </Panel>
            <Panel title="Recent sales" className="hidden xl:block">
              <RecentSales state={state} limit={5} />
            </Panel>
          </div>
        </div>

        <div className="mt-4">
          <PurseStrip state={state} />
        </div>
      </Page>
      <div role="status" aria-live="assertive" className="sr-only">
        {sold ? `Sold: ${sold.player.name} to ${sold.team.name} for ${formatLakhs(sold.price)}` : ""}
      </div>
      <SoldBanner sale={sold} />
    </MotionConfig>
  );
}
