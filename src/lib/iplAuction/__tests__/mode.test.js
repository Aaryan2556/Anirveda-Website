import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AUCTION_MODES, resolveAuctionMode } from "../repository/mode.js";

describe("auction mode (Phase 7 production gate)", () => {
  it("development defaults to the local adapter", () => {
    assert.equal(resolveAuctionMode({ isProduction: false }).mode, AUCTION_MODES.LOCAL);
    assert.equal(resolveAuctionMode({ adapter: "local", isProduction: false }).mode, AUCTION_MODES.LOCAL);
  });

  it("a production build never uses the local adapter (no no-login admin, no reset)", () => {
    for (const adapter of [undefined, "", "local"]) {
      const result = resolveAuctionMode({ adapter, isProduction: true });
      assert.equal(result.mode, AUCTION_MODES.DISABLED);
      assert.ok(result.reason);
    }
  });

  it("appwrite mode needs a database ID, in development and production", () => {
    for (const isProduction of [false, true]) {
      assert.equal(resolveAuctionMode({ adapter: "appwrite", databaseId: "ipl", isProduction }).mode, AUCTION_MODES.APPWRITE);
      const missing = resolveAuctionMode({ adapter: "appwrite", databaseId: "", isProduction });
      assert.equal(missing.mode, AUCTION_MODES.DISABLED);
      assert.match(missing.reason, /VITE_IPL_AUCTION_DATABASE_ID/);
    }
  });

  it("an unknown adapter name is disabled rather than silently local", () => {
    const result = resolveAuctionMode({ adapter: "apwrite", databaseId: "ipl", isProduction: false });
    assert.equal(result.mode, AUCTION_MODES.DISABLED);
    assert.match(result.reason, /apwrite/);
  });
});
