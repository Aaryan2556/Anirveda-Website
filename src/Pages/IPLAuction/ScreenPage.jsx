/**
 * /ipl-auction/screen — read-only projector view for the room: the player on
 * the block, a SOLD announcement when the admin records a sale, what is coming
 * up and every team's purse. Sends no commands.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { getRecentSales } from "../../lib/iplAuction/engine";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { formatLakhs } from "../../lib/iplAuction/money";
import { AUCTION_MODES, getAuctionMode } from "../../lib/iplAuction/repository";
import { Page, PageHeader, Panel } from "../../components/IPLAuction/ui/controls";
import {
  AuctionStatus,
  CurrentLot,
  FictionalNotice,
  PurseStrip,
  RecentSales,
  UpcomingPlayers,
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
          <div className="w-full max-w-4xl rounded-lg border-2 border-primary bg-tertiary px-8 py-10 text-center">
            <p className="font-Bebas text-[7rem] leading-none tracking-wider text-primary sm:text-[10rem]">Sold</p>
            <p className="mt-2 font-Bebas text-5xl tracking-wide text-white sm:text-6xl">{sale.player.name}</p>
            <p className="mt-4 font-Abel text-2xl text-secondary sm:text-3xl">
              to <span className="text-white">{sale.team.name}</span> for{" "}
              <span className="font-Bebas text-5xl tracking-wide text-primary">{formatLakhs(sale.price)}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ScreenPage() {
  const { mode, reason } = getAuctionMode();
  if (mode === AUCTION_MODES.DISABLED) {
    return (
      <Page>
        <PageHeader title="Big screen" />
        <p className="text-secondary">IPL Auction is not available: {reason}</p>
      </Page>
    );
  }
  return <BigScreen />;
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
                  <p className="font-Bebas text-4xl leading-none tracking-wide text-white">{latest.player.name}</p>
                  <p className="mt-1 text-secondary">
                    {latest.team.name} ·{" "}
                    <span className="font-Bebas text-3xl tracking-wide text-primary">{formatLakhs(latest.price)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-secondary/70">No players sold yet.</p>
              )}
            </Panel>
            <Panel title="Up next">
              <UpcomingPlayers state={state} limit={6} />
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
