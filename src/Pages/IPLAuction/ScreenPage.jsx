/**
 * /ipl-auction/admin/screen — admin-only projector view for the room: the
 * player on the block at room scale (photo, name, tags, base price) and the
 * SOLD announcement when the admin records a sale. Sends no commands; the
 * screen follows the admin console.
 */
import RequireAdmin from "../../components/IPLAuction/admin/RequireAdmin";
import BigScreen from "../../components/IPLAuction/screen/BigScreen";

/** Admins only: opened from the admin console on the projector laptop. */
export default function ScreenPage() {
  return <RequireAdmin title="Big screen">{() => <BigScreen />}</RequireAdmin>;
}
