/**
 * /ipl-auction/admin/screen — admin-only projector view for the room: the player on
 * the block, a SOLD announcement when the admin records a sale, what is coming
 * up and every team's purse. Sends no commands.
 */
import { useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
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
  SoldBanner,
  useSoldAnnouncement,
} from "../../components/IPLAuction/ui/auction";



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
