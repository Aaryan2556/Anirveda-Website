/**
 * /ipl-auction/admin/screen — admin-only projector view for the room: the player on
 * the block, a SOLD announcement when the admin records a sale, what is coming
 * up and every team's purse. Sends no commands.
 */
import { useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { useAuction } from "../../lib/iplAuction/hooks/useAuction";
import { formatLakhs } from "../../lib/iplAuction/money";
import RequireAdmin from "../../components/IPLAuction/admin/RequireAdmin";
import { Page, PageHeader, Panel } from "../../components/IPLAuction/ui/controls";
import {
  AuctionStatus,
  CurrentLot,
  FictionalNotice,
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

  return (
    <MotionConfig reducedMotion="user">
      <Page wide>
        <PageHeader title="IPL Auction" eyebrow={`Anirveda · ${state.name}`}>
          <AuctionStatus state={state} />
        </PageHeader>
        <FictionalNotice state={state} />

        <div className="flex justify-center items-center xl:min-h-[60vh]">
          <Panel className="w-full max-w-4xl">
            <CurrentLot state={state} large hideLiveBid />
          </Panel>
        </div>
      </Page>
      <div role="status" aria-live="assertive" className="sr-only">
        {sold ? `Sold: ${sold.player.name} to ${sold.team.name} for ${formatLakhs(sold.price)}` : ""}
      </div>
      <SoldBanner sale={sold} />
    </MotionConfig>
  );
}
